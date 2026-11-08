"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

async function csrfHeader(): Promise<HeadersInit> {
  const response = await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" });
  const payload = (await response.json().catch(() => null)) as { csrf?: string } | null;
  const fromBody = typeof payload?.csrf === "string" ? payload.csrf : "";
  const raw = document.cookie.split("; ").find((row) => row.startsWith("bos_csrf="));
  const fromCookie = raw ? decodeURIComponent(raw.slice("bos_csrf=".length)) : "";
  const token = fromBody || fromCookie;
  if (!token) throw new Error("csrf_missing");
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
  // The access token lasts an hour; the refresh token lasts 14 days. Try it before asking for a password.
  const [resuming, setResuming] = useState(!telegram);

  useEffect(() => {
    if (telegram) return;
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await fetch("/api/business-os/auth/refresh", { method: "POST", credentials: "same-origin", headers: await csrfHeader() });
        if (refreshed.ok && !cancelled) {
          window.location.assign(nextPath);
          return;
        }
      } catch {
        // Fall through to the form.
      }
      if (!cancelled) setResuming(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [nextPath, telegram]);

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
        const payload = (await login.json().catch(() => ({}))) as { status?: string; factorId?: string; error?: string };
        if (payload.status === "mfa_required" && payload.factorId) {
          setFactorId(payload.factorId);
          return;
        }
        if (!login.ok) {
          if (payload.error === "business_os_unconfigured") setError("Business OS is not configured.");
          else if (payload.error === "invalid_credentials") setError("Email or password is wrong.");
          else if (payload.error === "csrf") setError("Session check failed. Refresh the page and try again.");
          else if (payload.error === "rate_limited") setError("Too many attempts. Wait a moment and try again.");
          else setError("Login failed.");
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
      const challengePayload = (await challenge.json().catch(() => ({}))) as { challengeId?: string };
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
    } catch {
      setError("Could not reach the server. Confirm localhost is running, then try again.");
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

  if (telegram) {
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

  if (resuming) {
    return (
      <div className="bos admin-login">
        <div className="admin-login__panel gradient-shell">
          <div className="shell-inner admin-login__inner">
            <div className="flex items-center gap-3">
              <Logo width={28} height={28} />
              <p className="text-label">Business OS</p>
            </div>
            <p className="text-body text-text-dim" role="status">
              Signing you back in…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bos admin-login">
      <div className="admin-login__panel gradient-shell">
        <form onSubmit={onSubmit} className="shell-inner admin-login__inner">
          <div className="flex items-center gap-3">
            <Logo width={28} height={28} />
            <p className="text-label">Business OS</p>
          </div>
          <h1 className="text-[1.5rem] font-medium tracking-tight text-text">Owner sign-in</h1>
          <p className="text-body text-text-dim">Private owner access for Simnetiq Business OS.</p>
          {factorId ? (
            <label className="flex flex-col gap-1 text-sm">
              Authenticator code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="admin-field"
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
                  className="admin-field"
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
                  className="admin-field"
                />
              </label>
            </>
          )}
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button type="submit" disabled={pending} className="btn-primary mt-1 w-full text-sm">
            {factorId ? "Verify" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
