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

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_COOKIE = "theme-pref";
export const THEME_STORAGE_KEY = "theme-pref";
export const THEME_COLOR_DARK = "#07090D";
export const THEME_COLOR_LIGHT = "#F7F5F1";

// Inline blocking script. Rendered via next/script beforeInteractive (Next
// places it in <head> so it executes before first paint). Jobs:
//   1. Read cookie / localStorage to recover the user's choice
//      (light | dark | system). Defaults to "system" when absent.
//   2. Resolve "system" through matchMedia and ALWAYS write data-theme
//      with the resolved value, so the existing CSS [data-theme="..."]
//      selectors apply on first paint — no FOUC.
//   3. Set <html style="color-scheme"> so native form controls and
//      scrollbars paint with the right palette before hydration.
//   4. Sync a dynamic <meta name="theme-color"> tag so the iOS / Android
//      browser chrome matches the resolved theme even when an explicit
//      override differs from the OS preference.
// A one-frame transition-suppressor prevents the 200ms color fade on
// html/body from being visible during the initial DOM mutation.
export const THEME_INIT_SCRIPT = `(function(){try{
var k='${THEME_STORAGE_KEY}';
var d=document.documentElement;
var cm=document.cookie.match(/(?:^|; )theme-pref=(light|dark|system)/);
var c=cm?cm[1]:null;
if(!c){try{var ls=localStorage.getItem(k);if(ls==='light'||ls==='dark'||ls==='system')c=ls;}catch(e){}}
if(!c)c='system';
var mq=window.matchMedia('(prefers-color-scheme: dark)');
var r=c==='system'?(mq.matches?'dark':'light'):c;
var pre=d.getAttribute('data-theme');
if(pre!==r){var s=document.createElement('style');s.id='theme-no-flash';s.appendChild(document.createTextNode('*,*::before,*::after{transition:none!important;animation:none!important}'));document.head.appendChild(s);d.setAttribute('data-theme',r);requestAnimationFrame(function(){requestAnimationFrame(function(){s.parentNode&&s.parentNode.removeChild(s);});});}
else{d.setAttribute('data-theme',r);}
d.style.colorScheme=r;
d.setAttribute('data-theme-choice',c);
if(c!=='system'){
  // Explicit override — strip the static media-driven theme-color metas so
  // the dynamic non-media tag wins regardless of OS preference.
  var statics=document.querySelectorAll('meta[name="theme-color"][media]');
  for(var i=0;i<statics.length;i++){statics[i].parentNode.removeChild(statics[i]);}
  var m=document.querySelector('meta[name="theme-color"][data-dyn]');
  if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');m.setAttribute('data-dyn','1');document.head.appendChild(m);}
  m.setAttribute('content',r==='dark'?'${THEME_COLOR_DARK}':'${THEME_COLOR_LIGHT}');
} else {
  // System mode — let the static media-driven metas track OS naturally.
  var dyn=document.querySelector('meta[name="theme-color"][data-dyn]');
  if(dyn)dyn.parentNode.removeChild(dyn);
}
}catch(e){}})();`;

type ThemeContextValue = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (next: ThemeChoice) => void;
  cycleChoice: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readInitialChoice(initialChoice: ThemeChoice | undefined): ThemeChoice {
  if (initialChoice) return initialChoice;
  if (typeof document === "undefined") return "system";
  // Inline script may have set localStorage already.
  try {
    const ls = localStorage.getItem(THEME_STORAGE_KEY);
    if (ls === "light" || ls === "dark" || ls === "system") return ls;
  } catch {
    /* ignore */
  }
  return "system";
}

function syncMetaThemeColor(choice: ThemeChoice, resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  if (choice === "system") {
    // Let the static media-driven theme-color metas track OS naturally;
    // remove any dynamic override left over from a previous explicit choice.
    document
      .querySelectorAll('meta[name="theme-color"][data-dyn]')
      .forEach((el) => el.parentNode?.removeChild(el));
    return;
  }
  // Explicit override — strip media-driven statics so the dynamic
  // non-media tag wins regardless of OS preference.
  document
    .querySelectorAll('meta[name="theme-color"][media]')
    .forEach((el) => el.parentNode?.removeChild(el));
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][data-dyn]',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("data-dyn", "1");
    document.head.appendChild(meta);
  }
  meta.setAttribute(
    "content",
    resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
  );
}

function persistChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* localStorage may be unavailable (privacy mode); ignore */
  }
  document.cookie = `${THEME_COOKIE}=${choice};path=/;max-age=31536000;samesite=lax`;
}

function applyChoiceToDom(choice: ThemeChoice, resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Always set the resolved value so existing [data-theme="light"|"dark"]
  // CSS selectors apply consistently. Track the *intent* on a separate
  // attribute so future reads (and CSS, if needed) can distinguish
  // explicit overrides from system-following.
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-choice", choice);
  root.style.colorScheme = resolved;
  syncMetaThemeColor(choice, resolved);
}

export function ThemeProvider({
  initialChoice,
  children,
}: {
  initialChoice?: ThemeChoice;
  children: ReactNode;
}) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() =>
    readInitialChoice(initialChoice),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "dark";
    return choice === "system" ? readSystemTheme() : choice;
  });

  // Reconcile with the inline init script: if the script picked a
  // different choice from localStorage than what SSR derived from the
  // cookie (e.g. cookies were cleared but localStorage survived), adopt
  // the script's resolution so we don't silently flip the user's theme.
  useEffect(() => {
    const fromScript = document.documentElement.getAttribute(
      "data-theme-choice",
    );
    if (
      (fromScript === "light" ||
        fromScript === "dark" ||
        fromScript === "system") &&
      fromScript !== choice
    ) {
      setChoiceState(fromScript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply choice → DOM whenever it changes.
  useEffect(() => {
    const next: ResolvedTheme = choice === "system" ? readSystemTheme() : choice;
    setResolved(next);
    applyChoiceToDom(choice, next);
    persistChoice(choice);
  }, [choice]);

  // Live-track OS preference while in system mode. Updates data-theme,
  // colorScheme, and the dynamic meta theme-color in real time when the
  // OS swaps schedule (iOS auto-dark at sunset, manual flip, etc.).
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const next: ResolvedTheme = event.matches ? "dark" : "light";
      setResolved(next);
      const root = document.documentElement;
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
      syncMetaThemeColor("system", next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
  }, []);

  const cycleChoice = useCallback(() => {
    setChoiceState((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved, setChoice, cycleChoice }),
    [choice, resolved, setChoice, cycleChoice],
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
