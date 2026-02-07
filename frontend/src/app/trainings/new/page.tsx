'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { PdfUpload } from '@/components/ui/pdf-upload';
import {
  BookOpen,
  Layers,
  FileUp,
  ChevronRight,
  ChevronLeft,
  Check,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const TOTAL_STEPS = 3;

function generateDefaultLevels() {
  return Array.from({ length: 4 }, (_, l) => ({
    levelNumber: l + 1,
    title: `Niveau ${l + 1}`,
    sessions: Array.from({ length: 6 }, (_, s) => ({
      sessionNumber: s + 1,
      title: `Séance ${s + 1}`,
    })),
  }));
}

// ──────────────────────────────────────────────
// Step indicator
// ──────────────────────────────────────────────
function StepIndicator({
  currentStep,
  labels,
  icons,
}: {
  currentStep: number;
  labels: string[];
  icons: React.ReactNode[];
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={stepNum} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                      ? 'bg-[#135bec] border-[#135bec] text-white shadow-lg shadow-blue-500/25'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isDone ? <Check className="h-5 w-5" /> : icons[i]}
              </div>
              <span
                className={`text-xs font-medium text-center transition-colors ${
                  isActive
                    ? 'text-[#135bec]'
                    : isDone
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="flex-1 mx-3 mt-[-18px]">
                <div
                  className={`h-0.5 rounded-full transition-colors duration-300 ${
                    stepNum < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function NewTrainingPage() {
  const t = useTranslations('trainings');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const createMutation = useCreateTraining();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    trigger,
    watch,
    setValue,
    getValues,
  } = useForm<TrainingCreateFormData>({
    resolver: zodResolver(trainingCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      documentUrl: '',
      levels: generateDefaultLevels(),
    },
  });

  const { fields: levelFields } = useFieldArray({
    control,
    name: 'levels',
  });

  const documentUrl = watch('documentUrl');

  // ── Step navigation ──
  const goNext = useCallback(async () => {
    if (currentStep === 1) {
      const valid = await trigger(['title', 'description']);
      if (!valid) return;
    }
    if (currentStep === 2) {
      const valid = await trigger('levels');
      if (!valid) return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, trigger]);

  const goBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // ── Submit ──
  const onSubmit = async (data: TrainingCreateFormData) => {
    try {
      const payload = {
        ...data,
        documentUrl: data.documentUrl || undefined,
      };
      const training = await createMutation.mutateAsync(payload);
      addToast(t('createSuccess'), 'success');
      router.push(`/trainings/${training.id}`);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  // ── Session title update helper ──
  const updateSessionTitle = (levelIndex: number, sessionIndex: number, title: string) => {
    const levels = getValues('levels') || [];
    const updated = [...levels];
    if (updated[levelIndex]?.sessions?.[sessionIndex]) {
      updated[levelIndex].sessions[sessionIndex].title = title;
      setValue('levels', updated);
    }
  };

  // ── Add session to a level ──
  const addSession = (levelIndex: number) => {
    const levels = getValues('levels') || [];
    const updated = [...levels];
    const nextNum = (updated[levelIndex]?.sessions?.length || 0) + 1;
    updated[levelIndex].sessions = [
      ...(updated[levelIndex].sessions || []),
      { sessionNumber: nextNum, title: `Séance ${nextNum}` },
    ];
    setValue('levels', updated);
  };

  // ── Remove session from a level ──
  const removeSession = (levelIndex: number, sessionIndex: number) => {
    const levels = getValues('levels') || [];
    const updated = [...levels];
    updated[levelIndex].sessions = updated[levelIndex].sessions.filter(
      (_, i) => i !== sessionIndex,
    );
    updated[levelIndex].sessions.forEach((s, i) => {
      s.sessionNumber = i + 1;
    });
    setValue('levels', updated);
  };

  const stepLabels = [t('stepInfo'), t('stepSessions'), t('stepDocument')];
  const stepIcons = [
    <BookOpen key="1" className="h-5 w-5" />,
    <Layers key="2" className="h-5 w-5" />,
    <FileUp key="3" className="h-5 w-5" />,
  ];

  return (
    <RequireAuth roles={['ADMIN', 'MANAGER']}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('addTraining')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('wizardSubtitle')}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator
          currentStep={currentStep}
          labels={stepLabels}
          icons={stepIcons}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          noValidate
        >
          {/* ═══════════════ Step 1: Title + Description ═══════════════ */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-[#135bec]/10 p-2.5">
                    <BookOpen className="h-5 w-5 text-[#135bec]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {t('stepInfoTitle')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stepInfoDesc')}
                    </p>
                  </div>
                </div>

                {errors.title && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                  >
                    {tv('required')}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('trainingName')}{' '}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={t('titlePlaceholder')}
                    error={!!errors.title}
                    aria-invalid={!!errors.title}
                    {...register('title')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder={t('descriptionPlaceholder')}
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════ Step 2: Sessions & Levels ═══════════════ */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-[#135bec]/10 p-2.5">
                    <Layers className="h-5 w-5 text-[#135bec]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {t('stepSessionsTitle')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stepSessionsDesc')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {levelFields.map((levelField, levelIndex) => {
                    const level = watch(`levels.${levelIndex}`);
                    return (
                      <div
                        key={levelField.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Level header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#192233] border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#135bec] text-white text-sm font-bold">
                            {levelIndex + 1}
                          </div>
                          <Input
                            className="flex-1 bg-transparent border-0 shadow-none focus:ring-0 p-0 text-sm font-semibold"
                            {...register(`levels.${levelIndex}.title`)}
                          />
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {level?.sessions?.length || 0} {t('sessions').toLowerCase()}
                          </span>
                        </div>

                        {/* Sessions list */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {level?.sessions?.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className="flex items-center gap-2 px-4 py-2.5 group hover:bg-gray-50 dark:hover:bg-[#1a2740] transition-colors"
                            >
                              <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6 shrink-0">
                                {sessionIndex + 1}.
                              </span>
                              <Input
                                className="flex-1 bg-transparent border-0 shadow-none focus:ring-0 p-0 text-sm"
                                value={session.title}
                                onChange={(e) =>
                                  updateSessionTitle(levelIndex, sessionIndex, e.target.value)
                                }
                              />
                              {(level.sessions?.length || 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSession(levelIndex, sessionIndex)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all p-1 rounded"
                                  aria-label={tc('delete')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add session */}
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => addSession(levelIndex)}
                            className="flex items-center gap-1.5 text-xs text-[#135bec] hover:text-blue-700 font-medium transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t('addSession')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    ℹ️{' '}
                    {t('sessionsSummary', {
                      levels: levelFields.length,
                      totalSessions: levelFields.reduce(
                        (acc, _, i) => acc + (watch(`levels.${i}`)?.sessions?.length || 0),
                        0,
                      ),
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════ Step 3: PDF Upload ═══════════════ */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-[#135bec]/10 p-2.5">
                    <FileUp className="h-5 w-5 text-[#135bec]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {t('stepDocumentTitle')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stepDocumentDesc')}
                    </p>
                  </div>
                </div>

                <PdfUpload
                  value={documentUrl || ''}
                  onChange={(url) => setValue('documentUrl', url)}
                />

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t('pdfOptionalHint')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════ Navigation Buttons ═══════════════ */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => router.back() : goBack}
            >
              {currentStep === 1 ? (
                tc('cancel')
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('previous')}
                </>
              )}
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button type="button" onClick={goNext}>
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit(onSubmit)()}
                disabled={isSubmitting || createMutation.isPending}
                className="min-w-[140px]"
              >
                {isSubmitting || createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('creating')}
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t('createTraining')}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </RequireAuth>
  );
}
