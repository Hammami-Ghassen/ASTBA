'use client';

import { useState, useRef, useCallback } from 'react';

const ELEVENLABS_API_KEY = 'fd64717528213950b45c9093e45cb9ad0f66ba24aaed3ff0ee6dee27a276d62e';
const VOICE_ID = 'nH7M8bGCLQbKoS0wBZj7'; // Tunisian accent voice

interface UseTTSReturn {
    /** Start reading the given text (or auto-detect from page) */
    speak: (text?: string) => Promise<void>;
    /** Stop any current playback */
    stop: () => void;
    /** Whether audio is currently playing */
    isPlaying: boolean;
    /** Whether audio is being fetched from API */
    isLoading: boolean;
    /** Any error message */
    error: string | null;
}

/**
 * Extract readable text from the current page.
 * Targets #main-content first, then falls back to <body>.
 */
function extractPageText(): string {
    const main = document.getElementById('main-content');
    const root = main || document.body;

    // Clone to avoid mutating the DOM
    const clone = root.cloneNode(true) as HTMLElement;

    // Remove elements that shouldn't be read
    clone.querySelectorAll('script, style, nav, header, footer, button, [aria-hidden="true"], .sr-only, iframe, svg')
        .forEach((el) => el.remove());

    const raw = clone.innerText || clone.textContent || '';

    // Clean up whitespace
    return raw
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 5000); // ElevenLabs limit-safe
}

export function useTTS(): UseTTSReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    const speak = useCallback(async (text?: string) => {
        // If already playing, stop
        if (isPlaying || isLoading) {
            stop();
            return;
        }

        const content = text || extractPageText();
        if (!content) {
            setError('Aucun contenu à lire');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': ELEVENLABS_API_KEY,
                    },
                    body: JSON.stringify({
                        text: content,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.4,
                            use_speaker_boost: true,
                        },
                    }),
                    signal: controller.signal,
                }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.detail?.message || `ElevenLabs API error: ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => {
                setIsPlaying(true);
                setIsLoading(false);
            };

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
                audioRef.current = null;
            };

            audio.onerror = () => {
                setError('Erreur de lecture audio');
                setIsPlaying(false);
                setIsLoading(false);
                URL.revokeObjectURL(url);
                audioRef.current = null;
            };

            await audio.play();
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setIsLoading(false);
        }
    }, [isPlaying, isLoading, stop]);

    return { speak, stop, isPlaying, isLoading, error };
}
