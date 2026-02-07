'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, AlertCircle, CheckCircle2, Circle, XCircle, Info } from 'lucide-react';

import { AuthLayout } from '@/components/auth/auth-layout';
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
  const passwordValue = watch('password') || '';

  // Password requirement checks
  const pwReqs = {
    minLength: passwordValue.length >= 8,
    hasLower: /[a-z]/.test(passwordValue),
    hasUpper: /[A-Z]/.test(passwordValue),
    hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue),
  };
  const pwStrength = Object.values(pwReqs).filter(Boolean).length;

  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof RegisterFormData | undefined;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  }, [errors, setFocus]);

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
    <AuthLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight dark:text-white sm:text-4xl">
          {t('registerTitle')}
        </h2>
        <p className="text-[#92a4c9]">{t('registerDescription')}</p>
      </div>

      {/* Error Summary */}
      {(serverError || allErrors.length > 0) && (
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
              <h3 className="text-sm font-bold dark:text-white">{t('errorSummary')}</h3>
              <ul className="list-disc ps-5 text-sm text-red-200/80">
                {serverError && <li>{serverError}</li>}
                {allErrors.map(([key, msg]) => (
                  <li key={key}>
                    <a href={`#${key}`} className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 rounded">
                      {msg}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {/* Name Row */}
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium dark:text-white" htmlFor="firstName">
              {t('firstName')}
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={`block w-full rounded-lg border bg-[#192233] px-4 py-3 text-white placeholder-[#92a4c9] shadow-sm transition-colors focus:bg-[#192233] focus:ring-0 sm:text-sm ${
                fieldErrors.firstName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#324467] focus:border-[#135bec]'
              }`}
              aria-invalid={!!fieldErrors.firstName || undefined}
              aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
              aria-required="true"
              {...register('firstName')}
            />
            {fieldErrors.firstName && (
              <p id="firstName-error" role="alert" className="text-xs text-red-400 mt-1">
                {fieldErrors.firstName}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium dark:text-white" htmlFor="lastName">
              {t('lastName')}
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={`block w-full rounded-lg border bg-[#192233] px-4 py-3 text-white placeholder-[#92a4c9] shadow-sm transition-colors focus:bg-[#192233] focus:ring-0 sm:text-sm ${
                fieldErrors.lastName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#324467] focus:border-[#135bec]'
              }`}
              aria-invalid={!!fieldErrors.lastName || undefined}
              aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
              aria-required="true"
              {...register('lastName')}
            />
            {fieldErrors.lastName && (
              <p id="lastName-error" role="alert" className="text-xs text-red-400 mt-1">
                {fieldErrors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium dark:text-white" htmlFor="email">
            {t('email')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <Mail className="h-5 w-5 text-[#92a4c9]" aria-hidden="true" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              className={`block w-full rounded-lg border bg-[#192233] ps-10 pe-4 py-3 text-white placeholder-[#92a4c9] shadow-sm transition-colors focus:ring-0 sm:text-sm ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#324467] focus:border-[#135bec]'
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
            <p id="email-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium dark:text-white" htmlFor="password">
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-[#135bec] hover:text-blue-400 font-medium focus:outline-none focus:underline"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? t('hidePassword') : t('showPassword')}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`block w-full rounded-lg border bg-[#192233] px-4 py-3 text-white placeholder-[#92a4c9] shadow-sm transition-colors focus:bg-[#192233] focus:ring-0 sm:text-sm ${
              fieldErrors.password
                ? 'border-red-500 focus:border-red-500'
                : 'border-[#324467] focus:border-[#135bec]'
            }`}
            aria-invalid={!!fieldErrors.password || undefined}
            aria-describedby="password-reqs password-error"
            aria-required="true"
            {...register('password')}
          />

          {/* Strength meter */}
          {passwordValue.length > 0 && (
            <div className="mt-2 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-[#192233]">
              <div className={`w-1/3 transition-colors ${pwStrength >= 1 ? (pwStrength <= 2 ? 'bg-red-500' : 'bg-yellow-500') : 'bg-[#324467]'}`} />
              <div className={`w-1/3 transition-colors ${pwStrength >= 3 ? 'bg-yellow-500' : 'bg-[#324467]'}`} />
              <div className={`w-1/3 transition-colors ${pwStrength >= 4 ? 'bg-green-500' : 'bg-[#324467]'}`} />
            </div>
          )}

          {fieldErrors.password && (
            <p id="password-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.password}
            </p>
          )}

          {/* Password requirements */}
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" id="password-reqs">
            {([
              [pwReqs.minLength, tv('passwordMin')],
              [pwReqs.hasLower, 'a-z'],
              [pwReqs.hasUpper, 'A-Z'],
              [pwReqs.hasNumberOrSymbol, '0-9 / !@#'],
            ] as [boolean, string][]).map(([met, label], i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-[#92a4c9]">
                {passwordValue.length === 0 ? (
                  <Circle className="h-4 w-4 text-[#324467]" aria-hidden="true" />
                ) : met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Role Selection */}
        <fieldset className="rounded-xl border border-[#324467] bg-[#192233]/50 p-4">
          <legend className="px-2 text-sm font-semibold dark:text-white">
            {t('requestedRole')}
          </legend>
          <div className="mt-2 space-y-3">
            {/* Trainer */}
            <label className={`group relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-colors hover:bg-[#192233] ${
              selectedRole === 'TRAINER' ? 'border-[#135bec] bg-[#135bec]/5' : 'border-[#324467]'
            }`}>
              <input
                type="radio"
                value="TRAINER"
                className="sr-only"
                {...register('requestedRole')}
              />
              <div className="flex w-full items-center gap-3">
                <div className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                  selectedRole === 'TRAINER' ? 'border-[#135bec] bg-[#135bec]' : 'border-[#92a4c9]'
                }`}>
                  <div className={`h-2 w-2 rounded-full bg-white ${selectedRole === 'TRAINER' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm font-medium dark:text-white">{t('roleTrainer')}</span>
                  <span className="block text-xs text-[#92a4c9]">{t('roleTrainerDesc')}</span>
                </div>
              </div>
            </label>

            {/* Manager */}
            <label className={`group relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-colors hover:bg-[#192233] ${
              selectedRole === 'MANAGER' ? 'border-[#135bec] bg-[#135bec]/5' : 'border-[#324467]'
            }`}>
              <input
                type="radio"
                value="MANAGER"
                className="sr-only"
                {...register('requestedRole')}
              />
              <div className="flex w-full items-center gap-3">
                <div className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                  selectedRole === 'MANAGER' ? 'border-[#135bec] bg-[#135bec]' : 'border-[#92a4c9]'
                }`}>
                  <div className={`h-2 w-2 rounded-full bg-white ${selectedRole === 'MANAGER' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm font-medium dark:text-white">{t('roleManager')}</span>
                  <span className="block text-xs text-[#92a4c9]">{t('roleManagerDesc')}</span>
                </div>
              </div>
            </label>
          </div>

          {/* Manager note */}
          {selectedRole === 'MANAGER' && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#135bec]/10 p-3 text-xs text-blue-200">
              <Info className="h-4 w-4 text-[#135bec] shrink-0 mt-0.5" aria-hidden="true" />
              <p>{t('accountPendingNote')}</p>
            </div>
          )}
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#135bec] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#135bec]/20 transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:ring-offset-2 focus:ring-offset-[#101622] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '…' : t('register')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6" role="presentation">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#324467]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#101622] px-3 text-[#92a4c9]">
            {t('orContinueWith')}
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton className="border-[#324467] bg-[#192233] text-white hover:bg-[#192233]/80 dark:border-[#324467] dark:bg-[#192233] dark:text-white dark:hover:bg-[#192233]/80" />

      {/* Login link */}
      <div className="mt-8 text-center text-sm text-[#92a4c9]">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-[#135bec] hover:text-blue-400 hover:underline focus:outline-none focus:underline"
        >
          {t('login')}
        </Link>
      </div>
    </AuthLayout>
  );
}
