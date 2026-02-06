import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
