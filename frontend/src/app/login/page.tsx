'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, AlertCircle } from 'lucide-react';

import { AuthLayout } from '@/components/auth/auth-layout';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { MacbookLoader } from '@/components/ui/macbook-loader';
import { useAuth } from '@/lib/auth-provider';
import { AuthApiError } from '@/lib/auth-api';
import { loginSchema, type LoginFormData } from '@/lib/validators';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const oauthError = searchParams.get('error');

  // Redirect if already authenticated
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [authLoading, isAuthenticated, router, redirectTo]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof LoginFormData | undefined;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  }, [errors, setFocus]);

  useEffect(() => {
    if (serverError) {
      errorRef.current?.focus();
    }
  }, [serverError]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    const start = Date.now();

    try {
      const { authApi } = await import('@/lib/auth-api');
      await authApi.login({ email: data.email, password: data.password });
      await refreshUser();
      const elapsed = Date.now() - start;
      if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));
      router.replace(redirectTo);
    } catch (err) {
      const elapsed = Date.now() - start;
      if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));
      if (err instanceof AuthApiError) {
        if (err.status === 401 || err.status === 403) {
          setServerError(t('loginError'));
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError(t('loginError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (key: keyof LoginFormData): string | undefined => {
    const err = errors[key];
    if (!err?.message) return undefined;
    if (err.message.startsWith('validation.')) {
      return tv(err.message.replace('validation.', '') as 'required' | 'invalidEmail');
    }
    return err.message;
  };

  const fieldErrors = {
    email: getFieldError('email'),
    password: getFieldError('password'),
  };

  return (
    <>
    {isSubmitting && <MacbookLoader />}
    <AuthLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight dark:text-white sm:text-4xl">
          {t('loginTitle')}
        </h2>
        <p className="text-base text-gray-500 dark:text-[#92a4c9]">{t('loginDescription')}</p>
      </div>

      {/* Error Summary */}
      {(serverError || oauthError) && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-400 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold dark:text-white">{t('errorSummary')}</h3>
              <ul className="list-disc ps-5 text-sm text-red-600 dark:text-red-200/80">
                {serverError && <li>{serverError}</li>}
                {oauthError === 'pending' && <li>{t('accountPending')}</li>}
                {oauthError === 'disabled' && <li>{t('accountDisabled')}</li>}
                {oauthError && oauthError !== 'pending' && oauthError !== 'disabled' && <li>{t('oauthError')}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {/* Email */}
        <div className="space-y-2">
          <label className="text-base font-medium dark:text-white" htmlFor="email">
            {t('email')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <Mail className="h-5 w-5 text-gray-400 dark:text-[#92a4c9]" aria-hidden="true" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              className={`block w-full rounded-lg border bg-white dark:bg-[#192233] ps-10 pe-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#92a4c9] shadow-sm transition-colors focus:ring-0 ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-[#324467] focus:border-[#135bec]'
              }`}
              aria-invalid={!!fieldErrors.email || undefined}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-required="true"
              {...register('email')}
            />
            {fieldErrors.email && (
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
          </div>
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="text-sm text-red-400 mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-base font-medium dark:text-white" htmlFor="password">
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-[#135bec] hover:text-blue-400 font-medium focus:outline-none focus:underline"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? t('hidePassword') : t('showPassword')}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`block w-full rounded-lg border bg-white dark:bg-[#192233] px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#92a4c9] shadow-sm transition-colors focus:ring-0 ${
              fieldErrors.password
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-[#324467] focus:border-[#135bec]'
            }`}
            aria-invalid={!!fieldErrors.password || undefined}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            aria-required="true"
            {...register('password')}
          />
          {fieldErrors.password && (
            <p id="password-error" role="alert" className="text-sm text-red-400 mt-1">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#135bec] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#135bec]/20 transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#101622] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '…' : t('login')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6" role="presentation">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-[#324467]" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-white dark:bg-[#101622] px-3 text-gray-500 dark:text-[#92a4c9]">
            {t('orContinueWith')}
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton className="dark:border-[#324467] dark:bg-[#192233] dark:text-white dark:hover:bg-[#192233]/80" />

      {/* Register link */}
      <div className="mt-8 text-center text-base text-gray-500 dark:text-[#92a4c9]">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          className="font-medium text-[#135bec] hover:text-blue-400 hover:underline focus:outline-none focus:underline"
        >
          {t('register')}
        </Link>
      </div>
    </AuthLayout>
    </>
  );
}
