'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <ShieldX className="h-16 w-16 text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('accessDenied')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('accessDeniedDescription')}
          </p>
          <div className="flex gap-3 mt-4">
            <Button asChild variant="outline">
              <Link href="/">{t('backToHome')}</Link>
            </Button>
            <Button asChild>
              <Link href="/login">{t('backToLogin')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
