"use client";

import { useEffect, useState } from "react";

type TelegramWebApp = { initData?: string; ready?: () => void; close?: () => void };
type Outcome = "working" | "approved" | "denied" | "gone" | "failed";

const TEXT: Record<Outcome, [string, string]> = {
  working: ["One moment…", "Checking with Business OS."],
  approved: ["Approved", "Go back to your browser. It continues by itself."],
  denied: ["Blocked", "Nothing was changed. If someone else asked for this, change your password."],
  gone: ["This request has expired", "Start the action again in your browser to get a new one."],
  failed: ["That did not work", "Open this from the button in the bot's message and try again."],
};

/** Opened from the Approve / Not me buttons in the bot message. Telegram's signed init data is the proof. */
export function StepUpApprove() {
  const [outcome, setOutcome] = useState<Outcome>("working");

  useEffect(() => {
    const app = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("r");
    const approve = params.get("d") !== "1";
    app?.ready?.();
    let closing: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      if (!requestId || !app?.initData) return setOutcome("failed");
      try {
        const csrf = (await (await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" })).json()) as { csrf?: string };
        const response = await fetch("/api/business-os/auth/step-up/approve", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json", "x-business-os-csrf": csrf.csrf ?? "" },
          body: JSON.stringify({ initData: app.initData, requestId, approve }),
        });
        if (response.status === 410) return setOutcome("gone");
        if (!response.ok) return setOutcome("failed");
        setOutcome(approve ? "approved" : "denied");
        closing = setTimeout(() => app.close?.(), 1500);
      } catch {
        setOutcome("failed");
      }
    })();
    return () => clearTimeout(closing);
  }, []);

  const [title, detail] = TEXT[outcome];
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-2 text-center" aria-live="polite">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-text-dim">{detail}</p>
    </main>
  );
}
