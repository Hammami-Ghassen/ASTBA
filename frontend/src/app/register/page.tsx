'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { useToast } from '@/components/ui/toast';
import { authApi, AuthApiError } from '@/lib/auth-api';
import { registerSchema, type RegisterFormData } from '@/lib/validators';
import { useAuth } from '@/lib/auth-provider';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();
  const { addToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      requestedRole: 'TRAINER',
    },
  });

  const selectedRole = watch('requestedRole');

  // Focus first error field after validation
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof RegisterFormData | undefined;
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

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        requestedRole: data.requestedRole,
      });
      addToast(t('registerSuccess'), 'success');
      router.push('/login');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setServerError(err.message);
      } else {
        setServerError(t('registerError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (key: keyof RegisterFormData): string | undefined => {
    const err = errors[key];
    if (!err?.message) return undefined;
    if (err.message.startsWith('validation.')) {
      const msgKey = err.message.replace('validation.', '');
      return tv(msgKey as 'required' | 'invalidEmail' | 'passwordMin');
    }
    return err.message;
  };

  const fieldErrors = {
    firstName: getFieldError('firstName'),
    lastName: getFieldError('lastName'),
    email: getFieldError('email'),
    password: getFieldError('password'),
  };

  const allErrors = Object.entries(fieldErrors).filter(([, v]) => !!v);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t('registerTitle')}
          </CardTitle>
          <CardDescription>{t('registerDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error summary (a11y) */}
          {(serverError || allErrors.length > 0) && (
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
                {allErrors.map(([key, msg]) => (
                  <li key={key}>
                    <a href={`#${key}`} className="underline hover:no-underline">
                      {msg}
                    </a>
                  </li>
                ))}
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

          {/* Register form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* First name + Last name row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-1">
                  {t('firstName')}
                  <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  error={!!fieldErrors.firstName}
                  aria-invalid={!!fieldErrors.firstName || undefined}
                  aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                  aria-required="true"
                  {...register('firstName')}
                />
                {fieldErrors.firstName && (
                  <p id="firstName-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-1">
                  {t('lastName')}
                  <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  error={!!fieldErrors.lastName}
                  aria-invalid={!!fieldErrors.lastName || undefined}
                  aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                  aria-required="true"
                  {...register('lastName')}
                />
                {fieldErrors.lastName && (
                  <p id="lastName-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            {/* Requested role */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('requestedRole')}
              </legend>
              <div className="flex gap-4" role="radiogroup" aria-label={t('requestedRole')}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value="TRAINER"
                    className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-500"
                    {...register('requestedRole')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('roleTrainer')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value="MANAGER"
                    className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-500"
                    {...register('requestedRole')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('roleManager')}</span>
                </label>
              </div>
              {selectedRole === 'MANAGER' && (
                <p
                  className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  role="note"
                >
                  {t('accountPendingValidation')}
                </p>
              )}
            </fieldset>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? '…' : t('register')}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('hasAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-sky-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded dark:text-sky-400"
            >
              {t('login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
