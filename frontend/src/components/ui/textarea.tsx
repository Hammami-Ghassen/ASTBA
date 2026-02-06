import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
        error && 'border-red-500 focus-visible:ring-red-500',
        className
      )}
      ref={ref}
      aria-invalid={error || undefined}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
