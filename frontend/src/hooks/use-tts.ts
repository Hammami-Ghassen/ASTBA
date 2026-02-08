'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTTSReturn {
    speak: () => void;
    stop: () => void;
    isPlaying: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Extract the important readable text from the current page.
 * Strips navigation, scripts, accessibility widgets, etc.
 */
function extractPageContent(): { text: string; title: string } {
    const main = document.getElementById('main-content');
    const root = main || document.body;

    const clone = root.cloneNode(true) as HTMLElement;

    // Remove non-content elements
    clone
        .querySelectorAll(
            'script, style, nav, header, footer, button, [aria-hidden="true"], ' +
            '.sr-only, iframe, svg, noscript, [data-zoom-widget], ' +
            '.tts-button, .zoom-widget, aside, form'
        )
        .forEach((el) => el.remove());

    const raw = clone.innerText || clone.textContent || '';
    const text = raw.replace(/\s+/g, ' ').trim();

    // Try to get page title
    const h1 = (main || document.body).querySelector('h1');
    const title = h1?.textContent?.trim() || document.title || '';

    return { text, title };
}

/**
 * Detect the current locale from the <html lang="..."> attribute.
 */
function detectLocale(): string {
    const lang = document.documentElement.lang || '';
    if (lang.startsWith('ar')) return 'ar';
    return 'fr';
}

/**
 * Find the best voice for the given language.
 */
function findVoice(lang: 'ar' | 'fr'): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();

    if (lang === 'ar') {
        // Prioritize Standard Arabic voices (ar-SA) for clear فصحى pronunciation
        const preferred = ['ar-SA', 'ar-XA', 'ar-EG', 'ar-001', 'ar'];
        for (const code of preferred) {
            const match = voices.find(
                (v) =>
                    v.lang.toLowerCase() === code.toLowerCase() ||
                    v.lang.toLowerCase().startsWith(code.toLowerCase())
            );
            if (match) return match;
        }
        return voices.find((v) => v.lang.toLowerCase().includes('ar')) || null;
    }

    // French
    const preferred = ['fr-FR', 'fr-CA', 'fr'];
    for (const code of preferred) {
        const match = voices.find(
            (v) =>
                v.lang.toLowerCase() === code.toLowerCase() ||
                v.lang.toLowerCase().startsWith(code.toLowerCase())
        );
        if (match) return match;
    }
    return voices.find((v) => v.lang.toLowerCase().includes('fr')) || null;
}

/**
 * Split long text into chunks that the speech API can handle.
 * Most browsers choke on utterances > ~200 chars.
 */
function splitIntoChunks(text: string, maxLen = 180): string[] {
    const sentences = text.match(/[^.!?؟،]+[.!?؟،]?\s*/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
        if ((current + sentence).length > maxLen) {
            if (current.trim()) chunks.push(current.trim());
            current = sentence;
        } else {
            current += sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
}

export function useTTS(): UseTTSReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const playingRef = useRef(false);

    // Preload voices
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        speechSynthesis.getVoices();
        const handler = () => speechSynthesis.getVoices();
        speechSynthesis.addEventListener('voiceschanged', handler);
        return () => speechSynthesis.removeEventListener('voiceschanged', handler);
    }, []);

    const stop = useCallback(() => {
        playingRef.current = false;
        abortRef.current?.abort();
        abortRef.current = null;
        speechSynthesis.cancel();
        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    const speak = useCallback(() => {
        if (!('speechSynthesis' in window)) {
            setError("La synthèse vocale n'est pas supportée");
            return;
        }

        // Toggle off if already playing
        if (isPlaying || isLoading) {
            stop();
            return;
        }

        const { text, title } = extractPageContent();
        if (!text || text.length < 20) {
            setError('Aucun contenu à lire sur cette page');
            return;
        }

        const locale = detectLocale();

        setError(null);
        setIsLoading(true);
        playingRef.current = true;

        const abortController = new AbortController();
        abortRef.current = abortController;

        // Call Perplexity to summarize the page content intelligently
        fetch('/api/tts-summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pageContent: text.slice(0, 6000),
                locale,
                pageTitle: title,
            }),
            signal: abortController.signal,
        })
            .then((res) => {
                if (!res.ok) throw new Error(`API error ${res.status}`);
                return res.json();
            })
            .then(({ summary }: { summary: string }) => {
                if (!playingRef.current) return;

                if (!summary) {
                    setError(locale === 'ar' ? 'لم يتم إنشاء الملخص' : 'Résumé non généré');
                    setIsLoading(false);
                    return;
                }

                speakText(summary, locale);
            })
            .catch((err: Error) => {
                if (err.name === 'AbortError') return;
                console.error('TTS summarize error:', err);

                // Fallback: read raw content directly if Perplexity fails
                if (!playingRef.current) return;
                speakText(text.slice(0, 2000), locale);
            });

        function speakText(content: string, loc: string) {
            speechSynthesis.cancel();

            const lang = loc === 'ar' ? 'ar' : 'fr';
            const voice = findVoice(lang as 'ar' | 'fr');
            const chunks = splitIntoChunks(content);

            let chunkIndex = 0;

            const speakNext = () => {
                if (!playingRef.current || chunkIndex >= chunks.length) {
                    setIsPlaying(false);
                    playingRef.current = false;
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
                if (voice) {
                    utterance.voice = voice;
                    utterance.lang = voice.lang;
                } else {
                    utterance.lang = loc === 'ar' ? 'ar-SA' : 'fr-FR';
                }
                utterance.rate = loc === 'ar' ? 0.88 : 0.92;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onstart = () => {
                    if (chunkIndex === 0) {
                        setIsPlaying(true);
                        setIsLoading(false);
                    }
                };

                utterance.onend = () => {
                    chunkIndex++;
                    speakNext();
                };

                utterance.onerror = (e) => {
                    if (e.error === 'canceled') return;
                    setError(
                        loc === 'ar' ? 'خطأ في القراءة الصوتية' : 'Erreur de lecture vocale'
                    );
                    setIsPlaying(false);
                    setIsLoading(false);
                    playingRef.current = false;
                };

                speechSynthesis.speak(utterance);
            };

            speakNext();
        }
    }, [isPlaying, isLoading, stop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            playingRef.current = false;
            abortRef.current?.abort();
            speechSynthesis.cancel();
        };
    }, []);

    return { speak, stop, isPlaying, isLoading, error };
}
