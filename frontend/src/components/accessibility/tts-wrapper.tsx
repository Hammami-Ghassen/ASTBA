'use client';

import dynamic from 'next/dynamic';

const TTSAccessibilityButton = dynamic(
  () => import('./tts-button').then((m) => m.TTSAccessibilityButton),
  { ssr: false }
);

export function TTSWrapper() {
  return <TTSAccessibilityButton />;
}
