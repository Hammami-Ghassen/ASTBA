'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/providers';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const { locale, setLocale } = useLocale();

  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'ar-TN' : 'fr');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={locale === 'fr' ? 'Passer en arabe' : 'التبديل إلى الفرنسية'}
      className="font-semibold"
    >
      {t('switchLang')}
    </Button>
  );
}
