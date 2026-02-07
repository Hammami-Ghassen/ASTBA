'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AutoBreadcrumb } from '@/components/layout/breadcrumb';

const AUTH_ROUTES = ['/login', '/register', '/auth/callback', '/access-denied'];

/**
 * Conditionally renders the Navbar, main wrapper, and footer.
 * Auth pages get a clean full-screen layout; everything else gets the standard chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" tabIndex={-1}>
        <AutoBreadcrumb />
        {children}
      </main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <p>© 2026 ASTBA – Association Sciences and Technology Ben Arous</p>
      </footer>
    </>
  );
}
