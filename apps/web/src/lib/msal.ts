import { PublicClientApplication, Configuration, LogLevel, EventType } from '@azure/msal-browser';

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

/** Scopes for login (ID token — always works, no consent required) */
export const loginScopes = ['openid', 'profile', 'email'];

/**
 * Scopes requested when acquiring tokens for the backend API.
 * Uses the explicit access_as_user scope (user-consentable, no admin consent needed).
 */
export const apiScopes = clientId ? [`api://${clientId}/access_as_user`] : [];

/**
 * Initialize MSAL and process any pending redirect response.
 * MUST be awaited before React renders to avoid auth state race conditions.
 */
export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize();

  // Process redirect response (if we're returning from Azure AD login)
  const response = await msalInstance.handleRedirectPromise();
  if (response) {
    // Set the account from the redirect response as active
    msalInstance.setActiveAccount(response.account);
  } else {
    // No redirect response — check for cached accounts
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0] ?? null);
    }
  }

  // Listen for login success events to keep active account updated
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as { account?: { homeAccountId: string } };
      if (payload.account) {
        const account = msalInstance.getAllAccounts().find(
          (a) => a.homeAccountId === payload.account!.homeAccountId,
        );
        if (account) {
          msalInstance.setActiveAccount(account);
        }
      }
    }
  });
}
