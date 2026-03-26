import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
const redirectUri = import.meta.env.VITE_AZURE_AD_REDIRECT_URI || window.location.origin;

/** True when Azure AD env vars are configured */
export const isMsalEnabled = Boolean(clientId);

const msalConfig: Configuration = {
  auth: {
    clientId: clientId || 'not-configured',
    // Multi-tenant: accept any Azure AD org tenant
    authority: 'https://login.microsoftonline.com/organizations',
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
 * Uses the explicit access_as_user scope (user-consentable, no admin consent needed).
 */
export const apiScopes = clientId ? [`api://${clientId}/access_as_user`] : [];
