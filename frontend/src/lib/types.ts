// ──────────────────────────────────────────────
// ASTBA – TypeScript domain types
// Matches the REST API contract
// ──────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface StudentCreateInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
}

export type StudentUpdateInput = Partial<StudentCreateInput>;

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // current page (0-based)
    size: number;
}

export interface Session {
    id: string;
    number: number; // 1-6
    title?: string;
    date?: string;
}

export interface Level {
    id: string;
    number: number; // 1-4
    title?: string;
    sessions: Session[];
}

export interface Training {
    id: string;
    name: string;
    description?: string;
    levels: Level[];
    createdAt?: string;
    updatedAt?: string;
}

export interface TrainingCreateInput {
    name: string;
    description?: string;
}

export type TrainingUpdateInput = Partial<TrainingCreateInput>;

export interface Enrollment {
    id: string;
    studentId: string;
    trainingId: string;
    student?: Student;
    training?: Training;
    enrolledAt?: string;
}

export interface EnrollmentCreateInput {
    studentId: string;
    trainingId: string;
}

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
}

export interface AttendanceMarkInput {
    trainingId: string;
    sessionId: string;
    date: string;
    records: AttendanceRecord[];
}

export interface AttendanceEntry {
    id: string;
    studentId: string;
    trainingId: string;
    sessionId: string;
    levelNumber: number;
    sessionNumber: number;
    status: AttendanceStatus;
    date: string;
}

export interface SessionProgress {
    sessionId: string;
    sessionNumber: number;
    attended: boolean;
}

export interface LevelProgress {
    levelNumber: number;
    validated: boolean;
    sessionsCompleted: number;
    totalSessions: number;
    sessions: SessionProgress[];
}

export interface StudentProgress {
    studentId: string;
    enrollmentId: string;
    trainingId: string;
    trainingName: string;
    levelsValidated: number;
    totalLevels: number;
    sessionsCompleted: number;
    totalSessions: number;
    completed: boolean;
    levels: LevelProgress[];
}

export interface CertificateMeta {
    enrollmentId: string;
    eligible: boolean;
    issuedAt?: string;
    studentName?: string;
    trainingName?: string;
}

// Dashboard stats
export interface DashboardStats {
    totalStudents: number;
    totalTrainings: number;
    sessionsToday: number;
    eligibleCertificates: number;
}

// ──────────────────────────────────────────────
// Auth types
// ──────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'TRAINER';

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    enabled: boolean;
    provider?: 'LOCAL' | 'GOOGLE';
    avatarUrl?: string;
    createdAt?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    requestedRole?: 'TRAINER' | 'MANAGER';
}
