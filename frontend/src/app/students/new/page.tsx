'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentCreateSchema, type StudentCreateFormData } from '@/lib/validators';
import { useCreateStudent } from '@/lib/hooks';
import { ApiError, studentsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { RequireAuth } from '@/components/auth/require-auth';
import { ImageUpload } from '@/components/ui/image-upload';

/** Map field keys to translation keys in the 'students' namespace */
const FIELD_LABELS: Record<string, string> = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  birthDate: 'dateOfBirth',
  notes: 'notes',
  imageUrl: 'image',
};

export default function NewStudentPage() {
  const t = useTranslations('students');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const createMutation = useCreateStudent();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    watch,
    setValue,
  } = useForm<StudentCreateFormData>({
    resolver: zodResolver(studentCreateSchema),
  });

  /** Resolve a Zod / server error message through i18n when applicable */
  const resolveMsg = (msg?: string): string => {
    if (!msg) return '';
    if (msg.startsWith('validation.')) {
      return tv(msg.replace('validation.', '') as Parameters<typeof tv>[0]);
    }
    return msg;
  };

  /** Get the combined error for a field (client-side first, then server-side) */
  const fieldError = (field: keyof StudentCreateFormData): string | undefined => {
    if (errors[field]?.message) return resolveMsg(errors[field].message);
    if (serverFieldErrors[field]) return serverFieldErrors[field];
    return undefined;
  };

  /** Build the list of all current errors with human-readable field labels */
  const allErrors: [string, string][] = [
    ...Object.entries(errors)
      .filter(([, err]) => err?.message)
      .map(([field, err]) => [t(FIELD_LABELS[field] ?? field), resolveMsg(err?.message)] as [string, string]),
    ...Object.entries(serverFieldErrors)
      .filter(([field]) => !errors[field as keyof StudentCreateFormData])
      .map(([field, msg]) => [t(FIELD_LABELS[field] ?? field), msg] as [string, string]),
  ];

  const onSubmit = async (data: StudentCreateFormData) => {
    setServerError(null);
    setServerFieldErrors({});

    // ── Frontend email uniqueness pre-check ──────────────────
    try {
      const existing = await studentsApi.list({ query: data.email, size: 50 });
      const duplicate = existing.content.find(
        (s) => s.email?.toLowerCase() === data.email.toLowerCase(),
      );
      if (duplicate) {
        setServerFieldErrors({ email: tv('emailAlreadyUsed') });
        return;
      }
    } catch {
      // If the check fails, continue and let the backend handle it
    }

    try {
      const student = await createMutation.mutateAsync(data);
      addToast(t('createSuccess'), 'success');
      router.push(`/students/${student.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          setServerFieldErrors(err.fieldErrors);
        }
        // Map conflict errors to the relevant field
        if (err.status === 409) {
          const msg = err.message;
          if (msg.includes('email')) {
            setServerFieldErrors(prev => ({ ...prev, email: tv('emailAlreadyUsed') }));
          } else if (msg.includes('numéro') || msg.includes('phone')) {
            setServerFieldErrors(prev => ({ ...prev, phone: tv('phoneAlreadyUsed') }));
          }
        }
        setServerError(err.message);
      } else {
        setServerError(tc('error'));
      }
    }
  };

  const onError = () => {
    const firstErrorField = Object.keys(errors)[0] as keyof StudentCreateFormData;
    if (firstErrorField) setFocus(firstErrorField);
  };

  /* Date bounds for age 10–29 */
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 29, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <RequireAuth roles={['ADMIN', 'MANAGER']}>
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('addStudent')}
      </h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="space-y-6">
            {/* Error summary */}
            {(allErrors.length > 0 || serverError) && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              >
                <p className="font-medium">{tc('error')}</p>
                {allErrors.length > 0 && (
                  <ul className="mt-1 list-inside list-disc">
                    {allErrors.map(([label, msg]) => (
                      <li key={label}><strong>{label}</strong> : {msg}</li>
                    ))}
                  </ul>
                )}
                {serverError && allErrors.length === 0 && (
                  <p className="mt-1">{serverError}</p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* firstName */}
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')} <span className="text-red-500" aria-hidden="true">*</span></Label>
                <Input
                  id="firstName"
                  error={!!fieldError('firstName')}
                  aria-describedby={fieldError('firstName') ? 'firstName-error' : undefined}
                  aria-invalid={!!fieldError('firstName')}
                  maxLength={100}
                  {...register('firstName')}
                />
                {fieldError('firstName') && (
                  <p id="firstName-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('firstName')}</p>
                )}
              </div>

              {/* lastName */}
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')} <span className="text-red-500" aria-hidden="true">*</span></Label>
                <Input
                  id="lastName"
                  error={!!fieldError('lastName')}
                  aria-describedby={fieldError('lastName') ? 'lastName-error' : undefined}
                  aria-invalid={!!fieldError('lastName')}
                  maxLength={100}
                  {...register('lastName')}
                />
                {fieldError('lastName') && (
                  <p id="lastName-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('lastName')}</p>
                )}
              </div>
            </div>

            {/* email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')} <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Input
                id="email"
                type="email"
                error={!!fieldError('email')}
                aria-describedby={fieldError('email') ? 'email-error' : undefined}
                aria-invalid={!!fieldError('email')}
                maxLength={150}
                {...register('email')}
              />
              {fieldError('email') && (
                <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('email')}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  error={!!fieldError('phone')}
                  aria-describedby={fieldError('phone') ? 'phone-error' : undefined}
                  aria-invalid={!!fieldError('phone')}
                  maxLength={20}
                  placeholder="+216 XX XXX XXX"
                  {...register('phone')}
                />
                {fieldError('phone') && (
                  <p id="phone-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('phone')}</p>
                )}
              </div>

              {/* birthDate */}
              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('dateOfBirth')} <span className="text-red-500" aria-hidden="true">*</span></Label>
                <Input
                  id="birthDate"
                  type="date"
                  required
                  error={!!fieldError('birthDate')}
                  aria-describedby={fieldError('birthDate') ? 'birthDate-error' : undefined}
                  aria-invalid={!!fieldError('birthDate')}
                  min={minDate}
                  max={maxDate}
                  {...register('birthDate')}
                />
                {fieldError('birthDate') && (
                  <p id="birthDate-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('birthDate')}</p>
                )}
              </div>
            </div>

            {/* notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Input
                id="notes"
                error={!!fieldError('notes')}
                aria-describedby={fieldError('notes') ? 'notes-error' : undefined}
                aria-invalid={!!fieldError('notes')}
                maxLength={500}
                {...register('notes')}
              />
              {fieldError('notes') && (
                <p id="notes-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{fieldError('notes')}</p>
              )}
            </div>

            {/* image */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('image')}</Label>
              <ImageUpload
                value={watch('imageUrl') || ''}
                onChange={(url) => setValue('imageUrl', url)}
                disabled={isSubmitting || createMutation.isPending}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {tc('save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </RequireAuth>
  );
}
