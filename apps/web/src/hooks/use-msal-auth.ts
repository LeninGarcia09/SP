import { useEffect, useState, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useAuthStore } from '../store/auth-store';
import { apiScopes, loginScopes } from '../lib/msal';
import { api } from '../lib/axios';

/**
 * Hook that handles the MSAL login flow:
 * 1. Wait for MSAL to initialise and process any redirect response.
 * 2. If not logged in, trigger a redirect login with basic scopes.
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
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = res.data?.data;
      if (user) {
        setAuth(user, accessToken);
        setMode('msal');
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
      // Not logged in — redirect to Microsoft login with basic scopes only.
      // API scopes are acquired separately via acquireTokenSilent after login.
      instance.loginRedirect({ scopes: loginScopes }).catch((err) => {
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
          // API scope needs consent — use popup to avoid another full redirect
          try {
            const response = await instance.acquireTokenPopup({ scopes: apiScopes, account });
            await syncUser(response.accessToken);
            setReady(true);
          } catch (e) {
            console.error('MSAL consent popup failed:', e);
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
