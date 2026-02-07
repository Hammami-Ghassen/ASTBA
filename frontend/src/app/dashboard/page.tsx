'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudents, useTrainings } from '@/lib/hooks';
import { useAuth, isAdmin, isManager, isTrainer } from '@/lib/auth-provider';
import { PlanningCalendar } from '@/components/planning/planning-calendar';
import { TrainerDashboard } from '@/components/trainer/trainer-dashboard';
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
  const { user } = useAuth();

  // Manager/Admin → planning calendar
  if (isManager(user) || isAdmin(user)) {
    return <ManagerDashboard />;
  }

  // Trainer → trainer sessions view
  if (isTrainer(user)) {
    return <TrainerDashboard />;
  }

  // Fallback (should not happen normally)
  return <ManagerDashboard />;
}

function ManagerDashboard() {
  const t = useTranslations('dashboard');
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ page: 0, size: 1 });
  const { data: trainingsData, isLoading: trainingsLoading } = useTrainings();

  const totalStudents = studentsData?.totalElements ?? 0;
  const totalTrainings = trainingsData?.length ?? 0;
  const isLoading = studentsLoading || trainingsLoading;

  return (
    <div className="space-y-8">
      {/* Planning Calendar */}
      <PlanningCalendar />

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-in" role="region" aria-label={t('title')}>
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
          <div className="grid gap-3 sm:grid-cols-3 stagger-in">
            <Link href="/students/new" className="group">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 p-4 transition-all duration-300 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-sky-500 dark:border-gray-700/60 dark:hover:border-blue-600/40 dark:hover:from-blue-950/40 dark:hover:to-transparent dark:hover:shadow-blue-900/20">
                <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 p-2.5 shadow-sm dark:from-blue-900/60 dark:to-blue-800/40">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('addStudent')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </div>
            </Link>

            <Link href="/trainings/new" className="group">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 p-4 transition-all duration-300 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-transparent hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-gray-700/60 dark:hover:border-emerald-600/40 dark:hover:from-emerald-950/40 dark:hover:to-transparent dark:hover:shadow-emerald-900/20">
                <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-2.5 shadow-sm dark:from-emerald-900/60 dark:to-emerald-800/40">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('addTraining')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </div>
            </Link>

            <Link href="/attendance" className="group">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 p-4 transition-all duration-300 hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent hover:shadow-md hover:shadow-amber-100/50 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-amber-500 dark:border-gray-700/60 dark:hover:border-amber-600/40 dark:hover:from-amber-950/40 dark:hover:to-transparent dark:hover:shadow-amber-900/20">
                <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 p-2.5 shadow-sm dark:from-amber-900/60 dark:to-amber-800/40">
                  <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('markAttendance')}
                  </p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
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
    sky: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/60 dark:to-blue-800/40 dark:text-blue-400',
    emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/60 dark:to-emerald-800/40 dark:text-emerald-400',
    amber: 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 dark:from-amber-900/60 dark:to-amber-800/40 dark:text-amber-400',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 dark:from-purple-900/60 dark:to-purple-800/40 dark:text-purple-400',
  };

  const borderMap = {
    sky: 'border-l-[3px] border-l-blue-500',
    emerald: 'border-l-[3px] border-l-emerald-500',
    amber: 'border-l-[3px] border-l-amber-500',
    purple: 'border-l-[3px] border-l-purple-500',
  };

  return (
    <Card className={borderMap[color]}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-xl p-3 shadow-sm ${bgMap[color]}`} aria-hidden="true">
          {icon}
        </div>
        <div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
