'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSeances, useDeleteSeance } from '@/lib/hooks';
import { useAuth, isAdmin, isManager } from '@/lib/auth-provider';
import { SeanceFormDialog } from './seance-form-dialog';
import { SeanceDetailDialog } from './seance-detail-dialog';
import type { Seance } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  REPORTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function PlanningCalendar() {
  const t = useTranslations('planning');
  const tc = useTranslations('common');
  const { user } = useAuth();
  const { addToast } = useToast();

  const canManage = isAdmin(user) || isManager(user);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date range for the month view
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: seances, isLoading } = useSeances({ from, to });
  const deleteSeance = useDeleteSeance();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= lastDay; d++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill grid (6 rows × 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month + 2 > 12 ? 1 : month + 2;
      const nextYear = month + 2 > 12 ? year + 1 : year;
      days.push({
        date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, lastDay]);

  // Map seances by date
  const seancesByDate = useMemo(() => {
    const map: Record<string, Seance[]> = {};
    seances?.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [seances]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().slice(0, 10);

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const handleDayClick = (date: string) => {
    if (!canManage) return;
    setSelectedDate(date);
    setSelectedSeance(null);
    setFormOpen(true);
  };

  const handleSeanceClick = (e: React.MouseEvent, seance: Seance) => {
    e.stopPropagation();
    setSelectedSeance(seance);
    setDetailOpen(true);
  };

  const handleEdit = () => {
    if (!selectedSeance) return;
    setDetailOpen(false);
    setSelectedDate(selectedSeance.date);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSeance) return;
    try {
      await deleteSeance.mutateAsync(selectedSeance.id);
      addToast(t('deleteSuccess'), 'success');
      setDetailOpen(false);
      setSelectedSeance(null);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        </div>
        {canManage && (
          <Button onClick={() => { setSelectedDate(today); setSelectedSeance(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 me-1.5" />
            {t('addSeance')}
          </Button>
        )}
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth} aria-label={t('previousMonth')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <CardTitle className="capitalize">{monthName}</CardTitle>
              <Button variant="outline" size="sm" onClick={goToday}>{t('today')}</Button>
            </div>
            <Button variant="outline" size="sm" onClick={nextMonth} aria-label={t('nextMonth')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">{tc('loading')}</div>
          ) : (
            <>
              {/* Day names header */}
              <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {dayNames.map((d, i) => (
                  <div key={i} className="py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-t border-s border-gray-200 dark:border-gray-700">
                {calendarDays.map(({ date, day, isCurrentMonth }, idx) => {
                  const daySeances = seancesByDate[date] ?? [];
                  const isToday = date === today;

                  return (
                    <div
                      key={idx}
                      className={`
                        min-h-[80px] sm:min-h-[100px] border-e border-b border-gray-200 dark:border-gray-700 p-1
                        ${isCurrentMonth ? '' : 'bg-gray-50 dark:bg-gray-800/50'}
                        ${isToday ? 'bg-sky-50 dark:bg-sky-900/20' : ''}
                        ${canManage ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''}
                        transition-colors
                      `}
                      onClick={() => handleDayClick(date)}
                    >
                      <div className={`text-sm font-medium mb-0.5 ${isToday ? 'text-sky-600 dark:text-sky-400 font-bold' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {daySeances.slice(0, 3).map((s) => (
                          <button
                            key={s.id}
                            onClick={(e) => handleSeanceClick(e, s)}
                            className={`
                              w-full text-[10px] sm:text-xs text-start truncate rounded px-1 py-0.5
                              ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-700'}
                              hover:opacity-80 transition-opacity cursor-pointer
                            `}
                            title={`${s.startTime} ${s.title || s.trainingTitle}`}
                          >
                            <span className="font-medium">{s.startTime}</span>{' '}
                            <span className="hidden sm:inline">{s.title || s.trainingTitle}</span>
                          </button>
                        ))}
                        {daySeances.length > 3 && (
                          <div className="text-[10px] text-gray-500 ps-1">+{daySeances.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                  <div key={status} className="flex items-center gap-1">
                    <Badge className={`${cls} text-[10px] px-1.5 py-0`}>{t(`status_${status}`)}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <SeanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        date={selectedDate}
        seance={selectedSeance}
      />

      {/* Detail Dialog */}
      <SeanceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        seance={selectedSeance}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
