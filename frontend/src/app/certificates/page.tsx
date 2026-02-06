'use client';

import { useTranslations } from 'next-intl';
import { useTrainings, useTrainingEnrollments } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { EmptyState, LoadingSkeleton } from '@/components/layout/states';
import { certificatesApi } from '@/lib/api-client';
import { Award, Download } from 'lucide-react';
import { useState } from 'react';
import { useAuth, canGenerateCertificates } from '@/lib/auth-provider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function CertificatesPage() {
  const t = useTranslations('certificates');
  const tc = useTranslations('common');
  const tt = useTranslations('trainings');

  const { data: trainings, isLoading: trainingsLoading } = useTrainings();
  const { user } = useAuth();
  const canGenerate = canGenerateCertificates(user);
  const [selectedTraining, setSelectedTraining] = useState('');
  const { data: enrollments, isLoading: enrollmentsLoading } = useTrainingEnrollments(selectedTraining);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
      </div>

      {/* Filter by training */}
      <div className="max-w-sm space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('training')}
        </label>
        {trainingsLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ) : (
          <Select value={selectedTraining} onValueChange={setSelectedTraining}>
            <SelectTrigger aria-label={t('training')}>
              <SelectValue placeholder={t('training')} />
            </SelectTrigger>
            <SelectContent>
              {trainings?.map((tr) => (
                <SelectItem key={tr.id} value={tr.id}>
                  {tr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Certificates table */}
      {!selectedTraining ? (
        <EmptyState
          title={t('noCertificates')}
          description={t('noCertificatesDesc')}
          icon={<Award className="h-12 w-12" />}
        />
      ) : enrollmentsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : !enrollments || enrollments.length === 0 ? (
        <EmptyState
          title={t('noCertificates')}
          description={t('noCertificatesDesc')}
          icon={<Award className="h-12 w-12" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableCaption className="sr-only">{t('title')}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t('student')}</TableHead>
                  <TableHead scope="col">{t('training')}</TableHead>
                  <TableHead scope="col">{tc('status')}</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">{tc('actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <CertificateRow key={enrollment.id} enrollment={enrollment} canGenerate={canGenerate} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CertificateRow({ enrollment, canGenerate }: { enrollment: { id: string; student?: { firstName: string; lastName: string }; training?: { name: string }; studentId: string; trainingId: string }; canGenerate: boolean }) {
  const t = useTranslations('certificates');

  return (
    <TableRow>
      <TableCell className="font-medium">
        {enrollment.student
          ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
          : enrollment.studentId}
      </TableCell>
      <TableCell className="text-gray-500">
        {enrollment.training?.name || enrollment.trainingId}
      </TableCell>
      <TableCell>
        <Badge variant="info">{t('eligible')}</Badge>
      </TableCell>
      <TableCell>
        {canGenerate && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a
                href={certificatesApi.downloadUrl(enrollment.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('download')} – ${enrollment.student?.firstName || ''}`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('download')}
              </a>
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
