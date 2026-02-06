'use client';

import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/auth-api';
import { cn } from '@/lib/utils';

/**
 * Google OAuth2 button – redirects to backend OAuth2 flow.
 * Accessible: uses <a> with descriptive text, not just an icon.
 */
export function GoogleOAuthButton({ className }: { className?: string }) {
  const t = useTranslations('auth');
  const googleUrl = authApi.googleAuthUrl();

  return (
    <a
      href={googleUrl}
      className={cn(
        'inline-flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        className,
      )}
      aria-label={t('continueWithGoogle')}
    >
      {/* Google logo SVG – decorative */}
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span>{t('continueWithGoogle')}</span>
    </a>
  );
}
