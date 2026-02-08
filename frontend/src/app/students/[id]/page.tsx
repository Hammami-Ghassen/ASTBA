'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useStudent, useStudentEnrollments, useStudentProgress, useCreateEnrollment, useTrainings, useGroups, useAddStudentToGroup } from '@/lib/hooks';
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
import { BookOpen, Download, GraduationCap, Mail, Phone, MapPin, Calendar, Plus, UsersRound } from 'lucide-react';

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
  const addStudentToGroupMutation = useAddStudentToGroup();

  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  // Fetch groups for the selected training
  const { data: trainingGroups } = useGroups(selectedTraining || undefined);
  const tg = useTranslations('groups');

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !student) return <ErrorState message={error?.message} onRetry={() => router.refresh()} />;

  const handleEnroll = async () => {
    if (!selectedTraining) return;
    try {
      await enrollMutation.mutateAsync({
        studentId: id,
        trainingId: selectedTraining,
        groupId: selectedGroup && selectedGroup !== '__none__' ? selectedGroup : undefined,
      });
      // Also add student to the group's studentIds if a group was selected
      if (selectedGroup && selectedGroup !== '__none__') {
        try {
          await addStudentToGroupMutation.mutateAsync({ groupId: selectedGroup, studentId: id });
        } catch {
          // enrollment succeeded but group sync failed – don't block
        }
      }
      addToast(tt('createSuccess'), 'success');
      setEnrollDialogOpen(false);
      setSelectedTraining('');
      setSelectedGroup('');
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Student header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {student.imageUrl ? (
            <Image
              src={student.imageUrl}
              alt={`${student.firstName} ${student.lastName}`}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300"
              aria-hidden="true"
            >
              {getInitials(student.firstName, student.lastName)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
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
                  <p className="text-sm text-gray-500">{t('noEnrollments')}</p>
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
                              {progress?.progressSnapshot.eligibleForCertificate && (
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
              title={t('noEnrollments')}
              description={t('noEnrollmentsDesc')}
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
                                <Badge variant="success" className="text-sm">{tt('levelValidated')}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-sm">
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
            <EmptyState title={t('noEnrollments')} description={t('noEnrollmentsDesc')} icon={<GraduationCap className="h-12 w-12" />} />
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          {enrollments && enrollments.length > 0 && enrollments.some((e) => e.attendance && Object.keys(e.attendance).length > 0) ? (
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const training = enrollment.training;
                const attendance = enrollment.attendance;
                if (!training || !attendance || Object.keys(attendance).length === 0) return null;

                // Build a flat list of sessions with their attendance
                const rows: { levelNumber: number; sessionNumber: number; sessionTitle: string; sessionId: string; status: string; markedAt?: string }[] = [];
                for (const level of training.levels || []) {
                  for (const session of level.sessions || []) {
                    const entry = attendance[session.sessionId];
                    rows.push({
                      levelNumber: level.levelNumber,
                      sessionNumber: session.sessionNumber,
                      sessionTitle: session.title || `${t('session')} ${session.sessionNumber}`,
                      sessionId: session.sessionId,
                      status: entry?.status || 'NOT_MARKED',
                      markedAt: entry?.markedAt,
                    });
                  }
                }

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-sky-600" aria-hidden="true" />
                        {training.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableCaption className="sr-only">{t('attendanceHistory')}</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">{tt('level')}</TableHead>
                            <TableHead scope="col">{t('session')}</TableHead>
                            <TableHead scope="col">{tc('status')}</TableHead>
                            <TableHead scope="col">{tc('date')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.sessionId}>
                              <TableCell className="font-medium">
                                {tt('level')} {row.levelNumber}
                              </TableCell>
                              <TableCell>{row.sessionTitle}</TableCell>
                              <TableCell>
                                {row.status === 'PRESENT' ? (
                                  <Badge variant="success">{tc('present')}</Badge>
                                ) : row.status === 'ABSENT' ? (
                                  <Badge variant="danger">{tc('absent')}</Badge>
                                ) : row.status === 'EXCUSED' ? (
                                  <Badge variant="warning">{tc('excused')}</Badge>
                                ) : (
                                  <Badge variant="outline">{t('notMarkedYet')}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                {row.markedAt ? formatDate(row.markedAt) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t('attendanceHistory')}
              description={t('noAttendanceYet')}
              icon={<Calendar className="h-12 w-12" />}
            />
          )}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tt('trainingName')}
              </label>
              <Select
                value={selectedTraining}
                onValueChange={(v) => {
                  setSelectedTraining(v);
                  setSelectedGroup(''); // reset group when training changes
                }}
              >
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

            {/* Group selector — shown after choosing a training */}
            {selectedTraining && trainingGroups && trainingGroups.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <UsersRound className="mr-1 inline h-4 w-4" />
                  {tg('title')}
                </label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger aria-label={tg('title')}>
                    <SelectValue placeholder={tg('selectGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{tg('noGroupAssignment')}</SelectItem>
                    {trainingGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                        {g.dayOfWeek ? ` (${g.dayOfWeek})` : ''}
                        {g.startTime ? ` ${g.startTime}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
