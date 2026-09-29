"use client";

import { useEffect, useState } from "react";

async function csrfHeader(): Promise<HeadersInit> {
  await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" });
  const raw = document.cookie.split("; ").find((row) => row.startsWith("bos_csrf="));
  const token = raw ? decodeURIComponent(raw.slice("bos_csrf=".length)) : "";
  return { "content-type": "application/json", "x-business-os-csrf": token };
}

function telegramInitData(): string {
  const telegram = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram;
  return telegram?.WebApp?.initData ?? "";
}

export function LoginForm({ nextPath, telegram = false }: { nextPath: "/admin" | "/tg"; telegram?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [telegramState, setTelegramState] = useState<"checking" | "denied" | "browser">(telegram ? "checking" : "browser");

  useEffect(() => {
    if (!telegram) return;
    let cancelled = false;
    const attempt = async () => {
      for (let i = 0; i < 25; i += 1) {
        const initData = telegramInitData();
        if (!initData) {
          await new Promise((resolve) => setTimeout(resolve, 120));
          continue;
        }
        const headers = await csrfHeader();
        const response = await fetch("/api/business-os/auth/telegram/exchange", {
          method: "POST",
          credentials: "same-origin",
          headers,
          body: JSON.stringify({ initData }),
        });
        if (cancelled) return;
        if (response.ok) {
          window.location.assign(nextPath);
          return;
        }
        setTelegramState("denied");
        return;
      }
      if (!cancelled) setTelegramState("browser");
    };
    void attempt();
    return () => {
      cancelled = true;
    };
  }, [nextPath, telegram]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const headers = await csrfHeader();
      if (!factorId) {
        const refreshed = await fetch("/api/business-os/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          headers,
        });
        if (refreshed.ok) {
          window.location.assign(nextPath);
          return;
        }
        const login = await fetch("/api/business-os/auth/login", {
          method: "POST",
          credentials: "same-origin",
          headers,
          body: JSON.stringify({ email, password }),
        });
        const payload = (await login.json()) as { status?: string; factorId?: string; error?: string };
        if (payload.status === "mfa_required" && payload.factorId) {
          setFactorId(payload.factorId);
          return;
        }
        if (!login.ok) {
          setError(payload.error === "business_os_unconfigured" ? "Business OS is not configured." : "Login failed.");
          return;
        }
        window.location.assign(nextPath);
        return;
      }
      const challenge = await fetch("/api/business-os/auth/mfa/challenge", {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify({ factorId }),
      });
      const challengePayload = (await challenge.json()) as { challengeId?: string };
      if (!challenge.ok || !challengePayload.challengeId) {
        setError("The authenticator challenge failed.");
        return;
      }
      const verified = await fetch("/api/business-os/auth/mfa/verify", {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify({ factorId, challengeId: challengePayload.challengeId, code }),
      });
      if (!verified.ok) {
        setError("That code was not accepted.");
        return;
      }
      window.location.assign(nextPath);
    } finally {
      setPending(false);
    }
  }

  if (telegram && telegramState === "checking") {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-col gap-3 px-6 py-16">
        <h1 className="text-2xl font-medium">Business OS</h1>
        <p className="text-sm text-text-dim">Checking this Telegram account.</p>
      </main>
    );
  }

  if (telegram && telegramState === "denied") {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-col gap-3 px-6 py-16">
        <h1 className="text-2xl font-medium">Business OS</h1>
        <p className="text-sm text-text-dim">This Telegram account cannot open Business OS.</p>
      </main>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-medium">Business OS</h1>
      <p className="text-sm text-text-dim">Owner sign-in. There is no public registration.</p>
      {factorId ? (
        <label className="flex flex-col gap-1 text-sm">
          Authenticator code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className="rounded-md border border-border bg-surface px-3 py-2"
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              className="rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
        </>
      )}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-2 text-sm text-white">
        {factorId ? "Verify" : "Sign in"}
      </button>
    </form>
  );
}
