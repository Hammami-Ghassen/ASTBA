'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTTSReturn {
    speak: (text?: string) => void;
    stop: () => void;
    isPlaying: boolean;
    isLoading: boolean;
    error: string | null;
    voiceName: string | null;
}

/**
 * Extract readable text from the current page.
 */
function extractPageText(): string {
    const main = document.getElementById('main-content');
    const root = main || document.body;

    const clone = root.cloneNode(true) as HTMLElement;
    clone
        .querySelectorAll(
            'script, style, nav, header, footer, button, [aria-hidden="true"], .sr-only, iframe, svg, noscript'
        )
        .forEach((el) => el.remove());

    const raw = clone.innerText || clone.textContent || '';
    return raw.replace(/\s+/g, ' ').trim().slice(0, 10000);
}

/**
 * Find the best Arabic voice available in the browser.
 * Preference: ar-TN > ar-SA > ar-* > any Arabic > default
 */
function findArabicVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();

    // Priority order
    const tunisian = voices.find((v) => v.lang.startsWith('ar-TN') || v.lang === 'ar_TN');
    if (tunisian) return tunisian;

    const saudi = voices.find((v) => v.lang.startsWith('ar-SA') || v.lang === 'ar_SA');
    if (saudi) return saudi;

    const anyArabic = voices.find((v) => v.lang.startsWith('ar'));
    if (anyArabic) return anyArabic;

    return null;
}

export function useTTS(): UseTTSReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voiceName, setVoiceName] = useState<string | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load voices (some browsers load them async)
    useEffect(() => {
        const loadVoice = () => {
            const voice = findArabicVoice();
            if (voice) setVoiceName(voice.name);
        };
        loadVoice();
        speechSynthesis.addEventListener('voiceschanged', loadVoice);
        return () => speechSynthesis.removeEventListener('voiceschanged', loadVoice);
    }, []);

    const stop = useCallback(() => {
        speechSynthesis.cancel();
        utteranceRef.current = null;
        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    const speak = useCallback(
        (text?: string) => {
            if (!('speechSynthesis' in window)) {
                setError('La synthèse vocale n\'est pas supportée par ce navigateur');
                return;
            }

            // Toggle off
            if (isPlaying) {
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

            // Cancel any pending speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(content);
            utteranceRef.current = utterance;

            // Set Arabic voice
            const voice = findArabicVoice();
            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            } else {
                utterance.lang = 'ar';
            }

            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                setIsPlaying(true);
                setIsLoading(false);
            };

            utterance.onend = () => {
                setIsPlaying(false);
                utteranceRef.current = null;
            };

            utterance.onerror = (e) => {
                if (e.error === 'canceled') return;
                setError('Erreur de lecture vocale');
                setIsPlaying(false);
                setIsLoading(false);
                utteranceRef.current = null;
            };

            speechSynthesis.speak(utterance);
        },
        [isPlaying, stop]
    );

    return { speak, stop, isPlaying, isLoading, error, voiceName };
}
