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
    let cancelled = false;
    const attempt = (retries: number) => {
      api.post('/auth/dev-login')
        .then((res) => {
          if (cancelled) return;
          const data = res.data?.data;
          if (data?.access_token && data?.user) {
            setAuth(data.user, data.access_token);
          }
          setReady(true);
        })
        .catch((err) => {
          if (cancelled) return;
          if (retries > 0) {
            setTimeout(() => attempt(retries - 1), 2000);
          } else {
            console.error('Dev auto-login failed:', err);
            setReady(true);
          }
        });
    };
    attempt(3);
    return () => { cancelled = true; };
  }, [setAuth]);

  return ready;
}
