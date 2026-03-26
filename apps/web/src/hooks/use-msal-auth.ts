import { useEffect, useState, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useAuthStore } from '../store/auth-store';
import { apiScopes, loginScopes } from '../lib/msal';
import { api } from '../lib/axios';

/**
 * Hook that handles the MSAL login flow:
 * 1. Wait for MSAL to initialise and process any redirect response.
 * 2. If not logged in, redirect to login with login + API scopes (consent in one step).
 * 3. Once authenticated, acquire an API token silently and sync user via backend.
 */
export function useMsalAuth() {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setMode = useAuthStore((s) => s.setMode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didRun = useRef(false);

  const syncUser = useCallback(
    async (accessToken: string) => {
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const user = res.data?.data;
        if (user) {
          setAuth(user, accessToken);
          setMode('msal');
        }
      } catch (err) {
        // On 401, call debug endpoint to see token claims
        try {
          const debug = await api.get('/system/debug-token', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.error('Token debug info:', debug.data);
          throw new Error(`401 from /auth/me. Token aud=${debug.data?.claims?.aud}, expected=${debug.data?.expectedAudience}, tid=${debug.data?.claims?.tid}, scp=${debug.data?.claims?.scp}`);
        } catch (debugErr) {
          if (debugErr instanceof Error && debugErr.message.startsWith('401')) throw debugErr;
          throw err;
        }
      }
    },
    [setAuth, setMode],
  );

  useEffect(() => {
    // Wait until MSAL finishes any in-progress interaction (including redirect handling)
    if (inProgress !== InteractionStatus.None) return;
    if (didRun.current) return;
    didRun.current = true;

    if (!isAuthenticated || accounts.length === 0) {
      // Not logged in — redirect with both login + API scopes so consent happens once.
      instance.loginRedirect({ scopes: [...loginScopes, ...apiScopes] }).catch((err) => {
        console.error('MSAL loginRedirect failed:', err);
        setError(String(err));
        setReady(true);
      });
      return;
    }

    // User is authenticated — acquire API token silently
    const account = accounts[0]!;
    instance
      .acquireTokenSilent({ scopes: apiScopes, account })
      .then((response) => syncUser(response.accessToken))
      .then(() => setReady(true))
      .catch(async (err) => {
        if (err instanceof InteractionRequiredAuthError) {
          // Consent expired or revoked — redirect (not popup, avoids blockers)
          try {
            await instance.acquireTokenRedirect({ scopes: apiScopes, account });
          } catch (e) {
            console.error('MSAL consent redirect failed:', e);
            setError(`API access consent failed: ${e}`);
            setReady(true);
          }
        } else {
          console.error('MSAL acquireTokenSilent failed:', err);
          setError(String(err));
          setReady(true);
        }
      });
  }, [inProgress, isAuthenticated, accounts, instance, syncUser]);

  const logout = useCallback(() => {
    useAuthStore.getState().logout();
    instance.logoutRedirect();
  }, [instance]);

  return { ready, logout, error };
}
