"use client";

import { useState } from "react";

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

export function IdentityActions({
  role,
  assurance,
  surface,
  telegramConfigured,
  focus = "session",
  projects = [],
  stepUpUntil = null,
}: {
  role: "owner" | "admin" | "read_only";
  assurance: "aal1" | "aal2";
  surface: "admin" | "tg";
  telegramConfigured: boolean;
  focus?: "session" | "integration";
  projects?: { slug: string; name: string }[];
  stepUpUntil?: number | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [initData, setInitData] = useState("");
  const [provider, setProvider] = useState("");
  const [environment, setEnvironment] = useState("staging");
  const [secretReference, setSecretReference] = useState("");
  const [projectSlug, setProjectSlug] = useState(projects[0]?.slug ?? "");

  async function logout() {
    const headers = await csrfHeader();
    await fetch("/api/business-os/auth/logout", { method: "POST", credentials: "same-origin", headers });
    window.location.assign("/login");
  }

  async function sendCode() {
    setMessage(null);
    setSending(true);
    const headers = await csrfHeader();
    const response = await fetch("/api/business-os/auth/telegram-code/send", {
      method: "POST",
      credentials: "same-origin",
      headers,
    });
    setSending(false);
    if (response.ok) {
      setCodeSent(true);
      setMessage("Code sent. Check Telegram.");
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(
      payload.error === "telegram_not_linked"
        ? "No Telegram account is linked to you yet. Open the Telegram mini app and link it first."
        : payload.error === "telegram_send_failed"
          ? "Telegram did not deliver the code. Open the bot in Telegram, press Start, then try again."
          : payload.error === "rate_limited"
            ? "Too many codes. Wait a few minutes and try again."
            : "The code could not be sent.",
    );
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const headers = await csrfHeader();
    const response = await fetch("/api/business-os/auth/telegram-code/verify", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ code }),
    });
    if (response.ok) {
      window.location.reload();
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(
      payload.error === "code_expired"
        ? "That code has expired. Send a new one."
        : payload.error === "rate_limited"
          ? "Too many attempts. Wait a few minutes and try again."
          : "That code is not right.",
    );
  }

  async function link() {
    setMessage(null);
    const raw = telegramInitData() || initData;
    if (!raw) {
      setMessage("Telegram init data is not available.");
      return;
    }
    const headers = await csrfHeader();
    const response = await fetch("/api/business-os/auth/telegram/link", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ initData: raw }),
    });
    const payload = (await response.json()) as { status?: string; error?: string };
    setMessage(response.ok ? "Telegram identity linked." : (payload.error ?? "Link failed."));
    if (response.ok) window.location.reload();
  }

  async function saveIntegration(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const headers = await csrfHeader();
    const response = await fetch("/api/business-os/integrations", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ projectSlug, provider, environment, secretReference }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Secret reference saved." : (payload.error ?? "Save failed."));
  }

  return (
    <div className="flex flex-col gap-6">
      {focus === "session" ? (
        <>
          <button type="button" onClick={logout} className={surface === "admin" ? "btn-secondary w-fit text-sm" : "min-h-11 w-fit rounded-md border border-border px-3 py-2 text-sm"}>
            Log out
          </button>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Confirm with Telegram</h2>
            {assurance === "aal2" ? (
              <p className="text-sm text-text-dim">
                {stepUpUntil
                  ? `Confirmed with Telegram until ${new Date(stepUpUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                  : "This session is confirmed."}
              </p>
            ) : telegramConfigured ? (
              <>
                <p className="text-sm text-text-dim">Sensitive changes stay locked until you enter the code we send to your Telegram.</p>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="min-h-11 w-fit rounded-md bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {codeSent ? "Send a new code" : "Send code"}
                </button>
                {codeSent ? (
                  <form onSubmit={confirmCode} className="flex gap-2">
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      aria-label="6-digit code"
                      placeholder="123456"
                      className="min-h-11 w-32 rounded-md border border-border bg-surface px-3 font-mono text-base tracking-widest"
                    />
                    <button type="submit" className="min-h-11 rounded-md border border-border px-3 py-2 text-sm">
                      Confirm
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-text-dim">Telegram bot configuration is not set.</p>
            )}
          </section>
          {role === "owner" && surface === "tg" ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium">Link Telegram</h2>
              {telegramConfigured ? (
                <>
                  <textarea
                    value={initData}
                    onChange={(event) => setInitData(event.target.value)}
                    placeholder="Used when the Telegram client does not inject init data"
                    className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 font-mono text-base"
                  />
                  <button type="button" onClick={link} className="min-h-11 w-fit rounded-md bg-primary px-3 py-2 text-sm text-white">
                    Link this Telegram account
                  </button>
                </>
              ) : (
                <p className="text-sm text-text-dim">Telegram bot configuration is not set.</p>
              )}
            </section>
          ) : null}
        </>
      ) : null}
      {focus === "integration" && role === "owner" ? (
        <form onSubmit={saveIntegration} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Integration reference</h2>
          <label className="flex flex-col gap-1 text-sm">
            Project
            <select
              value={projectSlug}
              onChange={(event) => setProjectSlug(event.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
            >
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Provider
            <input
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              required
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Environment
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
            >
              <option value="local">local</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Secret reference
            <input
              value={secretReference}
              onChange={(event) => setSecretReference(event.target.value)}
              placeholder="DOPPLER_EXPORT_KEY"
              required
              className="min-h-11 rounded-md border border-border bg-surface px-3 font-mono text-base"
            />
          </label>
          <button type="submit" className="min-h-11 w-fit rounded-md bg-primary px-3 py-2 text-sm text-white">
            Save reference
          </button>
        </form>
      ) : null}
      {focus === "integration" && role !== "owner" ? (
        <p className="text-sm text-text-dim">Saving a secret reference needs the owner.</p>
      ) : null}
      {message ? <p className="text-sm text-text-dim">{message}</p> : null}
    </div>
  );
}
