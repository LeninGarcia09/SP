import { useEffect, useState, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useAuthStore } from '../store/auth-store';
import { apiScopes } from '../lib/msal';
import { api } from '../lib/axios';

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
    },
    [setAuth, setMode],
  );

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    if (!isAuthenticated || accounts.length === 0) {
      // Not logged in → redirect to Microsoft login
      instance.loginRedirect({ scopes: apiScopes }).catch((err) => {
        console.error('MSAL login redirect failed:', err);
        setReady(true); // Allow UI to render (will show error state)
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
          // Token expired or consent required → interactive
          try {
            await instance.acquireTokenRedirect({ scopes: apiScopes, account });
            // After redirect we'll come back and re-run this effect
          } catch (e) {
            console.error('MSAL interactive auth failed:', e);
            setReady(true);
          }
        } else {
          console.error('MSAL acquireTokenSilent failed:', err);
          setReady(true);
        }
      });
  }, [inProgress, isAuthenticated, accounts, instance, syncUser]);

  const logout = useCallback(() => {
    useAuthStore.getState().logout();
    instance.logoutRedirect();
  }, [instance]);

  return { ready, logout };
}
