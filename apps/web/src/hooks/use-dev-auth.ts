import { useEffect, useState, useCallback } from 'react';
import { UserRole } from '@bizops/shared';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/auth-store';

/**
 * In development, auto-login by calling POST /api/v1/auth/dev-login
 * and storing the JWT + user info in the auth store. Runs once on app mount.
 * Supports switching roles via switchRole().
 */
export function useDevAuth() {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginAs = useCallback((role?: UserRole) => {
    return api.post('/auth/dev-login', role ? { role } : {})
      .then((res) => {
        const data = res.data?.data;
        if (data?.access_token && data?.user) {
          setAuth(data.user, data.access_token);
        }
        return data?.user;
      });
  }, [setAuth]);

  useEffect(() => {
    let cancelled = false;
    const attempt = (retries: number) => {
      loginAs()
        .then(() => {
          if (!cancelled) setReady(true);
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
  }, [loginAs]);

  return { ready, switchRole: loginAs };
}
