import { z } from 'zod';

// ──────────────────────────────────────────────
// Student schemas
// ──────────────────────────────────────────────
export const studentCreateSchema = z.object({
    firstName: z.string().min(1, 'validation.required').max(100),
    lastName: z.string().min(1, 'validation.required').max(100),
    email: z.string().min(1, 'validation.required').email('validation.invalidEmail'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export type StudentCreateFormData = z.infer<typeof studentCreateSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;

// ──────────────────────────────────────────────
// Training schemas
// ──────────────────────────────────────────────
export const trainingCreateSchema = z.object({
    name: z.string().min(1, 'validation.required').max(200),
    description: z.string().optional(),
});

export const trainingUpdateSchema = trainingCreateSchema.partial();

export type TrainingCreateFormData = z.infer<typeof trainingCreateSchema>;
export type TrainingUpdateFormData = z.infer<typeof trainingUpdateSchema>;

// ──────────────────────────────────────────────
// Enrollment schema
// ──────────────────────────────────────────────
export const enrollmentCreateSchema = z.object({
    studentId: z.string().min(1, 'validation.required'),
    trainingId: z.string().min(1, 'validation.required'),
});

export type EnrollmentCreateFormData = z.infer<typeof enrollmentCreateSchema>;

// ──────────────────────────────────────────────
// Attendance schema
// ──────────────────────────────────────────────
export const attendanceRecordSchema = z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
});

export const attendanceMarkSchema = z.object({
    trainingId: z.string().min(1),
    sessionId: z.string().min(1),
    date: z.string().min(1),
    records: z.array(attendanceRecordSchema).min(1),
});

export type AttendanceMarkFormData = z.infer<typeof attendanceMarkSchema>;

// ──────────────────────────────────────────────
// Auth schemas
// ──────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().min(1, 'validation.required').email('validation.invalidEmail'),
    password: z.string().min(1, 'validation.required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    firstName: z.string().min(1, 'validation.required').max(100),
    lastName: z.string().min(1, 'validation.required').max(100),
    email: z.string().min(1, 'validation.required').email('validation.invalidEmail'),
    password: z
        .string()
        .min(1, 'validation.required')
        .min(8, 'validation.passwordMin'),
    requestedRole: z.enum(['TRAINER', 'MANAGER']).optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
