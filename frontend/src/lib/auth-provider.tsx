'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, AuthApiError } from './auth-api';
import type { AuthUser, UserRole } from './types';

// ──────────────────────────────────────────────
// Auth Context
// ──────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ──────────────────────────────────────────────
// RBAC Helpers
// ──────────────────────────────────────────────

export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'ADMIN');
}

export function isManager(user: AuthUser | null): boolean {
  return hasRole(user, 'MANAGER');
}

export function isTrainer(user: AuthUser | null): boolean {
  return hasRole(user, 'TRAINER');
}

/** Can the user create/edit/delete trainings? */
export function canManageTrainings(user: AuthUser | null): boolean {
  return isAdmin(user) || isManager(user);
}

/** Can the user mark attendance? */
export function canMarkAttendance(user: AuthUser | null): boolean {
  return isAdmin(user) || isManager(user) || isTrainer(user);
}

/** Can the user manage students (create/edit/delete)? */
export function canManageStudents(user: AuthUser | null): boolean {
  return isAdmin(user) || isManager(user);
}

/** Can the user generate certificates? */
export function canGenerateCertificates(user: AuthUser | null): boolean {
  return isAdmin(user) || isManager(user);
}

/** Can the user access admin panel? */
export function canAccessAdmin(user: AuthUser | null): boolean {
  return isAdmin(user);
}

// ──────────────────────────────────────────────
// Public routes (no auth required)
// ──────────────────────────────────────────────
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/access-denied'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// ──────────────────────────────────────────────
// Auth Provider Component
// ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current user on mount
  const fetchUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setError(null);
    } catch (err) {
      setUser(null);
      if (err instanceof AuthApiError && err.status === 401) {
        // Not authenticated – only redirect if on a protected path
        if (!isPublicPath(pathname)) {
          router.replace('/login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const me = await authApi.login({ email, password });
      setUser(me);
      router.replace('/');
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    router.replace('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setError(null);
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      error,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, error, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
