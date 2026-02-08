'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/** Zoom levels available – from 80% to 200% */
const ZOOM_LEVELS = [80, 90, 100, 110, 125, 150, 175, 200] as const;
const DEFAULT_ZOOM = 125; // matches the current html { font-size: 125% }
const STORAGE_KEY = 'astba-zoom-level';

export interface ZoomState {
  /** Current zoom percentage (80–200) */
  zoom: number;
  /** Whether the zoom control panel is open */
  isOpen: boolean;
  /** Whether the magnifying lens mode is active */
  isLensActive: boolean;
  /** Lens magnification multiplier (1.5–3) */
  lensPower: number;
  /** Mouse position for the lens */
  mousePos: { x: number; y: number };
  /** Available zoom levels */
  levels: readonly number[];
  /** Open/close the control panel */
  toggle: () => void;
  /** Close the control panel */
  close: () => void;
  /** Set zoom to a specific level */
  setZoom: (level: number) => void;
  /** Increase zoom one step */
  zoomIn: () => void;
  /** Decrease zoom one step */
  zoomOut: () => void;
  /** Reset zoom to default (125%) */
  resetZoom: () => void;
  /** Toggle magnifying lens mode */
  toggleLens: () => void;
  /** Change lens magnification */
  setLensPower: (power: number) => void;
}

function getInitialZoom(): number {
  if (typeof window === 'undefined') return DEFAULT_ZOOM;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = Number(stored);
      if (ZOOM_LEVELS.includes(val as (typeof ZOOM_LEVELS)[number])) return val;
    }
  } catch { /* private browsing */ }
  return DEFAULT_ZOOM;
}

export function useZoom(): ZoomState {
  const [zoom, setZoomState] = useState(getInitialZoom);
  const [isOpen, setIsOpen] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);
  const [lensPower, setLensPowerState] = useState(2);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  // ------------------------------------------------------------------
  // Apply zoom via CSS custom property on <html>
  // ------------------------------------------------------------------
  useEffect(() => {
    const pct = `${zoom}%`;
    document.documentElement.style.fontSize = pct;
    document.documentElement.setAttribute('data-zoom', String(zoom));
    try {
      localStorage.setItem(STORAGE_KEY, String(zoom));
    } catch {
      /* private browsing */
    }
  }, [zoom]);

  // ------------------------------------------------------------------
  // Mouse tracking for lens mode (throttled via rAF)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isLensActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isLensActive]);

  // ------------------------------------------------------------------
  // Keyboard shortcut: Escape to close panel / deactivate lens
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLensActive) {
          setIsLensActive(false);
          e.preventDefault();
        } else if (isOpen) {
          setIsOpen(false);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLensActive, isOpen]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const close = useCallback(() => setIsOpen(false), []);

  const setZoom = useCallback((level: number) => {
    const clamped = Math.max(80, Math.min(200, level));
    setZoomState(clamped);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx >= 0 && idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      // If not on a preset, snap to next higher
      const next = ZOOM_LEVELS.find((l) => l > prev);
      return next ?? prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      const lower = [...ZOOM_LEVELS].reverse().find((l) => l < prev);
      return lower ?? prev;
    });
  }, []);

  const resetZoom = useCallback(() => setZoomState(DEFAULT_ZOOM), []);

  const toggleLens = useCallback(() => {
    setIsLensActive((prev) => {
      const next = !prev;
      if (!next) setMousePos({ x: -200, y: -200 });
      return next;
    });
  }, []);

  const setLensPower = useCallback((power: number) => {
    setLensPowerState(Math.max(1.5, Math.min(4, power)));
  }, []);

  return {
    zoom,
    isOpen,
    isLensActive,
    lensPower,
    mousePos,
    levels: ZOOM_LEVELS,
    toggle,
    close,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleLens,
    setLensPower,
  };
}
