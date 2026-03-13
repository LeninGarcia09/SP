import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/auth-store';

/**
 * In development, auto-login by calling POST /api/v1/auth/dev-login
 * and storing the JWT + user info in the auth store. Runs once on app mount.
 */
export function useDevAuth() {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    // Always fetch a fresh token on mount to avoid stale/expired tokens
    api.post('/auth/dev-login')
      .then((res) => {
        const data = res.data?.data;
        if (data?.access_token && data?.user) {
          setAuth(data.user, data.access_token);
        }
        setReady(true);
      })
      .catch((err) => {
        console.error('Dev auto-login failed:', err);
        setReady(true);
      });
  }, [setAuth]);

  return ready;
}
