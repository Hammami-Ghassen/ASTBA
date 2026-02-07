'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-provider';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  ArrowRight,
  Shield,
  BarChart3,
  Zap,
  Globe,
  CheckCircle2,
  ChevronRight,
  Star,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations('landing');
  const ta = useTranslations('auth');
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#101622] text-white overflow-x-hidden">
      {/* ─── NAVIGATION ─── */}
      <nav className="nav-cursor fixed top-0 z-50 w-full border-b border-white/5 bg-[#101622]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#135bec] to-blue-400 shadow-lg shadow-[#135bec]/25 transition-shadow group-hover:shadow-[#135bec]/40">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ASTBA</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[#92a4c9] transition-colors hover:text-white">
              {t('navFeatures')}
            </a>
            <a href="#how-it-works" className="text-sm text-[#92a4c9] transition-colors hover:text-white">
              {t('navHowItWorks')}
            </a>
            <a href="#stats" className="text-sm text-[#92a4c9] transition-colors hover:text-white">
              {t('navStats')}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {!isLoading && (
              isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[#135bec] px-4 py-2 text-sm font-semibold shadow-lg shadow-[#135bec]/25 transition-all hover:bg-blue-500 hover:shadow-[#135bec]/40"
                >
                  {t('goToDashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#92a4c9] transition-colors hover:text-white sm:inline-flex"
                  >
                    {ta('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#135bec] px-4 py-2 text-sm font-semibold shadow-lg shadow-[#135bec]/25 transition-all hover:bg-blue-500 hover:shadow-[#135bec]/40"
                  >
                    {t('getStarted')}
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-[#135bec]/20 blur-[120px]" />
          <div className="absolute top-20 end-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
          <div className="absolute bottom-0 start-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#135bec]/30 bg-[#135bec]/10 px-4 py-1.5 text-sm text-[#135bec]">
              <Sparkles className="h-4 w-4" />
              {t('heroBadge')}
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block">{t('heroTitle1')}</span>
              <span className="mt-2 block bg-gradient-to-r from-[#135bec] via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#92a4c9] sm:text-xl">
              {t('heroDescription')}
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={isAuthenticated ? '/dashboard' : '/register'}
                className="group flex items-center gap-2 rounded-xl bg-[#135bec] px-8 py-3.5 text-sm font-bold shadow-2xl shadow-[#135bec]/30 transition-all hover:bg-blue-500 hover:shadow-[#135bec]/50 hover:scale-[1.02]"
              >
                {t('heroCtaPrimary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-[#324467] px-8 py-3.5 text-sm font-semibold text-[#92a4c9] transition-all hover:border-[#92a4c9]/50 hover:text-white"
              >
                {t('heroCtaSecondary')}
              </a>
            </div>
          </div>

          {/* Hero visual — Dashboard preview mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-[#324467]/50 bg-gradient-to-b from-[#192233] to-[#101622] p-1 shadow-2xl shadow-black/50">
              <div className="rounded-xl bg-[#192233] p-6">
                {/* Mini browser chrome */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <div className="ms-3 flex-1 rounded-md bg-[#101622] px-4 py-1.5 text-xs text-[#92a4c9]">
                    astba.tn/dashboard
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: t('mockStudents'), value: '150', color: 'from-sky-500 to-blue-600' },
                    { label: t('mockTrainings'), value: '8', color: 'from-emerald-500 to-green-600' },
                    { label: t('mockSessions'), value: '24', color: 'from-amber-500 to-orange-600' },
                    { label: t('mockCertificates'), value: '65', color: 'from-purple-500 to-pink-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-[#101622] p-4">
                      <p className="text-xs text-[#92a4c9]">{stat.label}</p>
                      <p className={`mt-1 text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-[#101622] animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            {/* Glow under mockup */}
            <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-[#135bec]/20 blur-3xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY / STATS ─── */}
      <section id="stats" className="relative border-y border-white/5 bg-[#0c1320] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '150+', label: t('statStudents') },
              { value: '7+', label: t('statYears') },
              { value: '6', label: t('statTeam') },
              { value: '2018', label: t('statFounded') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold bg-gradient-to-r from-white to-[#92a4c9] bg-clip-text text-transparent sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#92a4c9]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Zap className="h-4 w-4" />
              {t('featuresBadge')}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t('featuresTitle')}
            </h2>
            <p className="mt-4 text-lg text-[#92a4c9]">
              {t('featuresDescription')}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: t('featureStudents'),
                description: t('featureStudentsDesc'),
                color: 'from-sky-500 to-blue-600',
                bg: 'bg-sky-500/10',
                border: 'border-sky-500/20',
              },
              {
                icon: BookOpen,
                title: t('featureTrainings'),
                description: t('featureTrainingsDesc'),
                color: 'from-emerald-500 to-green-600',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
              {
                icon: ClipboardCheck,
                title: t('featureAttendance'),
                description: t('featureAttendanceDesc'),
                color: 'from-amber-500 to-orange-600',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
              },
              {
                icon: Award,
                title: t('featureCertificates'),
                description: t('featureCertificatesDesc'),
                color: 'from-purple-500 to-pink-600',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
              },
              {
                icon: BarChart3,
                title: t('featureAnalytics'),
                description: t('featureAnalyticsDesc'),
                color: 'from-cyan-500 to-teal-600',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/20',
              },
              {
                icon: Shield,
                title: t('featureSecurity'),
                description: t('featureSecurityDesc'),
                color: 'from-rose-500 to-red-600',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20',
              },
            ].map(({ icon: Icon, title, description, color, bg, border }) => (
              <div
                key={title}
                className={`group relative rounded-2xl border ${border} ${bg} p-6 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-[#92a4c9]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative border-y border-white/5 bg-[#0c1320] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t('howItWorksTitle')}
            </h2>
            <p className="mt-4 text-lg text-[#92a4c9]">
              {t('howItWorksDescription')}
            </p>
          </div>

          <div className="relative mt-16">
            {/* Connector line */}
            <div className="absolute top-8 start-0 end-0 hidden h-0.5 bg-gradient-to-r from-transparent via-[#324467] to-transparent lg:block" aria-hidden="true" />

            <div className="grid gap-8 lg:grid-cols-4">
              {[
                { step: '01', title: t('step1Title'), desc: t('step1Desc'), icon: Users },
                { step: '02', title: t('step2Title'), desc: t('step2Desc'), icon: BookOpen },
                { step: '03', title: t('step3Title'), desc: t('step3Desc'), icon: ClipboardCheck },
                { step: '04', title: t('step4Title'), desc: t('step4Desc'), icon: Award },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#324467] bg-[#192233] shadow-xl">
                    <Icon className="h-7 w-7 text-[#135bec]" />
                    <span className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#135bec] text-xs font-bold">
                      {step}
                    </span>
                  </div>
                  <h3 className="mb-2 font-bold">{title}</h3>
                  <p className="text-sm text-[#92a4c9]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HIGHLIGHTS ─── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400">
                <Star className="h-4 w-4" />
                {t('highlightsBadge')}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t('highlightsTitle')}
              </h2>
              <p className="mt-4 text-lg text-[#92a4c9]">
                {t('highlightsDescription')}
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  t('highlight1'),
                  t('highlight2'),
                  t('highlight3'),
                  t('highlight4'),
                  t('highlight5'),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-[#92a4c9]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature card visual */}
            <div className="relative">
              <div className="rounded-2xl border border-[#324467]/50 bg-[#192233] p-8 shadow-2xl">
                <div className="space-y-4">
                  {[
                    { label: t('highlightProgress'), pct: 92, color: 'bg-[#135bec]' },
                    { label: t('highlightAttRate'), pct: 95, color: 'bg-emerald-500' },
                    { label: t('highlightCertRate'), pct: 78, color: 'bg-purple-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-[#92a4c9]">{label}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#101622]">
                        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { icon: Globe, label: t('highlightMultilang') },
                    { icon: Shield, label: t('highlightRBAC') },
                    { icon: Zap, label: t('highlightRealtime') },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-xl border border-[#324467] bg-[#101622] p-3 text-center">
                      <Icon className="mx-auto h-5 w-5 text-[#135bec]" />
                      <p className="mt-1 text-xs text-[#92a4c9]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-4 left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-full bg-[#135bec]/15 blur-2xl" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative border-t border-white/5 bg-[#0c1320] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 start-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#135bec]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#92a4c9]">
            {t('ctaDescription')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="group flex items-center gap-2 rounded-xl bg-[#135bec] px-8 py-4 text-sm font-bold shadow-2xl shadow-[#135bec]/30 transition-all hover:bg-blue-500 hover:shadow-[#135bec]/50 hover:scale-[1.02]"
            >
              {t('ctaButton')}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-[#101622] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#135bec] to-blue-400">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">ASTBA</span>
              </div>
              <p className="text-xs text-[#92a4c9]/70">{t('footerSince')}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-sm text-[#92a4c9]">
                © 2026 ASTBA – Association Sciences and Technology Ben Arous
              </p>
              <p className="text-xs text-[#92a4c9]/60">
                {t('footerAddress')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#features" className="text-sm text-[#92a4c9] hover:text-white transition-colors">{t('navFeatures')}</a>
              <a href="#how-it-works" className="text-sm text-[#92a4c9] hover:text-white transition-colors">{t('navHowItWorks')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
