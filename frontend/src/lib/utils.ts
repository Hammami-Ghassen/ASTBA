import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format a date string to locale display */
export function formatDate(date: string | undefined, locale: string = 'fr'): string {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleDateString(locale === 'ar-TN' ? 'ar-TN' : 'fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return date;
    }
}

/** Get today's date as ISO string (YYYY-MM-DD) */
export function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

/** Calculate progress percentage */
export function progressPercent(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

/** Generate initials from first + last name */
export function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
