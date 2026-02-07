export const locales = ['fr', 'ar-TN'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar-TN';

export const rtlLocales: Locale[] = ['ar-TN'];

export function isRtl(locale: Locale): boolean {
    return rtlLocales.includes(locale);
}
