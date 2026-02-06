'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { LoadingSkeleton } from '@/components/layout/states';
import type { UserRole } from '@/lib/types';

interface RequireAuthProps {
  children: React.ReactNode;
  /** If specified, user must have at least one of these roles */
  roles?: UserRole[];
}

/**
 * Client-side route guard.
 * Wraps page content and redirects unauthenticated/unauthorized users.
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (roles && roles.length > 0 && user) {
      const hasRequiredRole = roles.some((role) => user.roles.includes(role));
      if (!hasRequiredRole) {
        router.replace('/access-denied');
      }
    }
  }, [isLoading, isAuthenticated, user, roles, router]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && roles.length > 0 && user) {
    const hasRequiredRole = roles.some((role) => user.roles.includes(role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}
