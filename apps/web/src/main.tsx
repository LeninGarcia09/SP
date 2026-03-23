import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { useDevAuth } from './hooks/use-dev-auth';
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

function Root() {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
