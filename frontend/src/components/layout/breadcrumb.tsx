'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" aria-hidden="true" />
            )}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:text-gray-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(index === items.length - 1 && 'font-medium text-gray-900 dark:text-gray-100')}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Auto-generate breadcrumb from pathname */
export function AutoBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const segments = pathname.split('/').filter(Boolean);

  const items: BreadcrumbItem[] = [
    { label: t('dashboard'), href: '/' },
  ];

  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    const labelKey = segment as 'students' | 'trainings' | 'attendance' | 'certificates';
    const knownKeys = ['students', 'trainings', 'attendance', 'certificates'];
    const label = knownKeys.includes(segment) ? t(labelKey) : segment === 'new' ? '+' : segment;
    items.push({ label, href: path });
  }

  if (items.length <= 1) return null;

  return <Breadcrumb items={items} />;
}
