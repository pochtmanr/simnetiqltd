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
  themeParams?: { bg_color?: string; text_color?: string; hint_color?: string; secondary_bg_color?: string };
  BackButton?: TelegramBackButton;
};

export function TelegramFrame({ backHref, children }: { backHref: string | null; children: ReactNode }) {
  useEffect(() => {
    let detach = () => {};
    const bind = () => {
      const webApp = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
      if (!webApp) return false;
      detach();
      webApp.ready?.();
      webApp.expand?.();
      const root = document.documentElement;
      const theme = webApp.themeParams;
      if (theme?.bg_color) root.style.setProperty("--color-bg", theme.bg_color);
      if (theme?.text_color) root.style.setProperty("--color-text", theme.text_color);
      if (theme?.hint_color) root.style.setProperty("--color-text-dim", theme.hint_color);
      if (theme?.secondary_bg_color) root.style.setProperty("--color-surface", theme.secondary_bg_color);
      const button = webApp.BackButton;
      if (backHref && button) {
        const goBack = () => {
          window.location.assign(backHref);
        };
        button.show();
        button.onClick(goBack);
        detach = () => button.offClick(goBack);
      } else {
        button?.hide();
        detach = () => {};
      }
      return true;
    };
    if (bind()) return () => detach();
    const timer = window.setInterval(() => {
      if (bind()) window.clearInterval(timer);
    }, 250);
    const stop = window.setTimeout(() => window.clearInterval(timer), 4000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
      detach();
    };
  }, [backHref]);
  return children;
}
