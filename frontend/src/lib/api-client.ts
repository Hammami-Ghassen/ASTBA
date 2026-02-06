// ──────────────────────────────────────────────
// ASTBA – REST API Client
// Typed fetch wrapper for the Spring Boot backend
// ──────────────────────────────────────────────

import type {
    Student,
    StudentCreateInput,
    StudentUpdateInput,
    PaginatedResponse,
    Training,
    TrainingCreateInput,
    TrainingUpdateInput,
    Enrollment,
    EnrollmentCreateInput,
    AttendanceMarkInput,
    StudentProgress,
    CertificateMeta,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
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
        // Handle 401 – redirect to login (session expired)
        if (res.status === 401 && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/register', '/auth/callback', '/access-denied'];
            if (!publicPaths.some((p) => currentPath.startsWith(p))) {
                window.location.href = '/login?error=session_expired';
                return undefined as T;
            }
        }

        const message = await res.text().catch(() => 'Unknown error');
        throw new ApiError(res.status, message);
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json();
}

// ──────────────── Students ────────────────
export const studentsApi = {
    list(params?: { query?: string; page?: number; size?: number }) {
        const searchParams = new URLSearchParams();
        if (params?.query) searchParams.set('query', params.query);
        if (params?.page !== undefined) searchParams.set('page', String(params.page));
        if (params?.size !== undefined) searchParams.set('size', String(params.size));
        const qs = searchParams.toString();
        return request<PaginatedResponse<Student>>(`/students${qs ? `?${qs}` : ''}`);
    },

    get(id: string) {
        return request<Student>(`/students/${id}`);
    },

    create(data: StudentCreateInput) {
        return request<Student>('/students', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update(id: string, data: StudentUpdateInput) {
        return request<Student>(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(id: string) {
        return request<void>(`/students/${id}`, { method: 'DELETE' });
    },

    enrollments(studentId: string) {
        return request<Enrollment[]>(`/students/${studentId}/enrollments`);
    },

    progress(studentId: string) {
        return request<StudentProgress[]>(`/students/${studentId}/progress`);
    },
};

// ──────────────── Trainings ────────────────
export const trainingsApi = {
    list() {
        return request<Training[]>('/trainings');
    },

    get(id: string) {
        return request<Training>(`/trainings/${id}`);
    },

    create(data: TrainingCreateInput) {
        return request<Training>('/trainings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update(id: string, data: TrainingUpdateInput) {
        return request<Training>(`/trainings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(id: string) {
        return request<void>(`/trainings/${id}`, { method: 'DELETE' });
    },

    enrollments(trainingId: string) {
        return request<Enrollment[]>(`/trainings/${trainingId}/enrollments`);
    },
};

// ──────────────── Enrollments ────────────────
export const enrollmentsApi = {
    create(data: EnrollmentCreateInput) {
        return request<Enrollment>('/enrollments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    get(id: string) {
        return request<Enrollment>(`/enrollments/${id}`);
    },

    progress(enrollmentId: string) {
        return request<StudentProgress>(`/enrollments/${enrollmentId}/progress`);
    },
};

// ──────────────── Attendance ────────────────
export const attendanceApi = {
    mark(data: AttendanceMarkInput) {
        return request<void>('/attendance/mark', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ──────────────── Certificates ────────────────
export const certificatesApi = {
    getMeta(enrollmentId: string) {
        return request<CertificateMeta>(`/enrollments/${enrollmentId}/certificate/meta`);
    },

    downloadUrl(enrollmentId: string) {
        return `${BASE_URL}/enrollments/${enrollmentId}/certificate`;
    },
};

export { ApiError };
