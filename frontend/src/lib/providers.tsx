'use client';

import { useState, useCallback, type ReactNode, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from './auth-provider';
import type { Locale } from '@/i18n';

// ──────────────── React Query Provider ────────────────
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// ──────────────── Locale Context ────────────────
interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ar-TN',
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

// ──────────────── Root Provider ────────────────
interface ProvidersProps {
  children: ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale: initialLocale, messages }: ProvidersProps) {
  const queryClient = getQueryClient();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    setLocaleState(newLocale);
    window.location.reload();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={{ locale, setLocale }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}
