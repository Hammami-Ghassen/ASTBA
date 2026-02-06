'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi, trainingsApi, enrollmentsApi, attendanceApi, certificatesApi } from './api-client';
import type {
    StudentCreateInput,
    StudentUpdateInput,
    TrainingCreateInput,
    TrainingUpdateInput,
    EnrollmentCreateInput,
    AttendanceMarkInput,
} from './types';

// ──────────────── Query Keys ────────────────
export const queryKeys = {
    students: {
        all: ['students'] as const,
        list: (params?: { query?: string; page?: number; size?: number }) => ['students', 'list', params] as const,
        detail: (id: string) => ['students', 'detail', id] as const,
        enrollments: (id: string) => ['students', 'enrollments', id] as const,
        progress: (id: string) => ['students', 'progress', id] as const,
    },
    trainings: {
        all: ['trainings'] as const,
        list: () => ['trainings', 'list'] as const,
        detail: (id: string) => ['trainings', 'detail', id] as const,
        enrollments: (id: string) => ['trainings', 'enrollments', id] as const,
    },
    enrollments: {
        detail: (id: string) => ['enrollments', 'detail', id] as const,
        progress: (id: string) => ['enrollments', 'progress', id] as const,
    },
    certificates: {
        meta: (enrollmentId: string) => ['certificates', 'meta', enrollmentId] as const,
    },
};

// ──────────────── Student Hooks ────────────────
export function useStudents(params?: { query?: string; page?: number; size?: number }) {
    return useQuery({
        queryKey: queryKeys.students.list(params),
        queryFn: () => studentsApi.list(params),
    });
}

export function useStudent(id: string) {
    return useQuery({
        queryKey: queryKeys.students.detail(id),
        queryFn: () => studentsApi.get(id),
        enabled: !!id,
    });
}

export function useStudentEnrollments(studentId: string) {
    return useQuery({
        queryKey: queryKeys.students.enrollments(studentId),
        queryFn: () => studentsApi.enrollments(studentId),
        enabled: !!studentId,
    });
}

export function useStudentProgress(studentId: string) {
    return useQuery({
        queryKey: queryKeys.students.progress(studentId),
        queryFn: () => studentsApi.progress(studentId),
        enabled: !!studentId,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: StudentCreateInput) => studentsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        },
    });
}

export function useUpdateStudent(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: StudentUpdateInput) => studentsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
        },
    });
}

export function useDeleteStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => studentsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        },
    });
}

// ──────────────── Training Hooks ────────────────
export function useTrainings() {
    return useQuery({
        queryKey: queryKeys.trainings.list(),
        queryFn: () => trainingsApi.list(),
    });
}

export function useTraining(id: string) {
    return useQuery({
        queryKey: queryKeys.trainings.detail(id),
        queryFn: () => trainingsApi.get(id),
        enabled: !!id,
    });
}

export function useTrainingEnrollments(trainingId: string) {
    return useQuery({
        queryKey: queryKeys.trainings.enrollments(trainingId),
        queryFn: () => trainingsApi.enrollments(trainingId),
        enabled: !!trainingId,
    });
}

export function useCreateTraining() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TrainingCreateInput) => trainingsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
        },
    });
}

export function useUpdateTraining(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TrainingUpdateInput) => trainingsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.detail(id) });
        },
    });
}

export function useDeleteTraining() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => trainingsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
        },
    });
}

// ──────────────── Enrollment Hooks ────────────────
export function useCreateEnrollment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: EnrollmentCreateInput) => enrollmentsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
        },
    });
}

export function useEnrollmentProgress(enrollmentId: string) {
    return useQuery({
        queryKey: queryKeys.enrollments.progress(enrollmentId),
        queryFn: () => enrollmentsApi.progress(enrollmentId),
        enabled: !!enrollmentId,
    });
}

// ──────────────── Attendance Hooks ────────────────
export function useMarkAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AttendanceMarkInput) => attendanceApi.mark(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
        },
    });
}

// ──────────────── Certificate Hooks ────────────────
export function useCertificateMeta(enrollmentId: string) {
    return useQuery({
        queryKey: queryKeys.certificates.meta(enrollmentId),
        queryFn: () => certificatesApi.getMeta(enrollmentId),
        enabled: !!enrollmentId,
    });
}
