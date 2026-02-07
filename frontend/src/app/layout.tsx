import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtl, type Locale } from '@/i18n';
import { Providers } from '@/lib/providers';
import { ToastProvider } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ASTBA – Suivi des formations et présences',
    template: '%s | ASTBA',
  },
  description:
    'Application de suivi des formations, présences et certifications – Association Sciences and Technology Ben Arous, Tunisie.',
  keywords: ['ASTBA', 'formation', 'présence', 'certificat', 'Ben Arous', 'Tunisie'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const rtl = isRtl(locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-50 font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100`}
      >
        <Providers locale={locale} messages={messages}>
          <ToastProvider>
            {/* Skip link – visible on focus (WCAG) */}
            <a
              href="#main-content"
              className="fixed start-2 top-2 z-[999] -translate-y-16 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {rtl ? 'انتقل إلى المحتوى' : 'Aller au contenu'}
            </a>

            <AppShell>{children}</AppShell>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
