'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/providers';
import { locales, type Locale } from '@/i18n-config';
import { Shield } from 'lucide-react';

const localeLabels: Record<Locale, string> = {
  'fr': 'Français',
  'ar-TN': 'العربية',
};

/**
 * Shared split-screen layout for login / register pages.
 * Left: branding panel (hidden on mobile).  Right: form content.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#101622] p-4 lg:p-8">
      <div className="flex w-full max-w-[1400px] overflow-hidden rounded-2xl border border-[#324467] bg-[#192233]/60 shadow-2xl backdrop-blur-sm lg:min-h-[85vh] lg:flex-row flex-col">
      {/* ── Left Column: Branding ── */}
      <div className="relative hidden w-full lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between overflow-hidden rounded-s-2xl bg-[#192233] p-12">
        {/* Decorative bg */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDy20oFFnspyEscwFTA487EJUY-x0tL-hj6hK-uZZR5ufD-TpYUXPE3a7dFKFyky_FZ0GMNQ6Sg9uqP0-ZiJ8Zi12XJLSU6T-UDk7EMwYfwRcw4K05LVycPSNrLbT6F8PnxkHhuFYwJ-TDKbGLfei5kSGgogJmmBKPltMUrqE7xEIHgV2qD6ul_7wy7_JS2xz4wfs3S1mNjlrUJPPijZLNJrIQUlDhiMt9DZu_UcN1YuQObK5KD0zWuD59fm0VMBdtKP4RT4CSmQdc')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#101622] via-[#101622]/80 to-transparent" />

        {/* Logo */}
        <div className="relative z-20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#135bec] text-white">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">ASTBA</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-20 flex flex-col gap-4">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            {t('brandTagline')}
          </h1>
          <p className="max-w-md text-lg text-[#92a4c9]">
            {t('brandSubtitle')}
          </p>
          {/* Compliance badge */}
          <div className="mt-8 flex items-center gap-2 rounded-full border border-[#324467] bg-[#101622]/50 px-4 py-2 w-fit backdrop-blur-sm">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#92a4c9]">
              {t('complianceBadge')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-20 text-xs text-[#92a4c9]">
          © 2026 ASTBA Inc. All rights reserved.
        </div>
      </div>

      {/* ── Right Column: Form ── */}
      <main className="flex w-full flex-1 flex-col bg-[#101622] transition-all duration-300 lg:w-7/12 xl:w-1/2">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#135bec] text-white">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-white">ASTBA</span>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
          <div className="mx-auto w-full max-w-[640px] px-6 py-8 lg:px-12 lg:py-12">
            {/* Language selector */}
            <div aria-label="Language selection" className="mb-8 flex flex-wrap items-center justify-end gap-3" role="group">
              {locales.map((l) => (
                <label
                  key={l}
                  className={`group relative flex h-9 cursor-pointer items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors
                    ${locale === l
                      ? 'border-[#135bec] bg-[#135bec]/10 text-white'
                      : 'border-[#324467] text-[#92a4c9] hover:bg-[#192233]'
                    }`}
                >
                  <span className={l === 'ar-TN' ? 'font-sans' : ''}>
                    {localeLabels[l]}
                  </span>
                  <input
                    type="radio"
                    name="lang"
                    className="sr-only"
                    checked={locale === l}
                    onChange={() => setLocale(l)}
                  />
                </label>
              ))}
            </div>

            {children}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
