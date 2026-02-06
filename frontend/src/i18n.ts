import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['fr', 'ar-TN'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar-TN';

export const rtlLocales: Locale[] = ['ar-TN'];

export function isRtl(locale: Locale): boolean {
    return rtlLocales.includes(locale);
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
