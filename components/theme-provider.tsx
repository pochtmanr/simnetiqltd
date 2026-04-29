"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

export const THEME_COOKIE = "theme";
export const THEME_STORAGE_KEY = "theme";

// Runs only on first visit (when the server has not seen a theme cookie yet).
// Detects the OS / browser preference synchronously, writes the resolved value
// to the cookie + localStorage, and applies data-theme so subsequent paint is
// already correct. After this runs once, the server reads the cookie and SSRs
// the right theme on every future request — no script, no FOUC.
export const THEME_INIT_SCRIPT = `(function(){try{var k='${"theme"}';var c=document.cookie.match(/(?:^|; )theme=(light|dark)/);var stored=c?c[1]:null;if(!stored){try{var ls=localStorage.getItem(k);if(ls==='light'||ls==='dark')stored=ls;}catch(e){}}var t=stored||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var d=document.documentElement;d.setAttribute('data-theme',t);d.style.colorScheme=t;document.cookie='theme='+t+';path=/;max-age=31536000;samesite=lax';try{localStorage.setItem(k,t);}catch(e){}}catch(e){}})();`;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage may be unavailable (privacy mode); ignore */
  }
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;samesite=lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    persistTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
