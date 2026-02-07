import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/50 dark:text-emerald-300 dark:ring-emerald-400/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/50 dark:text-amber-300 dark:ring-amber-400/20',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/50 dark:text-red-300 dark:ring-red-400/20',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-300 dark:ring-blue-400/20',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
