import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
const redirectUri = import.meta.env.VITE_AZURE_AD_REDIRECT_URI || window.location.origin;

/** True when Azure AD env vars are configured */
export const isMsalEnabled = Boolean(clientId);

const msalConfig: Configuration = {
  auth: {
    clientId: clientId || 'not-configured',
    // Multi-tenant + personal accounts: use 'common' authority
    authority: 'https://login.microsoftonline.com/common',
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Scopes requested when acquiring tokens for the backend API.
 * Uses the raw client ID as audience (required for personal account support).
 */
export const apiScopes = clientId ? [`${clientId}/.default`] : [];
