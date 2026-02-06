import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ──────────────────────────────────────────────
// ASTBA – Route Protection Middleware
// Fast cookie-presence check (no fetch).
// Full auth verification happens client-side via AuthProvider.
// ──────────────────────────────────────────────

/** Public paths that don't require authentication */
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/access-denied'];

/** Paths that require authentication */
const PROTECTED_PATH_PREFIXES = [
    '/students',
    '/trainings',
    '/attendance',
    '/certificates',
    '/admin',
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

function isProtectedPath(pathname: string): boolean {
    // Root dashboard is protected
    if (pathname === '/') return true;
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

    // If visiting login/register while having auth cookie, redirect to dashboard
    if (
        (pathname === '/login' || pathname === '/register') &&
        hasAuthCookie(request)
    ) {
        return NextResponse.redirect(new URL('/', request.url));
    }

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
