'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useStudent, useStudentEnrollments, useStudentProgress, useCreateEnrollment, useTrainings } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/layout/states';
import { useToast } from '@/components/ui/toast';
import { formatDate, progressPercent, getInitials } from '@/lib/utils';
import { certificatesApi } from '@/lib/api-client';
import { BookOpen, Download, GraduationCap, Mail, Phone, MapPin, Calendar, Plus } from 'lucide-react';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const tp = useTranslations('progress');
  const tt = useTranslations('trainings');
  const tCert = useTranslations('certificates');
  const router = useRouter();
  const { addToast } = useToast();

  const { data: student, isLoading, error } = useStudent(id);
  const { data: enrollments } = useStudentEnrollments(id);
  const { data: progressData } = useStudentProgress(id);
  const { data: allTrainings } = useTrainings();
  const enrollMutation = useCreateEnrollment();

  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState('');

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !student) return <ErrorState message={error?.message} onRetry={() => router.refresh()} />;

  const handleEnroll = async () => {
    if (!selectedTraining) return;
    try {
      await enrollMutation.mutateAsync({ studentId: id, trainingId: selectedTraining });
      addToast(tt('createSuccess'), 'success');
      setEnrollDialogOpen(false);
      setSelectedTraining('');
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Student header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300"
            aria-hidden="true"
          >
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {student.firstName} {student.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.email}
                </span>
              )}
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setEnrollDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {tt('addTraining')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="trainings">{t('trainings')}</TabsTrigger>
          <TabsTrigger value="progress">{t('progress')}</TabsTrigger>
          <TabsTrigger value="history">{t('history')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('studentDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label={t('firstName')} value={student.firstName} />
                <DetailRow label={t('lastName')} value={student.lastName} />
                <DetailRow label={t('email')} value={student.email} />
                <DetailRow label={t('phone')} value={student.phone || '—'} />
                <DetailRow label={t('dateOfBirth')} value={student.birthDate ? formatDate(student.birthDate) : '—'} />
                <DetailRow label={t('notes')} value={student.notes || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tp('overallProgress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressData && progressData.length > 0 ? (
                  progressData.map((p) => (
                    <div key={p.enrollmentId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.trainingTitle}</span>
                        <span className="text-gray-500">
                          {p.progressSnapshot.attendedCount}/{p.progressSnapshot.totalSessions}
                        </span>
                      </div>
                      <Progress
                        value={progressPercent(p.progressSnapshot.attendedCount, p.progressSnapshot.totalSessions)}
                        label={`${p.trainingTitle}: ${progressPercent(p.progressSnapshot.attendedCount, p.progressSnapshot.totalSessions)}%`}
                      />
                      {p.progressSnapshot.completed && (
                        <Badge variant="success">{tt('completed')}</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('noStudentsDesc')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trainings */}
        <TabsContent value="trainings">
          {enrollments && enrollments.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableCaption className="sr-only">{t('enrolledTrainings')}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{tt('trainingName')}</TableHead>
                      <TableHead scope="col">{tc('status')}</TableHead>
                      <TableHead scope="col">{tc('date')}</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">{tc('actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => {
                      const progress = progressData?.find((p) => p.enrollmentId === enrollment.id);
                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.training?.title || enrollment.trainingId}
                          </TableCell>
                          <TableCell>
                            {progress?.progressSnapshot.completed ? (
                              <Badge variant="success">{tt('completed')}</Badge>
                            ) : (
                              <Badge variant="info">{tt('inProgress')}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {formatDate(enrollment.enrolledAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              {progress?.progressSnapshot.completed && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a
                                    href={certificatesApi.downloadUrl(enrollment.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={tCert('download')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title={t('noStudentsDesc')}
              icon={<BookOpen className="h-12 w-12" />}
              action={{
                label: tt('addTraining'),
                onClick: () => setEnrollDialogOpen(true),
              }}
            />
          )}
        </TabsContent>

        {/* Progress */}
        <TabsContent value="progress">
          {progressData && progressData.length > 0 ? (
            <div className="space-y-6">
              {progressData.map((p) => (
                <Card key={p.enrollmentId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{p.trainingTitle}</span>
                      {p.progressSnapshot.completed ? (
                        <Badge variant="success">{tt('completed')}</Badge>
                      ) : (
                        <Badge variant="info">
                          {p.progressSnapshot.levelsValidated.length}/4 {tp('levelsValidated')}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{tp('overallProgress')}</span>
                        <span>{progressPercent(p.progressSnapshot.attendedCount, p.progressSnapshot.totalSessions)}%</span>
                      </div>
                      <Progress
                        value={progressPercent(p.progressSnapshot.attendedCount, p.progressSnapshot.totalSessions)}
                        label={`${progressPercent(p.progressSnapshot.attendedCount, p.progressSnapshot.totalSessions)}%`}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((levelNum) => {
                        const validated = p.progressSnapshot.levelsValidated.includes(levelNum);
                        return (
                          <div
                            key={levelNum}
                            className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {tt('level')} {levelNum}
                              </span>
                              {validated ? (
                                <Badge variant="success" className="text-xs">{tt('levelValidated')}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {tt('inProgress')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noStudentsDesc')} icon={<GraduationCap className="h-12 w-12" />} />
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <EmptyState
            title={t('attendanceHistory')}
            description={t('noStudentsDesc')}
            icon={<Calendar className="h-12 w-12" />}
          />
        </TabsContent>
      </Tabs>

      {/* Enroll dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent aria-labelledby="enroll-dialog-title">
          <DialogHeader>
            <DialogTitle id="enroll-dialog-title">{tt('addTraining')}</DialogTitle>
            <DialogDescription>{t('enrolledTrainings')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTraining} onValueChange={setSelectedTraining}>
              <SelectTrigger aria-label={tt('trainingName')}>
                <SelectValue placeholder={tt('trainingName')} />
              </SelectTrigger>
              <SelectContent>
                {allTrainings?.map((tr) => (
                  <SelectItem key={tr.id} value={tr.id}>
                    {tr.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedTraining || enrollMutation.isPending}
            >
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-end">{value}</span>
    </div>
  );
}
