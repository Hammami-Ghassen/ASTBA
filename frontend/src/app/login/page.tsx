'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LogIn, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { useAuth } from '@/lib/auth-provider';
import { AuthApiError } from '@/lib/auth-api';
import { loginSchema, type LoginFormData } from '@/lib/validators';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Check for OAuth error from query params
  const oauthError = searchParams.get('error');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // Focus first error field after validation
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof LoginFormData | undefined;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  }, [errors, setFocus]);

  // Focus error summary when server error appears
  useEffect(() => {
    if (serverError) {
      errorRef.current?.focus();
    }
  }, [serverError]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      // Direct API call to handle errors locally, then full reload for cookie
      const { authApi } = await import('@/lib/auth-api');
      const user = await authApi.login({ email: data.email, password: data.password });
      // Trigger auth context refresh
      window.location.href = '/';
    } catch (err) {
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

  const hasErrors = Object.values(fieldErrors).some(Boolean) || !!serverError;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t('loginTitle')}
          </CardTitle>
          <CardDescription>{t('loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error summary (a11y: aria-live region) */}
          {(serverError || oauthError) && (
            <div
              ref={errorRef}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              <p className="font-medium">{t('errorSummary')}</p>
              <ul className="mt-1 list-inside list-disc">
                {serverError && <li>{serverError}</li>}
                {oauthError && <li>{t('oauthError')}</li>}
              </ul>
            </div>
          )}

          {/* Google OAuth */}
          <GoogleOAuthButton />

          {/* Divider */}
          <div className="relative" role="presentation">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                {t('email')}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.com"
                error={!!fieldErrors.email}
                aria-invalid={!!fieldErrors.email || undefined}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                aria-required="true"
                {...register('email')}
              />
              {fieldErrors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                {t('password')}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={!!fieldErrors.password}
                  aria-invalid={!!fieldErrors.password || undefined}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  aria-required="true"
                  className="pe-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? '…' : t('login')}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('noAccount')}{' '}
            <Link
              href="/register"
              className="font-medium text-sky-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded dark:text-sky-400"
            >
              {t('register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
