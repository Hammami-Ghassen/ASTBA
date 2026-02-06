'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudents, useTrainings } from '@/lib/hooks';
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Plus,
  ArrowRight,
  Users,
  Calendar,
  GraduationCap,
} from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ page: 0, size: 1 });
  const { data: trainingsData, isLoading: trainingsLoading } = useTrainings();

  const totalStudents = studentsData?.totalElements ?? 0;
  const totalTrainings = trainingsData?.length ?? 0;
  const isLoading = studentsLoading || trainingsLoading;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('overview')}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label={t('title')}>
        <StatCard
          title={t('totalStudents')}
          value={isLoading ? '…' : String(totalStudents)}
          icon={<Users className="h-5 w-5" />}
          color="sky"
        />
        <StatCard
          title={t('totalTrainings')}
          value={isLoading ? '…' : String(totalTrainings)}
          icon={<BookOpen className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title={t('sessionsToday')}
          value="—"
          icon={<Calendar className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          title={t('eligibleCertificates')}
          value="—"
          icon={<Award className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/students/new" className="group">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50 focus-within:ring-2 focus-within:ring-sky-500 dark:border-gray-700 dark:hover:border-sky-600 dark:hover:bg-sky-950">
                <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                  <Plus className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t('addStudent')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 rtl:rotate-180" aria-hidden="true" />
              </div>
            </Link>

            <Link href="/trainings/new" className="group">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-gray-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950">
                <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t('addTraining')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 rtl:rotate-180" aria-hidden="true" />
              </div>
            </Link>

            <Link href="/attendance" className="group">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-amber-300 hover:bg-amber-50 focus-within:ring-2 focus-within:ring-amber-500 dark:border-gray-700 dark:hover:border-amber-600 dark:hover:bg-amber-950">
                <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                  <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t('markAttendance')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 rtl:rotate-180" aria-hidden="true" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'sky' | 'emerald' | 'amber' | 'purple';
}) {
  const bgMap = {
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-full p-3 ${bgMap[color]}`} aria-hidden="true">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
