import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('pm_theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('pm_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const applyTheme = useCallback((targetTheme) => {
    const isDark =
      targetTheme === 'dark' ||
      (targetTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolved = isDark ? 'dark' : 'light';
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem('pm_theme', nextTheme);
    } catch {}
    applyTheme(nextTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    applyTheme(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, applyTheme]);

  const value = {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    // Fallback if accessed outside ThemeProvider
    return {
      theme: 'system',
      resolvedTheme: 'light',
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
