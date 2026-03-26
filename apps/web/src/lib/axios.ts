import axios from 'axios';
import { msalInstance, apiScopes, isMsalEnabled } from './msal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor — acquires token from MSAL when enabled, otherwise uses localStorage
api.interceptors.request.use(async (config) => {
  if (isMsalEnabled) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: apiScopes,
          account: accounts[0]!,
        });
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      } catch {
        // Token refresh failed — let the response interceptor handle 401
      }
    }
  } else {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401 by clearing stale token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  },
);
