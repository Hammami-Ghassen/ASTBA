'use client';

import React from 'react';
import { useTTS } from '@/hooks/use-tts';

/**
 * Floating accessibility button to read page content aloud
 * using ElevenLabs TTS with a Tunisian Darija accent voice.
 *
 * Shows a speaker icon in the bottom-left corner.
 * Click to start reading, click again to stop.
 */
export function TTSAccessibilityButton() {
  const { speak, stop, isPlaying, isLoading, error } = useTTS();

  const handleClick = () => {
    if (isPlaying || isLoading) {
      stop();
    } else {
      speak();
    }
  };

  const label = isLoading
    ? 'جاري التحميل...'
    : isPlaying
      ? 'أوقف القراءة'
      : 'اقرأ الصفحة بالتونسي';

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={label}
        title={label}
        className="group fixed bottom-6 left-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        style={{
          background: isPlaying
            ? 'linear-gradient(135deg, #f5820b, #e06b00)'
            : isLoading
              ? 'linear-gradient(135deg, #64748b, #475569)'
              : 'linear-gradient(135deg, #135bec, #0d47d1)',
        }}
      >
        {isLoading ? (
          /* Spinner */
          <svg
            className="h-6 w-6 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isPlaying ? (
          /* Stop icon */
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          /* Speaker / TTS icon */
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
          </svg>
        )}

        {/* Pulse ring when playing */}
        {isPlaying && (
          <span className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-30" />
        )}
      </button>

      {/* Tooltip on hover */}
      <div
        className="pointer-events-none fixed bottom-[5.5rem] left-6 z-[9998] translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        aria-hidden
      >
        <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg dark:bg-gray-700">
          {label}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-xl">
          {error}
        </div>
      )}
    </>
  );
}
