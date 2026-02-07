'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { useAuth, isAdmin } from '@/lib/auth-provider';
import { NotificationBell } from './notification-bell';
import Image from 'next/image';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Award,
  Menu,
  X,
  LogOut,
  Shield,
  User,
  ChevronDown,
  UsersRound,
  GraduationCap,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'students', href: '/students', icon: GraduationCap },
  { key: 'trainings', href: '/trainings', icon: BookOpen },
  { key: 'groups', href: '/groups', icon: UsersRound },
  { key: 'attendance', href: '/attendance', icon: ClipboardCheck },
  { key: 'certificates', href: '/certificates', icon: Award },
] as const;

export function Navbar() {
  const t = useTranslations('nav');
  const ta = useTranslations('auth');
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [userMenuOpen]);

  // Close user menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && userMenuOpen) {
        setUserMenuOpen(false);
        userButtonRef.current?.focus();
      }
    }
    if (userMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  // Build nav items including admin if user is ADMIN
  const allNavItems = isAdmin(user)
    ? [...navItems, { key: 'admin' as const, href: '/admin/users', icon: Shield }]
    : navItems;

  return (
    <header className="nav-cursor sticky top-0 z-40 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/90 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-[var(--color-primary)] after:via-[var(--color-accent)] after:to-[var(--color-primary)] after:opacity-80 transition-shadow duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 group"
          aria-label="ASTBA - Accueil"
        >
          <Image
            src="/astba/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent font-extrabold tracking-tight">ASTBA</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <nav aria-label="Navigation principale" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {allNavItems.map(({ key, href, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      className={cn(
                        'relative flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-orange-50 text-[var(--color-primary)] dark:from-blue-950/60 dark:to-orange-950/40 dark:text-blue-300 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100 hover:scale-[1.02] active:scale-[0.98]'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={cn('h-4 w-4 transition-colors', isActive && 'text-[var(--color-accent)]')} aria-hidden="true" />
                      {t(key)}
                      {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* User menu (desktop) */}
          {isAuthenticated && user && (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                ref={userButtonRef}
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={ta('userMenu')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xs font-semibold text-white shadow-sm">
                  {getInitials(user.firstName, user.lastName)}
                </span>
                <span className="max-w-[120px] truncate">{user.firstName}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', userMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label={ta('userMenu')}
                  className="absolute end-0 mt-2 w-56 origin-top-end rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-xl py-1 shadow-xl shadow-gray-200/50 dark:border-gray-700/60 dark:bg-gray-800/95 dark:shadow-gray-900/50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                >
                  {/* User info */}
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                      {user.roles.join(', ')}
                    </p>
                  </div>

                  {isAdmin(user) && (
                    <Link
                      href="/admin/users"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-base text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Shield className="h-4 w-4" aria-hidden="true" />
                      {t('admin')}
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-base text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {ta('logout')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Login button (when not authenticated) */}
          {!isAuthenticated && (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/login">{ta('login')}</Link>
            </Button>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Navigation mobile"
          className="border-t border-gray-200/60 bg-white/95 backdrop-blur-xl px-4 py-3 md:hidden dark:border-gray-700/60 dark:bg-gray-900/95 animate-in slide-in-from-top-2 fade-in-0 duration-200"
        >
          <ul className="flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                {allNavItems.map(({ key, href, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                          isActive
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}

                {/* Mobile user section */}
                <li className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xs font-semibold text-white shadow-sm">
                      {user ? getInitials(user.firstName, user.lastName) : '?'}
                    </span>
                    <div>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    {ta('logout')}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-sky-600 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-400"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                  {ta('login')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
