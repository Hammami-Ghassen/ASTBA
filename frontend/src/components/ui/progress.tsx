'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  label?: string;
}

const Progress = React.forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value = 0, label, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', className)}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out motion-reduce:transition-none dark:bg-sky-400"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </ProgressPrimitive.Root>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
