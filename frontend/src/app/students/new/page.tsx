'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentCreateSchema, type StudentCreateFormData } from '@/lib/validators';
import { useCreateStudent } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { FormField } from '@/components/layout/form-field';
import { RequireAuth } from '@/components/auth/require-auth';

export default function NewStudentPage() {
  const t = useTranslations('students');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const createMutation = useCreateStudent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<StudentCreateFormData>({
    resolver: zodResolver(studentCreateSchema),
  });

  const onSubmit = async (data: StudentCreateFormData) => {
    try {
      const student = await createMutation.mutateAsync(data);
      addToast(t('createSuccess'), 'success');
      router.push(`/students/${student.id}`);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  const onError = () => {
    // Focus the first field with an error
    const firstErrorField = Object.keys(errors)[0] as keyof StudentCreateFormData;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  };

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
            {Object.keys(errors).length > 0 && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              >
                <p className="font-medium">{tc('error')}</p>
                <ul className="mt-1 list-inside list-disc">
                  {Object.entries(errors).map(([field, err]) => (
                    <li key={field}>{err?.message?.startsWith('validation.') ? tv(err.message.replace('validation.', '') as 'required') : err?.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')} <span className="text-red-500" aria-hidden="true">*</span></Label>
                <Input
                  id="firstName"
                  error={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  aria-invalid={!!errors.firstName}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p id="firstName-error" role="alert" className="text-sm text-red-600">{errors.firstName.message?.startsWith('validation.') ? tv(errors.firstName.message.replace('validation.', '') as 'required') : errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')} <span className="text-red-500" aria-hidden="true">*</span></Label>
                <Input
                  id="lastName"
                  error={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  aria-invalid={!!errors.lastName}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p id="lastName-error" role="alert" className="text-sm text-red-600">{errors.lastName.message?.startsWith('validation.') ? tv(errors.lastName.message.replace('validation.', '') as 'required') : errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')} <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Input
                id="email"
                type="email"
                error={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600">{errors.email.message?.startsWith('validation.') ? tv(errors.email.message.replace('validation.', '') as 'required' | 'invalidEmail') : errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('dateOfBirth')}</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Input
                id="notes"
                {...register('notes')}
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
