'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useTraining, useTrainingEnrollments } from '@/lib/hooks';
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
import { BookOpen, Layers, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('trainings');
  const tc = useTranslations('common');
  const { data: training, isLoading, error } = useTraining(id);
  const { data: enrollments } = useTrainingEnrollments(id);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900">
            <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                            <span className="text-xs text-gray-400">{session.plannedAt}</span>
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
