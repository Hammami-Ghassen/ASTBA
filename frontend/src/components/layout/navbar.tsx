'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { useAuth, isAdmin } from '@/lib/auth-provider';
import {
  LayoutDashboard,
  GraduationCap,
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
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-700 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-400"
          aria-label="ASTBA - Accueil"
        >
          <GraduationCap className="h-7 w-7" aria-hidden="true" />
          <span>ASTBA</span>
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
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* User menu (desktop) */}
          {isAuthenticated && user && (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                ref={userButtonRef}
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={ta('userMenu')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                  {getInitials(user.firstName, user.lastName)}
                </span>
                <span className="max-w-[120px] truncate">{user.firstName}</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label={ta('userMenu')}
                  className="absolute end-0 mt-2 w-56 origin-top-end rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* User info */}
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {user.roles.join(', ')}
                    </p>
                  </div>

                  {isAdmin(user) && (
                    <Link
                      href="/admin/users"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Shield className="h-4 w-4" aria-hidden="true" />
                      {t('admin')}
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-950"
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
          className="border-t border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-700 dark:bg-gray-900"
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
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                      {user ? getInitials(user.firstName, user.lastName) : '?'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-950"
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
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sky-600 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-400"
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
