'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useTrainings, useTrainingEnrollments, useMarkAttendance } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
import { EmptyState, LoadingSkeleton } from '@/components/layout/states';
import { useToast } from '@/components/ui/toast';
import { todayISO, getInitials } from '@/lib/utils';
import type { AttendanceStatus, Training, Level, Session } from '@/lib/types';
import { ClipboardCheck, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAuth, canMarkAttendance } from '@/lib/auth-provider';

interface AttendanceRow {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
}

export default function AttendancePage() {
  const t = useTranslations('attendance');
  const tc = useTranslations('common');
  const tt = useTranslations('trainings');
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const canMark = canMarkAttendance(user);

  const { data: trainings, isLoading: trainingsLoading } = useTrainings();
  const markMutation = useMarkAttendance();

  const [selectedTraining, setSelectedTraining] = useState(searchParams.get('trainingId') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [confirmBulk, setConfirmBulk] = useState<'PRESENT' | 'ABSENT' | null>(null);

  // Derived data
  const training: Training | undefined = trainings?.find((tr) => tr.id === selectedTraining);

  const levels: Level[] = training?.levels?.length
    ? training.levels
    : selectedTraining
    ? Array.from({ length: 4 }, (_, i) => ({
        id: `level-${i + 1}`,
        number: i + 1,
        sessions: Array.from({ length: 6 }, (_, j) => ({
          id: `session-${i + 1}-${j + 1}`,
          number: j + 1,
        })),
      }))
    : [];

  const level: Level | undefined = levels.find((l) => l.id === selectedLevel);
  const sessions: Session[] = level?.sessions ?? [];
  const session: Session | undefined = sessions.find((s) => s.id === selectedSession);

  // Fetch enrolled students for the selected training
  const { data: enrollments, isLoading: enrollmentsLoading } = useTrainingEnrollments(selectedTraining);

  // When session is selected, init records
  const initRecords = useCallback(() => {
    if (!enrollments) return;
    const newRecords: AttendanceRow[] = enrollments.map((e) => ({
      studentId: e.studentId,
      studentName: e.student
        ? `${e.student.firstName} ${e.student.lastName}`
        : e.studentId,
      status: 'PRESENT' as AttendanceStatus,
    }));
    setRecords(newRecords);
  }, [enrollments]);

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    initRecords();
  };

  // Toggle single student status
  const toggleStatus = (studentId: string, newStatus: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: newStatus } : r))
    );
  };

  // Bulk status change
  const handleBulkChange = (status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
    setConfirmBulk(null);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedTraining || !selectedSession) return;
    try {
      await markMutation.mutateAsync({
        trainingId: selectedTraining,
        sessionId: selectedSession,
        date: todayISO(),
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
        })),
      });
      addToast(t('attendanceMarked'), 'success');
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('title')}
      </h1>

      {/* Step 1: Select training / level / session */}
      <Card>
        <CardHeader>
          <CardTitle>{t('markAttendance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Training */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectTraining')}
              </label>
              {trainingsLoading ? (
                <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              ) : (
                <Select
                  value={selectedTraining}
                  onValueChange={(v) => {
                    setSelectedTraining(v);
                    setSelectedLevel('');
                    setSelectedSession('');
                    setRecords([]);
                  }}
                >
                  <SelectTrigger aria-label={t('selectTraining')}>
                    <SelectValue placeholder={t('selectTraining')} />
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

            {/* Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectLevel')}
              </label>
              <Select
                value={selectedLevel}
                onValueChange={(v) => {
                  setSelectedLevel(v);
                  setSelectedSession('');
                  setRecords([]);
                }}
                disabled={!selectedTraining}
              >
                <SelectTrigger aria-label={t('selectLevel')}>
                  <SelectValue placeholder={t('selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {tt('level')} {l.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectSession')}
              </label>
              <Select
                value={selectedSession}
                onValueChange={handleSessionSelect}
                disabled={!selectedLevel}
              >
                <SelectTrigger aria-label={t('selectSession')}>
                  <SelectValue placeholder={t('selectSession')} />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {tt('session')} {s.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Mark attendance */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>{t('studentList')}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmBulk('PRESENT')}
                  disabled={!canMark}
                >
                  <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                  {t('markAllPresent')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmBulk('ABSENT')}
                  disabled={!canMark}
                >
                  <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                  {t('markAllAbsent')}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {enrollmentsLoading ? (
              <div className="p-6">
                <LoadingSkeleton rows={4} />
              </div>
            ) : records.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={tt('enrolledStudents')}
                  icon={<Users className="h-12 w-12" />}
                />
              </div>
            ) : (
              <>
                <Table>
                  <TableCaption>
                    {t('sessionCaption', { session: session?.number ?? '' })}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t('student')}</TableHead>
                      <TableHead scope="col">{t('statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.studentId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                              aria-hidden="true"
                            >
                              {record.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{record.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <fieldset>
                            <legend className="sr-only">
                              {t('statusCol')} – {record.studentName}
                            </legend>
                            <div className="flex gap-2" role="radiogroup" aria-label={`${t('statusCol')} ${record.studentName}`}>
                              <StatusButton
                                label={tc('present')}
                                active={record.status === 'PRESENT'}
                                variant="success"
                                onClick={() => toggleStatus(record.studentId, 'PRESENT')}
                              />
                              <StatusButton
                                label={tc('absent')}
                                active={record.status === 'ABSENT'}
                                variant="danger"
                                onClick={() => toggleStatus(record.studentId, 'ABSENT')}
                              />
                            </div>
                          </fieldset>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-700">
                  <Button
                    onClick={handleSubmit}
                    disabled={markMutation.isPending || !canMark}
                    className="min-w-[200px]"
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    {t('submitAttendance')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk confirm dialog */}
      <Dialog open={!!confirmBulk} onOpenChange={() => setConfirmBulk(null)}>
        <DialogContent aria-labelledby="bulk-confirm-title">
          <DialogHeader>
            <DialogTitle id="bulk-confirm-title">{tc('confirm')}</DialogTitle>
            <DialogDescription>{t('confirmBulk')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulk(null)}>
              {tc('cancel')}
            </Button>
            <Button onClick={() => confirmBulk && handleBulkChange(confirmBulk)}>
              {tc('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusButton({
  label,
  active,
  variant,
  onClick,
}: {
  label: string;
  active: boolean;
  variant: 'success' | 'danger';
  onClick: () => void;
}) {
  const colors = {
    success: active
      ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
      : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
    danger: active
      ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
      : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${colors[variant]}`}
    >
      {variant === 'success' ? (
        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
