import type { Metadata } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtl, type Locale } from '@/i18n';
import { Providers } from '@/lib/providers';
import { ToastProvider } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/app-shell';
import { themeScript } from '@/components/layout/theme-toggle';
import './globals.css';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['latin', 'arabic'],
  weight: ['700'],
  display: 'swap',
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${cairo.variable} ${geistMono.variable} min-h-screen bg-gray-50 font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100`}
      >
        <Providers locale={locale} messages={messages}>
          <ToastProvider>
            {/* Skip link – visible on focus (WCAG) */}
            <a
              href="#main-content"
              className="fixed start-2 top-2 z-[999] -translate-y-16 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
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
