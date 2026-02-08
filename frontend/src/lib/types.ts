// ──────────────────────────────────────────────
// ASTBA – TypeScript domain types
// Matches the REST API contract
// ──────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    phone?: string;
    email: string;
    imageUrl?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface StudentCreateInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    imageUrl?: string;
    notes?: string;
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
    sessionId: string;
    sessionNumber: number;
    title?: string;
    plannedAt?: string;
}

export interface Level {
    levelNumber: number;
    title?: string;
    sessions: Session[];
}

export interface Training {
    id: string;
    title: string;
    description?: string;
    documentUrl?: string;
    levels: Level[];
    createdAt?: string;
    updatedAt?: string;
}

export interface TrainingCreateInput {
    title: string;
    description?: string;
    levels?: {
        levelNumber: number;
        title?: string;
        sessions: {
            sessionNumber: number;
            title?: string;
        }[];
    }[];
}

export type TrainingUpdateInput = Partial<TrainingCreateInput>;

export interface Enrollment {
    id: string;
    studentId: string;
    trainingId: string;
    groupId?: string;
    enrolledAt?: string;
    student?: Student;
    training?: Training;
    attendance?: Record<string, AttendanceEntry>;
    progressSnapshot?: ProgressSnapshot;
    createdAt?: string;
}

export interface EnrollmentCreateInput {
    studentId: string;
    trainingId: string;
    groupId?: string;
}

// ──────────────────────────────────────────────
// Group
// ──────────────────────────────────────────────
export interface Group {
    id: string;
    name: string;
    trainingId: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    studentIds: string[];
    studentCount: number;
    trainerId?: string;
    trainingTitle?: string;
    trainerName?: string;
    students?: Student[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GroupCreateInput {
    name: string;
    trainingId: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    studentIds?: string[];
    trainerId?: string;
}

export type GroupUpdateInput = Partial<Omit<GroupCreateInput, 'trainingId'>>;

export interface SessionAttendanceInfo {
    studentId: string;
    studentFirstName: string;
    studentLastName: string;
    status: AttendanceStatus | null;
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
    status: AttendanceStatus;
    markedAt?: string;
}

export interface ProgressSnapshot {
    totalSessions: number;
    attendedCount: number;
    missedCount: number;
    levelsValidated: number[];
    completed: boolean;
    completedAt?: string;
    eligibleForCertificate: boolean;
    certificateIssuedAt?: string;
}

export interface MissedSessionInfo {
    sessionId: string;
    levelNumber: number;
    sessionNumber: number;
    sessionTitle?: string;
    status?: string;
}

export interface StudentProgress {
    enrollmentId: string;
    trainingId: string;
    trainingTitle: string;
    progressSnapshot: ProgressSnapshot;
    missedSessions: MissedSessionInfo[];
}

export interface CertificateMeta {
    eligible: boolean;
    completedAt?: string;
    issuedAt?: string;
    studentName?: string;
    trainingTitle?: string;
}

// Dashboard stats
export interface DashboardStats {
    totalStudents: number;
    totalTrainings: number;
    sessionsToday: number;
    eligibleCertificates: number;
}

// ──────────────────────────────────────────────
// Seance (planned session occurrence)
// ──────────────────────────────────────────────

export type SeanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REPORTED' | 'CANCELLED';

export interface Seance {
    id: string;
    trainingId: string;
    sessionId: string;
    groupId: string;
    trainerId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: SeanceStatus;
    levelNumber: number;
    sessionNumber: number;
    title?: string;
    trainingTitle?: string;
    trainingDocumentUrl?: string;
    groupName?: string;
    trainerName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SeanceCreateInput {
    trainingId: string;
    sessionId: string;
    groupId: string;
    trainerId: string;
    date: string;
    startTime: string;
    endTime: string;
    levelNumber: number;
    sessionNumber: number;
    title?: string;
}

// ──────────────────────────────────────────────
// Session Report (postponement)
// ──────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SessionReportInput {
    reason: string;
    suggestedDate?: string;
}

export interface SessionReport {
    id: string;
    seanceId: string;
    trainerId: string;
    trainerName?: string;
    reason: string;
    suggestedDate?: string;
    reportStatus: ReportStatus;
    createdAt?: string;
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export type NotificationType =
    | 'SEANCE_ASSIGNED'
    | 'SEANCE_REPORTED'
    | 'SEANCE_REMINDER'
    | 'REPORT_APPROVED'
    | 'REPORT_REJECTED'
    | 'GENERAL';

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    link?: string;
    type: NotificationType;
    read: boolean;
    createdAt?: string;
}

// ──────────────────────────────────────────────
// Auth types
// ──────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'TRAINER';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'PENDING';

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    status: UserStatus;
    provider?: 'LOCAL' | 'GOOGLE';
    speciality?: string;
    yearsExperience?: number;
    lastLoginAt?: string;
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
    phone?: string;
    requestedRole?: 'TRAINER' | 'MANAGER';
    speciality?: string;
    yearsExperience?: number;
}
