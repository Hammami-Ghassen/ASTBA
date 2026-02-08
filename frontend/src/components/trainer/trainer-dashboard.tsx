'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMySeances, useUpdateSeanceStatus, useReportSeance } from '@/lib/hooks';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import type { Seance, SessionReportInput } from '@/lib/types';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Play,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  FileText,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
  COMPLETED: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
  REPORTED: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  CANCELLED: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
};

const BADGE_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  REPORTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function TrainerDashboard() {
  const t = useTranslations('trainerDashboard');
  const tp = useTranslations('planning');
  const tc = useTranslations('common');
  const { addToast } = useToast();

  const [tab, setTab] = useState('today');
  const [detailSeance, setDetailSeance] = useState<Seance | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSeanceId, setReportSeanceId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportSuggestedDate, setReportSuggestedDate] = useState('');
  const router = useRouter();

  // Get date ranges
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // This week (Mon–Sun)
  const dayOfWeek = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  // This month
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  const { data: allSeances, isLoading } = useMySeances(monthStart, monthEnd);

  const updateStatus = useUpdateSeanceStatus();
  const reportMutation = useReportSeance(reportSeanceId);

  // Filter by tab
  const filteredSeances = useMemo(() => {
    if (!allSeances) return [];
    switch (tab) {
      case 'today':
        return allSeances.filter((s) => s.date === todayStr);
      case 'week':
        return allSeances.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr);
      case 'month':
        return allSeances;
      default:
        return allSeances;
    }
  }, [allSeances, tab, todayStr, weekStartStr, weekEndStr]);

  // Sort by date then start time
  const sorted = useMemo(
    () => [...filteredSeances].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [filteredSeances]
  );

  const todayCount = allSeances?.filter((s) => s.date === todayStr).length ?? 0;

  const handleStartSeance = async (seance: Seance) => {
    // Check if we're past the scheduled start time
    const scheduledStart = new Date(`${seance.date}T${seance.startTime}`);
    if (new Date() < scheduledStart) {
      addToast(t('cannotStartBeforeTime', { date: seance.date, time: seance.startTime }), 'error');
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: seance.id, status: 'IN_PROGRESS' });
      addToast(t('seanceStarted'), 'success');
      // Redirect to attendance page with full seance context pre-filled
      const params = new URLSearchParams({
        seanceId: seance.id,
        trainingId: seance.trainingId,
        groupId: seance.groupId,
        levelNumber: String(seance.levelNumber),
        sessionId: seance.sessionId,
      });
      router.push(`/attendance?${params.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tc('error');
      addToast(msg, 'error');
    }
  };

  const openReport = (seance: Seance) => {
    setReportSeanceId(seance.id);
    setReportReason('');
    setReportSuggestedDate('');
    setReportOpen(true);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: SessionReportInput = {
      reason: reportReason,
      suggestedDate: reportSuggestedDate || undefined,
    };
    try {
      await reportMutation.mutateAsync(data);
      addToast(t('reportSubmitted'), 'success');
      setReportOpen(false);
    } catch {
      addToast(tc('error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('todaySeances', { count: todayCount })}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">{t('today')}</TabsTrigger>
          <TabsTrigger value="week">{t('thisWeek')}</TabsTrigger>
          <TabsTrigger value="month">{t('thisMonth')}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">{tc('loading')}</div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noSeances')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('noSeancesDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((seance) => (
                <Card
                  key={seance.id}
                  className={`border-2 transition-shadow hover:shadow-md cursor-pointer ${STATUS_COLORS[seance.status] ?? ''}`}
                  onClick={() => setDetailSeance(seance)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Title + Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {seance.title || seance.trainingTitle}
                          </span>
                          <Badge className={BADGE_COLORS[seance.status] ?? ''}>
                            {tp(`status_${seance.status}`)}
                          </Badge>
                        </div>

                        {/* Info row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {seance.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {seance.startTime} – {seance.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {tp('level')} {seance.levelNumber}.{seance.sessionNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {seance.groupName}
                          </span>
                          {seance.trainingDocumentUrl && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${seance.trainingDocumentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="h-3.5 w-3.5" /> {t('viewDocument')}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {seance.status === 'PLANNED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={(e) => { e.stopPropagation(); handleStartSeance(seance); }}
                            >
                              <Play className="h-3.5 w-3.5 me-1" /> {t('start')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={(e) => { e.stopPropagation(); openReport(seance); }}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 me-1" /> {t('report')}
                            </Button>
                          </>
                        )}
                        {seance.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              const params = new URLSearchParams({
                                seanceId: seance.id,
                                trainingId: seance.trainingId,
                                groupId: seance.groupId,
                                levelNumber: String(seance.levelNumber),
                                sessionId: seance.sessionId,
                              });
                              router.push(`/attendance?${params.toString()}`);
                            }}
                          >
                            <ClipboardCheck className="h-3.5 w-3.5 me-1" /> {t('markPresence')}
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400 rtl:rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Seance Detail Dialog */}
      <Dialog open={!!detailSeance} onOpenChange={(open) => !open && setDetailSeance(null)}>
        <DialogContent className="max-w-md">
          {detailSeance && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailSeance.title || detailSeance.trainingTitle}
                  <Badge className={BADGE_COLORS[detailSeance.status] ?? ''}>
                    {tp(`status_${detailSeance.status}`)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{detailSeance.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{detailSeance.startTime} – {detailSeance.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <BookOpen className="h-4 w-4" />
                  <span>{detailSeance.trainingTitle} — {tp('level')} {detailSeance.levelNumber}, {tp('sessionNum')} {detailSeance.sessionNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{detailSeance.groupName}</span>
                </div>
                {detailSeance.trainingDocumentUrl && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${detailSeance.trainingDocumentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('viewDocument')}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t dark:border-gray-700">
                {detailSeance.status === 'PLANNED' && (
                  <>
                    <Button size="sm" onClick={() => { setDetailSeance(null); handleStartSeance(detailSeance); }}>
                      <Play className="h-3.5 w-3.5 me-1" /> {t('start')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setDetailSeance(null); openReport(detailSeance); }}>
                      <AlertTriangle className="h-3.5 w-3.5 me-1" /> {t('report')}
                    </Button>
                  </>
                )}
                {detailSeance.status === 'IN_PROGRESS' && (
                  <Button size="sm" onClick={() => {
                    setDetailSeance(null);
                    const params = new URLSearchParams({
                      seanceId: detailSeance.id,
                      trainingId: detailSeance.trainingId,
                      groupId: detailSeance.groupId,
                      levelNumber: String(detailSeance.levelNumber),
                      sessionId: detailSeance.sessionId,
                    });
                    router.push(`/attendance?${params.toString()}`);
                  }}>
                    <ClipboardCheck className="h-3.5 w-3.5 me-1" /> {t('markPresence')}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {t('reportTitle')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReport} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('reportReason')}</Label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                rows={3}
                placeholder={t('reportReasonPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('suggestedDate')}</Label>
              <Input
                type="date"
                value={reportSuggestedDate}
                onChange={(e) => setReportSuggestedDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
              {reportSuggestedDate && reportSuggestedDate < new Date().toISOString().slice(0, 10) && (
                <p className="text-sm text-red-600">{t('suggestedDatePastError')}</p>
              )}
              <p className="text-sm text-gray-500">{t('suggestedDateHint')}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={!reportReason || reportMutation.isPending || (!!reportSuggestedDate && reportSuggestedDate < new Date().toISOString().slice(0, 10))}>
                {reportMutation.isPending ? tc('loading') : t('submitReport')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
