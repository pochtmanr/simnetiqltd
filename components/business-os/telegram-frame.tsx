"use client";

import { useEffect, type ReactNode } from "react";

type TelegramBackButton = {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  colorScheme?: string;
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
  BackButton?: TelegramBackButton;
};

function webApp(): TelegramWebApp | undefined {
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function paintChrome(app: TelegramWebApp) {
  const scheme = app.colorScheme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", scheme);
  document.documentElement.style.colorScheme = scheme;
  if (!app.isVersionAtLeast?.("6.9")) return;
  requestAnimationFrame(() => {
    const root = document.querySelector(".tg-root");
    if (!root) return;
    const bg = getComputedStyle(root).getPropertyValue("--color-bg").trim();
    if (!bg) return;
    try {
      app.setHeaderColor?.(bg);
      app.setBackgroundColor?.(bg);
    } catch {
      /* older client keeps its own chrome */
    }
  });
}

export function TelegramFrame({ backHref, children }: { backHref: string | null; children: ReactNode }) {
  useEffect(() => {
    const app = webApp();
    if (!app) return;
    app.ready?.();
    app.expand?.();
    const apply = () => paintChrome(app);
    apply();
    app.onEvent?.("themeChanged", apply);
    const button = app.BackButton;
    let detach = () => {};
    if (backHref && button) {
      const goBack = () => {
        window.location.assign(backHref);
      };
      button.show();
      button.onClick(goBack);
      detach = () => button.offClick(goBack);
    } else {
      button?.hide();
    }
    return () => {
      app.offEvent?.("themeChanged", apply);
      detach();
    };
  }, [backHref]);
  return children;
}
