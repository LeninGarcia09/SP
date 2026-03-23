import { create } from 'zustand';
import { UserRole } from '@bizops/shared';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

type AuthMode = 'dev' | 'msal';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  mode: AuthMode;
  setAuth: (user: AuthUser, token: string) => void;
  setMode: (mode: AuthMode) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  mode: 'dev',
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true });
  },
  setMode: (mode) => set({ mode }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
