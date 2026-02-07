'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrainings, useGroups, useTrainers, useCreateSeance, useUpdateSeance } from '@/lib/hooks';
import { useToast } from '@/components/ui/toast';
import type { Seance, SeanceCreateInput, Training } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { seancesApi } from '@/lib/api-client';

interface SeanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string; // YYYY-MM-DD
  seance?: Seance | null;
}

export function SeanceFormDialog({ open, onOpenChange, date, seance }: SeanceFormDialogProps) {
  const t = useTranslations('planning');
  const tc = useTranslations('common');
  const { addToast } = useToast();

  const { data: trainings } = useTrainings();
  const { data: trainers } = useTrainers();

  const [trainingId, setTrainingId] = useState(seance?.trainingId ?? '');
  const [groupId, setGroupId] = useState(seance?.groupId ?? '');
  const [trainerId, setTrainerId] = useState(seance?.trainerId ?? '');
  const [seanceDate, setSeanceDate] = useState(date ?? seance?.date ?? '');
  const [startTime, setStartTime] = useState(seance?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(seance?.endTime ?? '10:30');
  const [levelNumber, setLevelNumber] = useState(seance?.levelNumber ?? 1);
  const [sessionNumber, setSessionNumber] = useState(seance?.sessionNumber ?? 1);
  const [title, setTitle] = useState(seance?.title ?? '');
  const [availabilityOk, setAvailabilityOk] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { data: groups } = useGroups(trainingId || undefined);

  const createSeance = useCreateSeance();
  const updateSeance = useUpdateSeance(seance?.id ?? '');

  const isEditing = !!seance;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTrainingId(seance?.trainingId ?? '');
      setGroupId(seance?.groupId ?? '');
      setTrainerId(seance?.trainerId ?? '');
      setSeanceDate(date ?? seance?.date ?? '');
      setStartTime(seance?.startTime ?? '09:00');
      setEndTime(seance?.endTime ?? '10:30');
      setLevelNumber(seance?.levelNumber ?? 1);
      setSessionNumber(seance?.sessionNumber ?? 1);
      setTitle(seance?.title ?? '');
      setAvailabilityOk(null);
    }
  }, [open, seance, date]);

  // Get selected training for session selector
  const selectedTraining = trainings?.find((tr: Training) => tr.id === trainingId);

  // Check trainer availability
  useEffect(() => {
    if (!trainerId || !seanceDate || !startTime || !endTime) {
      setAvailabilityOk(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingAvailability(true);
      try {
        const available = await seancesApi.checkAvailability(trainerId, seanceDate, startTime, endTime);
        setAvailabilityOk(available);
      } catch {
        setAvailabilityOk(null);
      } finally {
        setCheckingAvailability(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [trainerId, seanceDate, startTime, endTime]);

  // Build sessionId from training structure
  const getSessionId = (): string => {
    if (!selectedTraining) return '';
    const levelIdx = levelNumber - 1;
    const sessionIdx = sessionNumber - 1;
    if (selectedTraining.levels?.[levelIdx]?.sessions?.[sessionIdx]) {
      return selectedTraining.levels[levelIdx].sessions[sessionIdx].sessionId;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sessionId = getSessionId();
    const data: SeanceCreateInput = {
      trainingId,
      sessionId,
      groupId,
      trainerId,
      date: seanceDate,
      startTime,
      endTime,
      levelNumber,
      sessionNumber,
      title: title || `${t('session')} ${levelNumber}.${sessionNumber}`,
    };

    try {
      if (isEditing) {
        await updateSeance.mutateAsync(data);
        addToast(t('updateSuccess'), 'success');
      } else {
        await createSeance.mutateAsync(data);
        addToast(t('createSuccess'), 'success');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('error');
      addToast(msg, 'error');
    }
  };

  const isPending = createSeance.isPending || updateSeance.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editSeance') : t('addSeance')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Training */}
          <div className="space-y-1.5">
            <Label>{t('training')}</Label>
            <Select value={trainingId} onValueChange={setTrainingId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectTraining')} />
              </SelectTrigger>
              <SelectContent>
                {trainings?.map((tr: Training) => (
                  <SelectItem key={tr.id} value={tr.id}>{tr.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level & Session */}
          {selectedTraining && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('level')}</Label>
                <Select value={String(levelNumber)} onValueChange={(v) => { setLevelNumber(Number(v)); setSessionNumber(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTraining.levels?.map((_: unknown, i: number) => (
                      <SelectItem key={i} value={String(i + 1)}>{t('level')} {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('sessionNum')}</Label>
                <Select value={String(sessionNumber)} onValueChange={(v) => setSessionNumber(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTraining.levels?.[levelNumber - 1]?.sessions?.map((_: unknown, i: number) => (
                      <SelectItem key={i} value={String(i + 1)}>{t('sessionNum')} {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Group */}
          <div className="space-y-1.5">
            <Label>{t('group')}</Label>
            <Select value={groupId} onValueChange={setGroupId} disabled={!trainingId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectGroup')} />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trainer */}
          <div className="space-y-1.5">
            <Label>{t('trainer')}</Label>
            <Select value={trainerId} onValueChange={setTrainerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectTrainer')} />
              </SelectTrigger>
              <SelectContent>
                {trainers?.map((tr) => (
                  <SelectItem key={tr.id} value={tr.id}>
                    {tr.firstName} {tr.lastName}
                    {tr.speciality ? ` — ${tr.speciality}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Availability indicator */}
            {trainerId && seanceDate && startTime && endTime && (
              <div className="flex items-center gap-1.5 text-sm mt-1">
                {checkingAvailability ? (
                  <span className="text-gray-500">{t('checkingAvailability')}</span>
                ) : availabilityOk === true ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('trainerAvailable')}
                  </span>
                ) : availabilityOk === false ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {t('trainerUnavailable')}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label>{tc('date')}</Label>
            <Input type="date" value={seanceDate} onChange={(e) => setSeanceDate(e.target.value)} required min={new Date().toISOString().slice(0, 10)} />
            {seanceDate && seanceDate < new Date().toISOString().slice(0, 10) && (
              <p className="text-sm text-red-600">{t('datePastError')}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('startTime')}</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t('endTime')}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          {startTime && endTime && endTime <= startTime && (
            <p className="text-sm text-red-600">{t('endTimeError')}</p>
          )}

          {/* Title (optional) */}
          <div className="space-y-1.5">
            <Label>{t('seanceTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${t('session')} ${levelNumber}.${sessionNumber}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !trainingId || !groupId || !trainerId || !seanceDate || availabilityOk === false || (!!seanceDate && seanceDate < new Date().toISOString().slice(0, 10)) || (!!startTime && !!endTime && endTime <= startTime)}>
              {isPending ? tc('loading') : (isEditing ? tc('save') : tc('create'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
