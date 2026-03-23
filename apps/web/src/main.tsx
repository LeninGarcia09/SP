import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MsalProvider } from '@azure/msal-react';
import { App } from './App';
import { useDevAuth } from './hooks/use-dev-auth';
import { useMsalAuth } from './hooks/use-msal-auth';
import { msalInstance, isMsalEnabled } from './lib/msal';
import './i18n';
import './index.css';

import { useTranslation } from 'react-i18next';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/** Dev-mode root — uses local JWT dev-login */
function DevRoot() {
  const { ready } = useDevAuth();
  const { t } = useTranslation();
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {t('auth.authenticating')}
      </div>
    );
  }
  return <App />;
}

/** Production root — uses MSAL / Azure AD */
function MsalRoot() {
  const { ready } = useMsalAuth();
  const { t } = useTranslation();
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {t('auth.authenticating')}
      </div>
    );
  }
  return <App />;
}

function Root() {
  if (isMsalEnabled) {
    return (
      <MsalProvider instance={msalInstance}>
        <MsalRoot />
      </MsalProvider>
    );
  }
  return <DevRoot />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
