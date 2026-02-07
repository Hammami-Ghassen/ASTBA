import { z } from 'zod';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const PHONE_REGEX = /^\d{8}$/;
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// ──────────────────────────────────────────────
// Student schemas
// ──────────────────────────────────────────────
export const studentCreateSchema = z.object({
    firstName: z.string()
        .min(1, 'validation.required')
        .max(100)
        .regex(NAME_REGEX, 'validation.invalidName'),
    lastName: z.string()
        .min(1, 'validation.required')
        .max(100)
        .regex(NAME_REGEX, 'validation.invalidName'),
    email: z.string().min(1, 'validation.required').email('validation.invalidEmail'),
    phone: z.string()
        .min(1, 'validation.required')
        .regex(PHONE_REGEX, 'validation.invalidPhone'),
    birthDate: z.string()
        .min(1, 'validation.required')
        .refine((val) => !isNaN(Date.parse(val)), { message: 'validation.invalidDate' })
        .refine((val) => calculateAge(val) >= 10, { message: 'validation.ageTooYoung' })
        .refine((val) => calculateAge(val) <= 29, { message: 'validation.ageTooOld' }),
    imageUrl: z.string().optional().or(z.literal('')),
    notes: z.string().max(500).optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export type StudentCreateFormData = z.infer<typeof studentCreateSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;

// ──────────────────────────────────────────────
// Training schemas
// ──────────────────────────────────────────────
export const trainingCreateSchema = z.object({
    title: z.string().min(1, 'validation.required').max(200),
    description: z.string().optional(),
    documentUrl: z.string().max(500).optional().or(z.literal('')),
    levels: z.array(z.object({
        levelNumber: z.number(),
        title: z.string(),
        sessions: z.array(z.object({
            sessionNumber: z.number(),
            title: z.string(),
        })),
    })).optional(),
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
// Group schemas
// ──────────────────────────────────────────────
export const groupCreateSchema = z.object({
    name: z.string().min(1, 'validation.required').max(100),
    trainingId: z.string().min(1, 'validation.required'),
    dayOfWeek: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    studentIds: z.array(z.string()).optional(),
});

export const groupUpdateSchema = groupCreateSchema.omit({ trainingId: true }).partial();

export type GroupCreateFormData = z.infer<typeof groupCreateSchema>;
export type GroupUpdateFormData = z.infer<typeof groupUpdateSchema>;

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
    phone: z.string()
        .min(1, 'validation.required')
        .regex(PHONE_REGEX, 'validation.invalidPhone'),
    password: z
        .string()
        .min(1, 'validation.required')
        .min(8, 'validation.passwordMin'),
    requestedRole: z.enum(['TRAINER', 'MANAGER']).optional(),
    speciality: z.string().optional(),
    yearsExperience: z.number().int().min(0).max(50).optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
