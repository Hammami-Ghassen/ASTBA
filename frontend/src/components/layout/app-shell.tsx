'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AutoBreadcrumb } from '@/components/layout/breadcrumb';

const AUTH_ROUTES = ['/login', '/register', '/auth/callback', '/access-denied'];
const CLEAN_LAYOUT_ROUTES = ['/'];

/**
 * Conditionally renders the Navbar, main wrapper, and footer.
 * Auth pages get a clean full-screen layout; everything else gets the standard chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isCleanPage = CLEAN_LAYOUT_ROUTES.includes(pathname);

  if (isAuthPage || isCleanPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 page-transition" tabIndex={-1}>
        <AutoBreadcrumb />
        {children}
      </main>
      <footer className="relative mt-8 border-t border-gray-200/60 py-8 text-center text-base text-gray-500 dark:border-gray-700/60 dark:text-gray-400 before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[var(--color-primary)]/30 before:to-transparent">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-medium">© 2026 <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent font-semibold">ASTBA</span> – Association Sciences and Technology Ben Arous</p>
        </div>
      </footer>
    </>
  );
}
