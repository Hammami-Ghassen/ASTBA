import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ──────────────────────────────────────────────
// ASTBA – Route Protection Middleware
// Fast cookie-presence check (no fetch).
// Full auth verification happens client-side via AuthProvider.
// ──────────────────────────────────────────────

/** Paths that require authentication */
const PROTECTED_PATH_PREFIXES = [
    '/dashboard',
    '/students',
    '/trainings',
    '/attendance',
    '/certificates',
    '/admin',
];

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

/**
 * The cookie name used by the Spring Boot backend for the session/token.
 * Common patterns: JSESSIONID, access_token, SESSION.
 * We check for multiple possible cookie names.
 */
const AUTH_COOKIE_NAMES = ['JSESSIONID', 'access_token', 'SESSION', 'jwt'];

function hasAuthCookie(request: NextRequest): boolean {
    return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets, API routes, and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // static files
    ) {
        return NextResponse.next();
    }

    // If visiting a protected path without auth cookie, redirect to login
    if (isProtectedPath(pathname) && !hasAuthCookie(request)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Note: We do NOT redirect /login → / when a cookie exists.
    // The cookie might be expired/invalid, causing an infinite redirect loop.
    // AuthProvider handles the authenticated-user-on-login-page redirect
    // after verifying the cookie against the backend.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (browser icon)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
