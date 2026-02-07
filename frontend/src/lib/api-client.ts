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
    Group,
    GroupCreateInput,
    GroupUpdateInput,
    SessionAttendanceInfo,
    Seance,
    SeanceCreateInput,
    SessionReport,
    SessionReportInput,
    AppNotification,
    AuthUser,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public fieldErrors?: Record<string, string>,
    ) {
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
        let message = 'Unknown error';
        let fieldErrors: Record<string, string> | undefined;

        try {
            const body = await res.json();
            message = body.message || body.error || JSON.stringify(body);
            if (body.fieldErrors && typeof body.fieldErrors === 'object') {
                fieldErrors = body.fieldErrors;
            }
        } catch {
            message = await res.text().catch(() => `HTTP ${res.status}`);
        }

        throw new ApiError(res.status, message, fieldErrors);
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

    reassignGroup(enrollmentId: string, newGroupId: string) {
        return request<Enrollment>(`/enrollments/${enrollmentId}/group/${newGroupId}`, {
            method: 'PUT',
        });
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

    getSession(sessionId: string, trainingId: string) {
        return request<SessionAttendanceInfo[]>(`/attendance/session/${sessionId}?trainingId=${trainingId}`);
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

// ──────────────── Uploads ────────────────
export const uploadsApi = {
    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const url = `${BASE_URL}/uploads/image`;
        return fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const message = await res.text().catch(() => 'Upload failed');
                throw new ApiError(res.status, message);
            }
            return res.json() as Promise<{ filename: string; imageUrl: string }>;
        });
    },

    uploadDocument(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const url = `${BASE_URL}/uploads/document`;
        return fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const message = await res.text().catch(() => 'Upload failed');
                throw new ApiError(res.status, message);
            }
            return res.json() as Promise<{ filename: string; documentUrl: string }>;
        });
    },
};

// ──────────────── Groups ────────────────
export const groupsApi = {
    list(trainingId?: string) {
        const qs = trainingId ? `?trainingId=${trainingId}` : '';
        return request<Group[]>(`/groups${qs}`);
    },

    get(id: string) {
        return request<Group>(`/groups/${id}`);
    },

    create(data: GroupCreateInput) {
        return request<Group>('/groups', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update(id: string, data: GroupUpdateInput) {
        return request<Group>(`/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    addStudent(groupId: string, studentId: string) {
        return request<Group>(`/groups/${groupId}/students/${studentId}`, {
            method: 'POST',
        });
    },

    removeStudent(groupId: string, studentId: string) {
        return request<Group>(`/groups/${groupId}/students/${studentId}`, {
            method: 'DELETE',
        });
    },

    delete(id: string) {
        return request<void>(`/groups/${id}`, { method: 'DELETE' });
    },
};

// ── Seances (Planning) ──────────────────────────────────────────────

export const seancesApi = {
    list(params?: { trainerId?: string; groupId?: string; trainingId?: string; from?: string; to?: string; date?: string }) {
        const qs = params ? '?' + new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
        ).toString() : '';
        return request<Seance[]>(`/seances${qs}`);
    },

    get(id: string) {
        return request<Seance>(`/seances/${id}`);
    },

    mySeances(from?: string, to?: string) {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        return request<Seance[]>(`/seances/my${qs}`);
    },

    create(data: SeanceCreateInput) {
        return request<Seance>('/seances', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update(id: string, data: Partial<SeanceCreateInput>) {
        return request<Seance>(`/seances/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    updateStatus(id: string, status: string) {
        return request<Seance>(`/seances/${id}/status?status=${status}`, {
            method: 'PATCH',
        });
    },

    delete(id: string) {
        return request<void>(`/seances/${id}`, { method: 'DELETE' });
    },

    report(id: string, data: SessionReportInput) {
        return request<SessionReport>(`/seances/${id}/report`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getReports(id: string) {
        return request<SessionReport[]>(`/seances/${id}/reports`);
    },

    checkAvailability(trainerId: string, date: string, startTime: string, endTime: string) {
        return request<boolean>(
            `/seances/availability?trainerId=${trainerId}&date=${date}&startTime=${startTime}&endTime=${endTime}`
        );
    },
};

// ── Notifications ───────────────────────────────────────────────────

export const notificationsApi = {
    list() {
        return request<AppNotification[]>('/notifications');
    },

    unread() {
        return request<AppNotification[]>('/notifications/unread');
    },

    async unreadCount() {
        const data = await request<{ count: number }>('/notifications/unread/count');
        return data.count;
    },

    markRead(id: string) {
        return request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
    },

    markAllRead() {
        return request<void>('/notifications/read-all', { method: 'POST' });
    },
};

// ── Trainers ────────────────────────────────────────────────────────

export const trainersApi = {
    list() {
        return request<AuthUser[]>('/auth/trainers');
    },
};
