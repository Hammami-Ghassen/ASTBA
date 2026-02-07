'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStudents, useDeleteStudent } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, Eye, Trash2, Edit, GraduationCap } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useAuth, canManageStudents } from '@/lib/auth-provider';

export default function StudentsPage() {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();

  const { user } = useAuth();
  const canManage = canManageStudents(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useStudents({
    query: searchQuery || undefined,
    page,
    size: 15,
  });

  const deleteMutation = useDeleteStudent();

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

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  const students = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/students/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('addStudent')}
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="ps-10"
          aria-label={t('searchPlaceholder')}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : students.length === 0 ? (
        <EmptyState
          title={t('noStudents')}
          description={t('noStudentsDesc')}
          icon={<GraduationCap className="h-12 w-12" />}
          action={
            canManage
              ? {
                  label: t('addStudent'),
                  onClick: () => router.push('/students/new'),
                }
              : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableCaption className="sr-only">{t('title')}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{tc('name')}</TableHead>
                  <TableHead scope="col">{tc('email')}</TableHead>
                  <TableHead scope="col">{tc('phone')}</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">{tc('actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
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
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                            aria-hidden="true"
                          >
                            {getInitials(student.firstName, student.lastName)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {student.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" asChild aria-label={`${tc('edit')} ${student.firstName}`}>
                          <Link href={`/students/${student.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(student.id)}
                            aria-label={`${tc('delete')} ${student.firstName}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  {tc('previous')}
                </Button>
                <span className="text-sm text-gray-500" aria-live="polite">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  {tc('next')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
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
