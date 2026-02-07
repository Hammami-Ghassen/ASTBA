'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/auth-api';

export default function AuthCallbackPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(t('oauthCallbackError'));
      return;
    }

    // After OAuth redirect, backend provides a one-time code.
    // Exchange it for cookies via the Next.js proxy, then verify with /me.
    async function verifyAuth() {
      const code = searchParams.get('code');
      try {
        if (code) {
          // Exchange the one-time code for HttpOnly cookies (through proxy)
          await authApi.exchangeOAuth2Code(code);
        }
        // Now verify that cookies are set correctly
        await authApi.me();
        setStatus('success');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
      } catch {
        setStatus('error');
        setErrorMessage(t('oauthCallbackError'));
      }
    }

    verifyAuth();
  }, [searchParams, router, t]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2
                className="h-12 w-12 animate-spin text-sky-600 motion-reduce:animate-none"
                aria-hidden="true"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('oauthCallback')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                {t('oauthCallback')}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('oauthCallbackSuccess')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                {t('oauthCallbackSuccess')}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('oauthError')}
              </h1>
              <p
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="assertive"
              >
                {errorMessage}
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/login">{t('backToLogin')}</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
