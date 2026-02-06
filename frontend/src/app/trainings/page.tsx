'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Eye, Trash2, BookOpen, Layers, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/layout/states';
import { useToast } from '@/components/ui/toast';
import { useTrainings, useDeleteTraining } from '@/lib/hooks';
import { useAuth, canManageTrainings } from '@/lib/auth-provider';

export default function TrainingsPage() {
  const t = useTranslations('trainings');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const canManage = canManageTrainings(user);
  const { data: trainings, isLoading, error, refetch } = useTrainings();
  const deleteMutation = useDeleteTraining();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      addToast(t('deleteSuccess'), 'success');
      setDeleteId(null);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        {canManage && (
          <Button asChild>
            <Link href="/trainings/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('addTraining')}
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : !trainings || trainings.length === 0 ? (
        <EmptyState
          title={t('noTrainings')}
          description={t('noTrainingsDesc')}
          icon={<BookOpen className="h-12 w-12" />}
          action={
            canManage
              ? {
                  label: t('addTraining'),
                  onClick: () => router.push('/trainings/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training) => (
            <Card key={training.id} className="group relative">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900">
                    <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild aria-label={`${tc('edit')} ${training.title}`}>
                      <Link href={`/trainings/${training.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(training.id)}
                        aria-label={`${tc('delete')} ${training.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <Link
                    href={`/trainings/${training.id}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {training.title}
                  </Link>
                </h2>
                {training.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {training.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                    {training.levels?.length ?? 4} {t('levels')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {(training.levels?.reduce((acc, l) => acc + (l.sessions?.length ?? 6), 0)) ?? 24} {t('sessions')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent aria-labelledby="delete-training-title">
          <DialogHeader>
            <DialogTitle id="delete-training-title">{tc('confirm')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>{tc('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
