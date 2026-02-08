'use client';

import dynamic from 'next/dynamic';

const TTSAccessibilityButton = dynamic(
  () => import('./tts-button').then((m) => m.TTSAccessibilityButton),
  { ssr: false }
);

const ZoomAccessibilityWidget = dynamic(
  () => import('./zoom-widget').then((m) => m.ZoomAccessibilityWidget),
  { ssr: false }
);

export function TTSWrapper() {
  return (
    <>
      <ZoomAccessibilityWidget />
      <TTSAccessibilityButton />
    </>
  );
}
