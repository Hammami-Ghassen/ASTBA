// ──────────────────────────────────────────────
// ASTBA – Auth API Client
// Handles authentication endpoints with HttpOnly cookie strategy
// All requests use credentials: "include" for cookie transport
// ──────────────────────────────────────────────

import type { AuthUser, LoginInput, RegisterInput } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export class AuthApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public fieldErrors?: Record<string, string>,
    ) {
        super(message);
        this.name = 'AuthApiError';
    }
}

/** Authenticated fetch – always sends cookies */
async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!res.ok) {
        let message = 'Unknown error';
        let fieldErrors: Record<string, string> | undefined;

        try {
            const body = await res.json();
            message = body.message || body.error || JSON.stringify(body);
            if (body.errors && typeof body.errors === 'object') {
                fieldErrors = body.errors;
            }
        } catch {
            message = await res.text().catch(() => `HTTP ${res.status}`);
        }

        throw new AuthApiError(res.status, message, fieldErrors);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

// ──────────────── Auth Endpoints ────────────────

export const authApi = {
    /** POST /api/auth/login – Email/password login */
    login(data: LoginInput) {
        return authFetch<AuthUser>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /** POST /api/auth/register – Register new account */
    register(data: RegisterInput) {
        return authFetch<{ message: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /** GET /api/auth/me – Get current authenticated user */
    me() {
        return authFetch<AuthUser>('/auth/me');
    },

    /** POST /api/auth/logout – Invalidate session */
    logout() {
        return authFetch<void>('/auth/logout', { method: 'POST' });
    },

    /** POST /api/auth/refresh – Refresh access token (if supported) */
    refresh() {
        return authFetch<void>('/auth/refresh', { method: 'POST' });
    },

    /** Google OAuth2 redirect URL (handled by backend) */
    googleAuthUrl() {
        // Strip /api suffix for OAuth2 authorization endpoint
        const backendBase = BASE_URL.replace(/\/api\/?$/, '');
        return `${backendBase}/oauth2/authorization/google`;
    },
};

// ──────────────── Admin Endpoints ────────────────

export interface AdminUserListParams {
    query?: string;
    page?: number;
    size?: number;
}

export const adminApi = {
    /** GET /api/admin/users – List all users (ADMIN only) */
    listUsers(params?: AdminUserListParams) {
        const searchParams = new URLSearchParams();
        if (params?.query) searchParams.set('query', params.query);
        if (params?.page !== undefined) searchParams.set('page', String(params.page));
        if (params?.size !== undefined) searchParams.set('size', String(params.size));
        const qs = searchParams.toString();
        return authFetch<import('./types').PaginatedResponse<AuthUser>>(
            `/admin/users${qs ? `?${qs}` : ''}`,
        );
    },

    /** PUT /api/admin/users/:id/role – Change user role */
    changeRole(userId: string, role: import('./types').UserRole) {
        return authFetch<AuthUser>(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    },

    /** PUT /api/admin/users/:id/status – Enable/disable user */
    changeStatus(userId: string, enabled: boolean) {
        return authFetch<AuthUser>(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ enabled }),
        });
    },
};
