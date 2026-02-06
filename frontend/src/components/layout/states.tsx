'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        {icon || <Inbox className="h-12 w-12" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useTranslations('common');
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="mb-4 h-12 w-12 text-red-400" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t('error')}
      </h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse motion-reduce:animate-none">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
