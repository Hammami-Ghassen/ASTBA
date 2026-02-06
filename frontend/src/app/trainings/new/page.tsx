'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trainingCreateSchema, type TrainingCreateFormData } from '@/lib/validators';
import { useCreateTraining } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { RequireAuth } from '@/components/auth/require-auth';

export default function NewTrainingPage() {
  const t = useTranslations('trainings');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const createMutation = useCreateTraining();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<TrainingCreateFormData>({
    resolver: zodResolver(trainingCreateSchema),
  });

  const onSubmit = async (data: TrainingCreateFormData) => {
    try {
      const training = await createMutation.mutateAsync(data);
      addToast(t('createSuccess'), 'success');
      router.push(`/trainings/${training.id}`);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  const onError = () => {
    const firstErrorField = Object.keys(errors)[0] as keyof TrainingCreateFormData;
    if (firstErrorField) setFocus(firstErrorField);
  };

  return (
    <RequireAuth roles={['ADMIN', 'MANAGER']}>
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('addTraining')}
      </h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <div role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <p className="font-medium">{tc('error')}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t('trainingName')} <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Input
                id="title"
                error={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p id="title-error" role="alert" className="text-sm text-red-600">{errors.title.message?.startsWith('validation.') ? tv('required') : errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                rows={4}
                {...register('description')}
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              ℹ️ La formation sera créée avec 4 niveaux × 6 séances = 24 séances au total.
            </p>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
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
