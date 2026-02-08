'use client';

import { use, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useTraining, useTrainingEnrollments } from '@/lib/hooks';
import { useAuth, canManageTrainings } from '@/lib/auth-provider';
import { trainingsApi, uploadsApi } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ErrorState, LoadingSkeleton } from '@/components/layout/states';
import { BookOpen, Layers, Calendar, Users, FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('trainings');
  const tc = useTranslations('common');
  const { data: training, isLoading, error } = useTraining(id);
  const { data: enrollments } = useTrainingEnrollments(id);
  const { user } = useAuth();
  const canManage = canManageTrainings(user);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !training) return <ErrorState message={error?.message} />;

  // Generate default levels/sessions if not present
  const levels = training.levels?.length
    ? training.levels
    : Array.from({ length: 4 }, (_, i) => ({
        levelNumber: i + 1,
        title: `${t('level')} ${i + 1}`,
        sessions: Array.from({ length: 6 }, (_, j) => ({
          sessionId: `session-${i + 1}-${j + 1}`,
          sessionNumber: j + 1,
          title: `${t('session')} ${j + 1}`,
          plannedAt: undefined as string | undefined,
        })),
      }));

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-3 shadow-sm dark:from-emerald-900/60 dark:to-emerald-800/40">
            <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
              {training.title}
            </h1>
            {training.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {training.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/attendance?trainingId=${id}`}>
              {tc('actions')}: {t('sessions')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Layers className="h-5 w-5 text-sky-500" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">{t('levels')}</p>
              <p className="text-xl font-bold">{levels.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">{t('sessions')}</p>
              <p className="text-xl font-bold">{levels.reduce((a, l) => a + l.sessions.length, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-purple-500" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-500">{t('enrolledStudents')}</p>
              <p className="text-xl font-bold">{enrollments?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" aria-hidden="true" />
            {t('pdfDocument')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {training.documentUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${training.documentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t('pdfView')}
              </a>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 me-1" aria-hidden="true" />
                    {uploading ? t('pdfUploading') : t('docReplace')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={async () => {
                      try {
                        await trainingsApi.update(id, { documentUrl: '' });
                        queryClient.invalidateQueries({ queryKey: ['training', id] });
                        addToast(t('docDeleteSuccess'), 'success');
                      } catch {
                        addToast(tc('error'), 'error');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 me-1" aria-hidden="true" />
                    {t('docDelete')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('docEmpty')}</p>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 me-1" aria-hidden="true" />
                  {uploading ? t('pdfUploading') : t('docUpload')}
                </Button>
              )}
            </div>
          )}
          {/* Hidden file input */}
          {canManage && (
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type !== 'application/pdf') {
                  addToast(t('pdfInvalidType'), 'error');
                  return;
                }
                if (file.size > 10 * 1024 * 1024) {
                  addToast(t('pdfTooLarge'), 'error');
                  return;
                }
                setUploading(true);
                try {
                  const { documentUrl } = await uploadsApi.uploadDocument(file);
                  await trainingsApi.update(id, { documentUrl });
                  queryClient.invalidateQueries({ queryKey: ['training', id] });
                  addToast(t('pdfUploadSuccess'), 'success');
                } catch {
                  addToast(tc('error'), 'error');
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Levels accordion */}
      <Card>
        <CardHeader>
          <CardTitle>{t('levels')} & {t('sessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {levels.map((level) => (
              <AccordionItem key={level.levelNumber} value={String(level.levelNumber)}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <Badge variant="info">{t('level')} {level.levelNumber}</Badge>
                    <span>{level.title || `${t('level')} ${level.levelNumber}`}</span>
                    <span className="text-gray-400">– {level.sessions.length} {t('sessions')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {level.sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {t('session')} {session.sessionNumber}
                          </span>
                          {session.plannedAt && (
                            <span className="text-sm text-gray-400">{session.plannedAt}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Enrolled students */}
      {enrollments && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('enrolledStudents')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{tc('name')}</TableHead>
                  <TableHead scope="col">{tc('email')}</TableHead>
                  <TableHead scope="col">{tc('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <Link
                        href={`/students/${enrollment.studentId}`}
                        className="font-medium text-sky-600 hover:underline dark:text-sky-400"
                      >
                        {enrollment.student
                          ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                          : enrollment.studentId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {enrollment.student?.email || '—'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {enrollment.enrolledAt || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
