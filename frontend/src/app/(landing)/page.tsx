'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-provider';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
  Menu,
  X,
  Cpu,
  Heart,
  Languages,
  Monitor,
} from 'lucide-react';

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const num = parseInt(target.replace(/\D/g, ''));
        if (isNaN(num)) { setDisplay(target); obs.unobserve(el); return; }
        let start = 0;
        const step = Math.max(1, Math.floor(num / 40));
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { setDisplay(target); clearInterval(timer); }
          else setDisplay(String(start) + suffix);
        }, 30);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>{display}</span>;
}

/* ─── Partners data ─── */
const PARTNERS = [
  { src: '/astba/armoiriestunisie.png', alt: 'République Tunisienne' },
  { src: '/astba/beengo.webp', alt: 'Beengo' },
  { src: '/astba/innova.webp', alt: 'Innova' },
  { src: '/astba/minster jeune et sport.png', alt: 'Ministère Jeunesse et Sports' },
  { src: '/astba/minstere_women_family_and_childhood.png', alt: 'Ministère Femme, Famille et Enfance' },
];

/* ─── Specialties data ─── */
const SPECIALTIES = [
  { key: 'specRobotics', icon: Cpu, image: '/astba/Robotique_icon.png', color: 'from-blue-500 to-[#135bec]', border: 'border-blue-200 dark:border-blue-500/20', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'specInfoSoft', icon: Monitor, image: '/astba/infosoft_icon.png', color: 'from-orange-500 to-[#f5820b]', border: 'border-orange-200 dark:border-orange-500/20', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { key: 'specHealth', icon: Heart, image: '/astba/health_icon.jpg', color: 'from-emerald-500 to-teal-600', border: 'border-emerald-200 dark:border-emerald-500/20', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'specLanguages', icon: Languages, image: '/astba/langauges_icon.webp', color: 'from-purple-500 to-pink-600', border: 'border-purple-200 dark:border-purple-500/20', bg: 'bg-purple-50 dark:bg-purple-500/10' },
];

/* ─── Hero images ─── */
const HERO_IMAGES = ['/astba/1.jpg', '/astba/2.jpg', '/astba/3.jpg', '/astba/4.jpg', '/astba/5.jpg'];

export default function LandingPage() {
  const t = useTranslations('landing');
  const ta = useTranslations('auth');
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#101622] dark:text-white overflow-x-hidden scroll-smooth">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="nav-cursor fixed top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#101622]/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/astba/logo.png"
              alt="ASTBA Logo"
              width={36}
              height={36}
              className="rounded-lg shadow-lg shadow-[#135bec]/20 transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#135bec] to-[#f5820b] bg-clip-text text-transparent">ASTBA</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 lg:flex">
            {[
              { href: '#features', label: t('navFeatures') },
              { href: '#specialties', label: t('navSpecialties') },
              { href: '#how-it-works', label: t('navHowItWorks') },
              { href: '#partners', label: t('navPartners') },
              { href: '#stats', label: t('navStats') },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-base text-gray-500 transition-colors hover:text-gray-900 dark:text-[#92a4c9] dark:hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:bg-[#f5820b] after:transition-transform hover:after:scale-x-100"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-900 dark:text-[#92a4c9] dark:hover:text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {!isLoading && (
              isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="hidden rounded-lg bg-gradient-to-r from-[#135bec] to-blue-500 px-5 py-2 text-base font-semibold text-white shadow-lg shadow-[#135bec]/25 transition-all hover:shadow-[#135bec]/50 hover:scale-[1.03] sm:inline-flex"
                >
                  {t('goToDashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-lg px-4 py-2 text-base font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-[#92a4c9] dark:hover:text-white sm:inline-flex"
                  >
                    {ta('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="hidden rounded-lg bg-gradient-to-r from-[#135bec] to-blue-500 px-5 py-2 text-base font-semibold text-white shadow-lg shadow-[#135bec]/25 transition-all hover:shadow-[#135bec]/50 hover:scale-[1.03] sm:inline-flex"
                  >
                    {t('getStarted')}
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200/60 bg-white/95 backdrop-blur-xl dark:border-white/5 dark:bg-[#101622]/95 lg:hidden">
            <div className="flex flex-col gap-1 px-4 py-4">
              {[
                { href: '#features', label: t('navFeatures') },
                { href: '#specialties', label: t('navSpecialties') },
                { href: '#how-it-works', label: t('navHowItWorks') },
                { href: '#partners', label: t('navPartners') },
                { href: '#stats', label: t('navStats') },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#92a4c9] dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              {!isLoading && !isAuthenticated && (
                <div className="mt-2 flex gap-2 border-t border-gray-200/60 dark:border-white/5 pt-3">
                  <Link href="/login" className="flex-1 rounded-lg border border-gray-300 dark:border-[#324467] py-2 text-center text-base text-gray-600 dark:text-[#92a4c9]">{ta('login')}</Link>
                  <Link href="/register" className="flex-1 rounded-lg bg-[#135bec] py-2 text-center text-base font-semibold text-white">{t('getStarted')}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO WITH IMAGE CAROUSEL ═══ */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background carousel */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
              />
            </div>
          ))}
          {/* Light mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/75 to-white dark:from-[#101622]/80 dark:via-[#101622]/70 dark:to-[#101622]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-transparent dark:from-[#101622]/60 dark:to-transparent" />
        </div>

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-[#135bec]/10 dark:bg-[#135bec]/15 blur-[120px] animate-glow-pulse" />
          <div className="absolute top-20 end-1/4 h-[400px] w-[400px] rounded-full bg-[#f5820b]/8 dark:bg-[#f5820b]/10 blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f5820b]/30 bg-[#f5820b]/10 px-4 py-1.5 text-sm text-[#f5820b] animate-float" style={{ animationDelay: '0.5s' }}>
              <Sparkles className="h-4 w-4" />
              {t('heroBadge')}
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl leading-tight">
              <span className="block text-gray-900 dark:text-white">{t('heroTitle1')}</span>
              <span className="mt-2 block bg-gradient-to-r from-[#135bec] via-[#f5820b] to-[#135bec] bg-clip-text text-transparent text-shimmer bg-[length:200%_200%]">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-[#c5d0e6] sm:text-xl">
              {t('heroDescription')}
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={isAuthenticated ? '/dashboard' : '/register'}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#135bec] to-blue-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#135bec]/30 transition-all hover:shadow-[#135bec]/60 hover:scale-[1.04] active:scale-[0.98]"
              >
                {t('heroCtaPrimary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-[#f5820b]/40 bg-[#f5820b]/10 px-8 py-4 text-base font-semibold text-[#f5820b] transition-all hover:bg-[#f5820b]/20 hover:border-[#f5820b]/60"
              >
                {t('heroCtaSecondary')}
              </a>
            </div>

            {/* Carousel indicators */}
            <div className="mt-12 flex items-center justify-center gap-2">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-500 ${i === activeSlide ? 'w-8 bg-[#f5820b]' : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-white/30 dark:hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-gray-400 dark:border-white/30 p-1">
            <div className="h-1.5 w-1 rounded-full bg-[#f5820b]" />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section id="stats" className="relative border-y border-gray-200/60 bg-gray-50 dark:border-white/5 dark:bg-[#0c1320] py-16">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: '150', suffix: '+', label: t('statStudents') },
                { value: '7', suffix: '+', label: t('statYears') },
                { value: '6', suffix: '', label: t('statTeam') },
                { value: '2018', suffix: '', label: t('statFounded') },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-[#135bec] to-[#f5820b] bg-clip-text text-transparent sm:text-5xl transition-transform group-hover:scale-110">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />{stat.suffix}
                  </p>
                  <p className="mt-2 text-base text-gray-500 dark:text-[#92a4c9]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <Zap className="h-4 w-4" />
                {t('featuresBadge')}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {t('featuresTitle')}
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-[#92a4c9]">
                {t('featuresDescription')}
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
              {[
                { icon: Users, title: t('featureStudents'), description: t('featureStudentsDesc'), color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20' },
                { icon: BookOpen, title: t('featureTrainings'), description: t('featureTrainingsDesc'), color: 'from-[#f5820b] to-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' },
                { icon: ClipboardCheck, title: t('featureAttendance'), description: t('featureAttendanceDesc'), color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
                { icon: Award, title: t('featureCertificates'), description: t('featureCertificatesDesc'), color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' },
                { icon: BarChart3, title: t('featureAnalytics'), description: t('featureAnalyticsDesc'), color: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20' },
                { icon: Shield, title: t('featureSecurity'), description: t('featureSecurityDesc'), color: 'from-rose-500 to-red-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' },
              ].map(({ icon: Icon, title, description, color, bg, border }) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-2xl border ${border} ${bg} p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20`}
                >
                  {/* Hover gradient glow */}
                  <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                  <div className="relative">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-base leading-relaxed text-gray-500 dark:text-[#92a4c9]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ SPECIALTIES ═══ */}
      <section id="specialties" className="relative border-y border-gray-200/60 bg-gray-50 dark:border-white/5 dark:bg-[#0c1320] py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f5820b]/30 bg-[#f5820b]/10 px-4 py-1.5 text-sm text-[#f5820b]">
                <GraduationCap className="h-4 w-4" />
                {t('specialtiesBadge')}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('specialtiesTitle')}</h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-[#92a4c9]">{t('specialtiesDescription')}</p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-in">
              {SPECIALTIES.map(({ key, icon: Icon, image, color, border, bg }) => (
                <div
                  key={key}
                  className={`group relative overflow-hidden rounded-2xl border ${border} ${bg} transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30`}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={image}
                      alt={t(key as 'specRobotics')}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#0c1320]" />
                    <div className={`absolute top-3 end-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="mb-1.5 text-lg font-bold text-gray-900 dark:text-white">{t(key as 'specRobotics')}</h3>
                    <p className="text-base leading-relaxed text-gray-500 dark:text-[#92a4c9]">{t(`${key}Desc` as 'specRoboticsDesc')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="relative py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {t('howItWorksTitle')}
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-[#92a4c9]">
                {t('howItWorksDescription')}
              </p>
            </div>

            <div className="relative mt-16">
              {/* Connector line */}
              <div className="absolute top-8 start-0 end-0 hidden h-0.5 bg-gradient-to-r from-transparent via-[#f5820b]/30 dark:via-[#f5820b]/40 to-transparent lg:block" aria-hidden="true" />

              <div className="grid gap-8 lg:grid-cols-4 stagger-in">
                {[
                  { step: '01', title: t('step1Title'), desc: t('step1Desc'), icon: Users, color: 'text-[#135bec]' },
                  { step: '02', title: t('step2Title'), desc: t('step2Desc'), icon: BookOpen, color: 'text-[#f5820b]' },
                  { step: '03', title: t('step3Title'), desc: t('step3Desc'), icon: ClipboardCheck, color: 'text-[#135bec]' },
                  { step: '04', title: t('step4Title'), desc: t('step4Desc'), icon: Award, color: 'text-[#f5820b]' },
                ].map(({ step, title, desc, icon: Icon, color }) => (
                  <div key={step} className="relative text-center group">
                    <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#324467] dark:bg-[#192233] transition-all duration-300 group-hover:border-[#f5820b]/40 group-hover:shadow-[#f5820b]/10 dark:group-hover:shadow-[#f5820b]/20">
                      <Icon className={`h-7 w-7 ${color}`} />
                      <span className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#135bec] to-[#f5820b] text-xs font-bold text-white shadow-lg">
                        {step}
                      </span>
                    </div>
                    <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-base text-gray-500 dark:text-[#92a4c9]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ PARTNERS LOGO SLIDER ═══ */}
      <section id="partners" className="relative border-y border-gray-200/60 bg-gray-50 dark:border-white/5 dark:bg-[#0c1320] py-24 sm:py-32 overflow-hidden">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#135bec]/30 bg-[#135bec]/10 px-4 py-1.5 text-sm text-[#135bec]">
                <Globe className="h-4 w-4" />
                {t('partnersBadge')}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('partnersTitle')}</h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-[#92a4c9]">{t('partnersDescription')}</p>
            </div>
          </div>

          {/* Infinite scroll slider */}
          <div className="relative">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-32 bg-gradient-to-r from-gray-50 to-transparent dark:from-[#0c1320]" />
            <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-32 bg-gradient-to-l from-gray-50 to-transparent dark:from-[#0c1320]" />

            <div className="flex overflow-hidden" role="marquee" aria-label="Partner logos">
              <div className="logo-slider flex shrink-0 items-center gap-16 px-8">
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                  <div
                    key={`${p.alt}-${i}`}
                    className="flex h-24 w-48 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#f5820b]/40 hover:shadow-lg dark:border-[#324467]/50 dark:bg-[#192233]/50 dark:backdrop-blur-sm dark:hover:bg-[#192233]"
                  >
                    <Image
                      src={p.src}
                      alt={p.alt}
                      width={160}
                      height={80}
                      className="max-h-16 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="logo-slider flex shrink-0 items-center gap-16 px-8" aria-hidden="true">
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                  <div
                    key={`dup-${p.alt}-${i}`}
                    className="flex h-24 w-48 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#f5820b]/40 hover:shadow-lg dark:border-[#324467]/50 dark:bg-[#192233]/50 dark:backdrop-blur-sm dark:hover:bg-[#192233]"
                  >
                    <Image
                      src={p.src}
                      alt=""
                      width={160}
                      height={80}
                      className="max-h-16 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ HIGHLIGHTS ═══ */}
      <section className="py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10 px-4 py-1.5 text-sm text-purple-600 dark:text-purple-400">
                  <Star className="h-4 w-4" />
                  {t('highlightsBadge')}
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  {t('highlightsTitle')}
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-[#92a4c9]">
                  {t('highlightsDescription')}
                </p>

                <ul className="mt-8 space-y-4">
                  {[t('highlight1'), t('highlight2'), t('highlight3'), t('highlight4'), t('highlight5')].map((item) => (
                    <li key={item} className="group flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f5820b] transition-transform group-hover:scale-125" />
                      <span className="text-gray-600 group-hover:text-gray-900 dark:text-[#92a4c9] dark:group-hover:text-white transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature card visual */}
              <div className="relative">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-[#324467]/50 dark:bg-[#192233]">
                  <div className="space-y-5">
                    {[
                      { label: t('highlightProgress'), pct: 92, color: 'bg-gradient-to-r from-[#135bec] to-blue-400' },
                      { label: t('highlightAttRate'), pct: 95, color: 'bg-gradient-to-r from-[#f5820b] to-orange-400' },
                      { label: t('highlightCertRate'), pct: 78, color: 'bg-gradient-to-r from-purple-500 to-pink-400' },
                    ].map(({ label, pct, color }) => (
                      <div key={label}>
                        <div className="mb-1.5 flex justify-between text-base">
                          <span className="text-gray-500 dark:text-[#92a4c9]">{label}</span>
                          <span className="font-bold text-gray-900 dark:text-white">{pct}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#101622]">
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
                      <div key={label} className="group rounded-xl border border-gray-200 bg-gray-50 dark:border-[#324467] dark:bg-[#101622] p-4 text-center transition-all duration-300 hover:border-[#f5820b]/40 hover:shadow-lg hover:shadow-[#f5820b]/5 dark:hover:shadow-[#f5820b]/10">
                        <Icon className="mx-auto h-5 w-5 text-[#135bec] group-hover:text-[#f5820b] transition-colors" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-[#92a4c9]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -bottom-4 left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-full bg-[#f5820b]/10 dark:bg-[#f5820b]/15 blur-2xl animate-glow-pulse" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="relative border-t border-gray-200/60 bg-gray-50 dark:border-white/5 dark:bg-[#0c1320] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 start-1/4 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[#135bec]/5 dark:bg-[#135bec]/10 blur-[120px] animate-glow-pulse" />
          <div className="absolute top-1/2 end-1/4 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[#f5820b]/5 dark:bg-[#f5820b]/10 blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <Reveal>
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#324467] dark:bg-[#192233]">
              <Image src="/astba/logo.png" alt="ASTBA" width={56} height={56} className="rounded-lg" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              {t('ctaTitle')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500 dark:text-[#92a4c9]">
              {t('ctaDescription')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={isAuthenticated ? '/dashboard' : '/register'}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#135bec] via-blue-500 to-[#135bec] bg-[length:200%_100%] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#135bec]/30 transition-all duration-500 hover:bg-right hover:shadow-[#135bec]/60 hover:scale-[1.04] active:scale-[0.98]"
              >
                {t('ctaButton')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-gray-200/60 bg-white dark:border-white/5 dark:bg-[#101622] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-3 md:items-start">
              <div className="flex items-center gap-2.5">
                <Image src="/astba/logo.png" alt="ASTBA" width={32} height={32} className="rounded-lg" />
                <span className="font-bold text-lg bg-gradient-to-r from-[#135bec] to-[#f5820b] bg-clip-text text-transparent">ASTBA</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-[#92a4c9]/70">{t('footerSince')}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-base text-gray-500 dark:text-[#92a4c9]">
                © 2026 ASTBA – Association Sciences and Technology Ben Arous
              </p>
              <p className="text-sm text-gray-400 dark:text-[#92a4c9]/60">{t('footerAddress')}</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { href: '#features', label: t('navFeatures') },
                { href: '#specialties', label: t('navSpecialties') },
                { href: '#how-it-works', label: t('navHowItWorks') },
                { href: '#partners', label: t('navPartners') },
              ].map((link) => (
                <a key={link.href} href={link.href} className="text-base text-gray-500 hover:text-gray-900 dark:text-[#92a4c9] dark:hover:text-white transition-colors">{link.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
