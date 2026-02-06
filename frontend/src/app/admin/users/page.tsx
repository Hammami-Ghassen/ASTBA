'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, UserCheck, UserX } from 'lucide-react';

import { RequireAuth } from '@/components/auth/require-auth';
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/layout/states';
import { useToast } from '@/components/ui/toast';
import { adminApi } from '@/lib/auth-api';
import { getInitials } from '@/lib/utils';
import type { AuthUser, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'TRAINER'];

const roleBadgeVariant: Record<UserRole, 'default' | 'info' | 'success' | 'warning'> = {
  ADMIN: 'default',
  MANAGER: 'info',
  TRAINER: 'success',
};

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={['ADMIN']}>
      <AdminUsersContent />
    </RequireAuth>
  );
}

function AdminUsersContent() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [roleDialog, setRoleDialog] = useState<{ user: AuthUser; newRole: UserRole } | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ user: AuthUser; enable: boolean } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'users', searchQuery, page],
    queryFn: () => adminApi.listUsers({ query: searchQuery || undefined, page, size: 20 }),
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminApi.changeRole(userId, role),
    onSuccess: () => {
      addToast(t('roleChanged'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setRoleDialog(null);
    },
    onError: () => addToast(tc('error'), 'error'),
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: import('@/lib/types').UserStatus }) =>
      adminApi.changeStatus(userId, status),
    onSuccess: () => {
      addToast(t('statusChanged'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setStatusDialog(null);
    },
    onError: () => addToast(tc('error'), 'error'),
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setPage(0);
    },
    [],
  );

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('usersTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('usersDescription')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          placeholder={t('searchUsers')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="ps-10"
          aria-label={t('searchUsers')}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title={t('noUsers')}
          description={t('noUsersDesc')}
          icon={<Shield className="h-12 w-12" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableCaption>{t('usersTitle')}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{tc('name')}</TableHead>
                  <TableHead scope="col">{tc('email')}</TableHead>
                  <TableHead scope="col">{t('role')}</TableHead>
                  <TableHead scope="col">{t('provider')}</TableHead>
                  <TableHead scope="col">{tc('status')}</TableHead>
                  <TableHead scope="col">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                          {getInitials(u.firstName, u.lastName)}
                        </span>
                        <span className="font-medium">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <Badge key={role} variant={roleBadgeVariant[role]}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {u.provider || 'LOCAL'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {u.status === 'ACTIVE' ? t('enabled') : t('disabled')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Role change */}
                        <Select
                          value={u.roles[0]}
                          onValueChange={(newRole) =>
                            setRoleDialog({ user: u, newRole: newRole as UserRole })
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-[120px] text-xs"
                            aria-label={`${t('changeRole')} – ${u.firstName} ${u.lastName}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Enable/Disable */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStatusDialog({ user: u, enable: u.status !== 'ACTIVE' })}
                          aria-label={`${u.status === 'ACTIVE' ? t('disableUser') : t('enableUser')} – ${u.firstName} ${u.lastName}`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <UserX className="h-4 w-4 text-red-500" aria-hidden="true" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {tc('previous')}
              </Button>
              <span className="text-sm text-gray-500">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                {tc('next')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Role change confirmation dialog */}
      <Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
        <DialogContent aria-labelledby="role-change-title">
          <DialogHeader>
            <DialogTitle id="role-change-title">{t('changeRole')}</DialogTitle>
            <DialogDescription>
              {roleDialog && t('confirmRoleChange', { role: roleDialog.newRole })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={() =>
                roleDialog &&
                roleChangeMutation.mutate({
                  userId: roleDialog.user.id,
                  role: roleDialog.newRole,
                })
              }
              disabled={roleChangeMutation.isPending}
            >
              {tc('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change confirmation dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent aria-labelledby="status-change-title">
          <DialogHeader>
            <DialogTitle id="status-change-title">
              {statusDialog?.enable ? t('enableUser') : t('disableUser')}
            </DialogTitle>
            <DialogDescription>
              {statusDialog &&
                t('confirmStatusChange', {
                  action: statusDialog.enable ? t('enableUser') : t('disableUser'),
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>
              {tc('cancel')}
            </Button>
            <Button
              variant={statusDialog?.enable ? 'default' : 'destructive'}
              onClick={() =>
                statusDialog &&
                statusChangeMutation.mutate({
                  userId: statusDialog.user.id,
                  status: statusDialog.enable ? 'ACTIVE' : 'DISABLED',
                })
              }
              disabled={statusChangeMutation.isPending}
            >
              {tc('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
