'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudents, useTrainings, useGroups, useSeances, useTrainers } from '@/lib/hooks';
import { useAuth, isAdmin, isManager, isTrainer } from '@/lib/auth-provider';
import { PlanningCalendar } from '@/components/planning/planning-calendar';
import { TrainerDashboard } from '@/components/trainer/trainer-dashboard';
import {
  BookOpen,
  ClipboardCheck,
  Plus,
  ArrowRight,
  Users,
  Calendar,
  Layers,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
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
  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const { data: trainersData, isLoading: trainersLoading } = useTrainers();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: seancesData, isLoading: seancesLoading } = useSeances({ date: todayStr });

  const totalStudents = studentsData?.totalElements ?? 0;
  const totalTrainings = trainingsData?.length ?? 0;
  const totalGroups = groupsData?.length ?? 0;
  const totalTrainers = trainersData?.length ?? 0;
  const todaySeances = seancesData ?? [];
  const completedToday = todaySeances.filter((s) => s.status === 'COMPLETED').length;
  const inProgressToday = todaySeances.filter((s) => s.status === 'IN_PROGRESS').length;
  const plannedToday = todaySeances.filter((s) => s.status === 'PLANNED').length;
  const isLoading = studentsLoading || trainingsLoading || groupsLoading || seancesLoading || trainersLoading;

  const completionPct = todaySeances.length > 0 ? Math.round((completedToday / todaySeances.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ──── Global Overview ──── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
        {/* Main stats card */}
        <Card className="sm:col-span-2 lg:col-span-2 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-emerald-50/40 dark:from-blue-950/30 dark:to-emerald-950/20 pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              {t('overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat
                icon={<Users className="h-4 w-4" />}
                label={t('totalStudents')}
                value={isLoading ? '…' : String(totalStudents)}
                color="blue"
              />
              <MiniStat
                icon={<BookOpen className="h-4 w-4" />}
                label={t('totalTrainings')}
                value={isLoading ? '…' : String(totalTrainings)}
                color="emerald"
              />
              <MiniStat
                icon={<Layers className="h-4 w-4" />}
                label={t('totalGroups')}
                value={isLoading ? '…' : String(totalGroups)}
                color="violet"
              />
              <MiniStat
                icon={<UserCheck className="h-4 w-4" />}
                label={t('activeTrainers')}
                value={isLoading ? '…' : String(totalTrainers)}
                color="amber"
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's progress ring */}
        <Card className="flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-purple-50/40 dark:from-amber-950/20 dark:to-purple-950/20 pointer-events-none" />
          <CardHeader className="pb-1 w-full">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {t('sessionsToday')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0 pb-5">
            {/* SVG ring */}
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(completionPct / 100) * 264} 264`}
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isLoading ? '…' : todaySeances.length}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('sessionsToday')}</span>
              </div>
            </div>
            {/* Mini breakdown */}
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {completedToday}
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" /> {inProgressToday}
              </span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-3 w-3" /> {plannedToday}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning Calendar */}
      <PlanningCalendar />

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

function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
  };

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div className={`rounded-lg p-2 ${colors[color]}`} aria-hidden="true">
        {icon}
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
      <span className="text-xs text-center text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
    </div>
  );
}
