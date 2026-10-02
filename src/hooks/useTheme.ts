import { useState, useEffect } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type ColorPalette = 'neon_lime' | 'manga_orange';

const THEME_STORAGE_KEY = 'monsalaire_theme_mode';
const PALETTE_STORAGE_KEY = 'monsalaire_color_palette';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (saved === 'neon_lime' || saved === 'manga_orange') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'neon_lime';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Écouter les changements du thème système en temps réel
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  // Appliquer le thème clair/sombre sur <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'light' ? '#e8e8ec' : '#050506');
    }
  }, [resolvedTheme, colorPalette]);

  // Appliquer la palette de couleurs Manga Orange / Neon Lime sur <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-palette', colorPalette);
    if (colorPalette === 'manga_orange') {
      root.classList.add('theme-manga-orange');
      root.classList.remove('theme-neon-lime');
    } else {
      root.classList.add('theme-neon-lime');
      root.classList.remove('theme-manga-orange');
    }
  }, [colorPalette]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const setColorPalette = (palette: ColorPalette) => {
    setColorPaletteState(palette);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      // ignore
    }
  };

  const cycleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('system');
    }
  };

  return {
    themeMode,
    resolvedTheme,
    colorPalette,
    setThemeMode,
    setColorPalette,
    cycleTheme,
  };
}
