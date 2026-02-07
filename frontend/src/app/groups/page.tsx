'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/layout/states';
import { FormField } from '@/components/layout/form-field';
import { useToast } from '@/components/ui/toast';
import {
  useGroups,
  useGroup,
  useTrainings,
  useStudents,
  useCreateGroup,
  useDeleteGroup,
  useAddStudentToGroup,
  useRemoveStudentFromGroup,
} from '@/lib/hooks';
import { groupCreateSchema, type GroupCreateFormData } from '@/lib/validators';
import { useAuth, canManageTrainings } from '@/lib/auth-provider';
import { getInitials } from '@/lib/utils';
import {
  Plus,
  Trash2,
  UsersRound,
  Clock,
  Calendar,
  UserPlus,
  UserMinus,
  X,
  Search,
  ChevronLeft,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export default function GroupsPage() {
  const t = useTranslations('groups');
  const tc = useTranslations('common');
  const ts = useTranslations('students');
  const { addToast } = useToast();
  const { user } = useAuth();
  const canManage = canManageTrainings(user);

  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const { data: trainings, isLoading: trainingsLoading } = useTrainings();
  const {
    data: groups,
    isLoading: groupsLoading,
    error,
    refetch,
  } = useGroups(selectedTraining && selectedTraining !== '__all__' ? selectedTraining : undefined);

  // Fetch detailed group info (with students) when a group is selected
  const { data: selectedGroup } = useGroup(selectedGroupId || '');

  // Fetch all students for the add-student picker
  const { data: studentsPage } = useStudents({ size: 500 });
  const allStudents = useMemo(() => studentsPage?.content || [], [studentsPage]);

  const createMutation = useCreateGroup();
  const deleteMutation = useDeleteGroup();
  const addStudentMutation = useAddStudentToGroup();
  const removeStudentMutation = useRemoveStudentFromGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupCreateFormData>({
    resolver: zodResolver(groupCreateSchema),
  });

  useEffect(() => {
    if (showCreate) {
      reset({
        name: '',
        trainingId: selectedTraining && selectedTraining !== '__all__' ? selectedTraining : '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        studentIds: [],
      });
    }
  }, [showCreate, selectedTraining, reset]);

  const onCreateSubmit = async (data: GroupCreateFormData) => {
    try {
      await createMutation.mutateAsync(data);
      addToast(t('createSuccess'), 'success');
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tc('error');
      addToast(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      addToast(t('deleteSuccess'), 'success');
      setDeleteId(null);
      if (selectedGroupId === deleteId) setSelectedGroupId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tc('error');
      addToast(msg, 'error');
    }
  };

  const handleAddStudent = async (studentId: string) => {
    if (!selectedGroupId) return;
    try {
      await addStudentMutation.mutateAsync({ groupId: selectedGroupId, studentId });
      addToast(t('addStudentSuccess'), 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tc('error');
      addToast(msg, 'error');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroupId) return;
    try {
      await removeStudentMutation.mutateAsync({ groupId: selectedGroupId, studentId });
      addToast(t('removeStudentSuccess'), 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tc('error');
      addToast(msg, 'error');
    }
  };

  // Students available to add (not already in the group)
  const availableStudents = useMemo(() => {
    if (!selectedGroup) return allStudents;
    const groupStudentIds = new Set(selectedGroup.studentIds || []);
    return allStudents.filter((s) => !groupStudentIds.has(s.id));
  }, [allStudents, selectedGroup]);

  const filteredAvailableStudents = useMemo(() => {
    if (!studentSearch.trim()) return availableStudents;
    const q = studentSearch.toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [availableStudents, studentSearch]);

  const getDayLabel = (day?: string) => {
    if (!day) return '—';
    const dayMap: Record<string, string> = {
      MONDAY: t('monday'),
      TUESDAY: t('tuesday'),
      WEDNESDAY: t('wednesday'),
      THURSDAY: t('thursday'),
      FRIDAY: t('friday'),
      SATURDAY: t('saturday'),
      SUNDAY: t('sunday'),
    };
    return dayMap[day] ?? day;
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
        {canManage && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addGroup')}
          </Button>
        )}
      </div>

      {/* Filter by training */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('training')}
            </label>
            {trainingsLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            ) : (
              <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                <SelectTrigger aria-label={t('training')}>
                  <SelectValue placeholder={tc('all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{tc('all')}</SelectItem>
                  {trainings?.map((tr) => (
                    <SelectItem key={tr.id} value={tr.id}>
                      {tr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups list + detail */}
      {groupsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          title={t('noGroups')}
          description={t('noGroupsDesc')}
          icon={<UsersRound className="h-12 w-12" />}
          action={
            canManage
              ? { label: t('addGroup'), onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Groups cards */}
          <div className={`space-y-4 ${selectedGroupId ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            <div className={`grid gap-4 ${selectedGroupId ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className={`group relative cursor-pointer transition-all hover:shadow-md ${
                    selectedGroupId === group.id
                      ? 'ring-2 ring-sky-500 dark:ring-sky-400'
                      : ''
                  }`}
                  onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        <UsersRound className="h-5 w-5 text-sky-600" aria-hidden="true" />
                        {group.name}
                      </span>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(group.id); }}
                          className="text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.trainingTitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.trainingTitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {group.dayOfWeek && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {getDayLabel(group.dayOfWeek)}
                        </Badge>
                      )}
                      {group.startTime && group.endTime && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {group.startTime} – {group.endTime}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('studentsCount', { count: group.studentCount })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected group detail panel */}
          {selectedGroupId && selectedGroup && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroupId(null)}
                        className="lg:hidden"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <UsersRound className="h-5 w-5 text-sky-600" aria-hidden="true" />
                      <span>{t('studentsInGroup')} – {selectedGroup.name}</span>
                    </div>
                    {canManage && (
                      <Button size="sm" onClick={() => { setShowAddStudent(true); setStudentSearch(''); }}>
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        {t('addStudentToGroup')}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedGroup.students && selectedGroup.students.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGroup.students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            {student.imageUrl ? (
                              <Image
                                src={student.imageUrl}
                                alt={`${student.firstName} ${student.lastName}`}
                                width={36}
                                height={36}
                                unoptimized
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                                {getInitials(student.firstName, student.lastName)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              disabled={removeStudentMutation.isPending}
                              className="text-red-500 hover:text-red-700"
                            >
                              <UserMinus className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t('removeStudentFromGroup')}</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('noStudentsInGroup')}
                      {canManage && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() => { setShowAddStudent(true); setStudentSearch(''); }}
                        >
                          <UserPlus className="h-4 w-4" />
                          {t('addStudentToGroup')}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Add Student to Group Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('addStudentToGroup')}</DialogTitle>
            <DialogDescription>
              {t('addStudentToGroupDesc', { group: selectedGroup?.name || '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 h-full w-9 text-gray-400" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={ts('searchPlaceholder')}
              className="ps-10"
            />
            {studentSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 end-0"
                onClick={() => setStudentSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[50vh]">
            {filteredAvailableStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">{tc('noResults')}</p>
            ) : (
              filteredAvailableStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {student.imageUrl ? (
                      <Image
                        src={student.imageUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                        {getInitials(student.firstName, student.lastName)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddStudent(student.id)}
                    disabled={addStudentMutation.isPending}
                  >
                    <Plus className="h-4 w-4" />
                    {tc('create')}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudent(false)}>
              {tc('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addGroup')}</DialogTitle>
            <DialogDescription>{t('noGroupsDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <FormField label={t('groupName')} name="name" error={errors.name}>
              <Input {...register('name')} id="name" placeholder={t('groupName')} />
            </FormField>

            <FormField label={t('training')} name="trainingId" error={errors.trainingId}>
              <Select
                value={watch('trainingId') || ''}
                onValueChange={(v) => setValue('trainingId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('training')} />
                </SelectTrigger>
                <SelectContent>
                  {trainings?.map((tr) => (
                    <SelectItem key={tr.id} value={tr.id}>
                      {tr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t('dayOfWeek')} name="dayOfWeek">
              <Select
                value={watch('dayOfWeek') || ''}
                onValueChange={(v) => setValue('dayOfWeek', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dayOfWeek')} />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {getDayLabel(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('startTime')} name="startTime">
                <Input type="time" id="startTime" {...register('startTime')} />
              </FormField>
              <FormField label={t('endTime')} name="endTime">
                <Input type="time" id="endTime" {...register('endTime')} />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {tc('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc('confirm')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
