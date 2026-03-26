import { useEffect, useState, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useAuthStore } from '../store/auth-store';
import { apiScopes } from '../lib/msal';
import { api } from '../lib/axios';

const REDIRECT_LOOP_KEY = 'msal_redirect_attempt';

/**
 * Hook that handles the MSAL login flow:
 * 1. Wait for MSAL to initialise and check if user is already logged in.
 * 2. If not, trigger a redirect login.
 * 3. Once authenticated, acquire a token silently and sync user info via backend.
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
      // Call backend to get/create user from the Azure AD token
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = res.data?.data;
      if (user) {
        setAuth(user, accessToken);
        setMode('msal');
      }
      // Clear redirect loop counter on success
      sessionStorage.removeItem(REDIRECT_LOOP_KEY);
    },
    [setAuth, setMode],
  );

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    if (didRun.current) return;
    didRun.current = true;

    if (!isAuthenticated || accounts.length === 0) {
      // Guard against redirect loops — max 2 attempts
      const attempts = Number(sessionStorage.getItem(REDIRECT_LOOP_KEY) ?? '0');
      if (attempts >= 2) {
        console.error('MSAL redirect loop detected — stopping after', attempts, 'attempts');
        sessionStorage.removeItem(REDIRECT_LOOP_KEY);
        setError('Authentication failed after multiple attempts. Please clear your browser cache and try again.');
        setReady(true);
        return;
      }
      sessionStorage.setItem(REDIRECT_LOOP_KEY, String(attempts + 1));

      // Not logged in → redirect to Microsoft login
      instance.loginRedirect({ scopes: apiScopes }).catch((err) => {
        console.error('MSAL login redirect failed:', err);
        setError(String(err));
        setReady(true);
      });
      return;
    }

    // We have an account — acquire token silently
    const account = accounts[0]!;
    instance
      .acquireTokenSilent({ scopes: apiScopes, account })
      .then((response) => syncUser(response.accessToken))
      .then(() => setReady(true))
      .catch(async (err) => {
        if (err instanceof InteractionRequiredAuthError) {
          // Guard against consent redirect loops
          const attempts = Number(sessionStorage.getItem(REDIRECT_LOOP_KEY) ?? '0');
          if (attempts >= 2) {
            console.error('MSAL consent redirect loop detected');
            sessionStorage.removeItem(REDIRECT_LOOP_KEY);
            setError('Consent required but failed. An admin may need to grant consent for this application.');
            setReady(true);
            return;
          }
          sessionStorage.setItem(REDIRECT_LOOP_KEY, String(attempts + 1));
          try {
            await instance.acquireTokenRedirect({ scopes: apiScopes, account });
            // After redirect we'll come back and re-run this effect
          } catch (e) {
            console.error('MSAL interactive auth failed:', e);
            setError(String(e));
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
    sessionStorage.removeItem(REDIRECT_LOOP_KEY);
    instance.logoutRedirect();
  }, [instance]);

  return { ready, logout, error };
}
