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
}: {
  role: "owner" | "admin" | "read_only";
  assurance: "aal1" | "aal2";
  surface: "admin" | "tg";
  telegramConfigured: boolean;
  focus?: "session" | "integration";
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [initData, setInitData] = useState("");
  const [provider, setProvider] = useState("");
  const [environment, setEnvironment] = useState("staging");
  const [secretReference, setSecretReference] = useState("");
  const [projectSlug, setProjectSlug] = useState("doppler");

  async function logout() {
    const headers = await csrfHeader();
    await fetch("/api/business-os/auth/logout", { method: "POST", credentials: "same-origin", headers });
    window.location.assign("/login");
  }

  async function enroll() {
    setMessage(null);
    const headers = await csrfHeader();
    const response = await fetch("/api/business-os/auth/mfa/enroll", {
      method: "POST",
      credentials: "same-origin",
      headers,
    });
    const payload = (await response.json()) as { factorId?: string; qrCode?: string; secret?: string; error?: string };
    if (!response.ok || !payload.factorId || !payload.qrCode || !payload.secret) {
      setMessage(payload.error === "step_up_required" ? "Step-up required." : "Enrollment failed.");
      return;
    }
    setFactorId(payload.factorId);
    setQrCode(payload.qrCode);
    setSecret(payload.secret);
  }

  async function confirmEnroll() {
    if (!factorId) return;
    const headers = await csrfHeader();
    const challenge = await fetch("/api/business-os/auth/mfa/challenge", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ factorId }),
    });
    const challengePayload = (await challenge.json()) as { challengeId?: string };
    if (!challenge.ok || !challengePayload.challengeId) {
      setMessage("The authenticator challenge failed.");
      return;
    }
    const verified = await fetch("/api/business-os/auth/mfa/verify", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ factorId, challengeId: challengePayload.challengeId, code }),
    });
    if (!verified.ok) {
      setMessage("That code was not accepted.");
      return;
    }
    window.location.reload();
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
          <button type="button" onClick={logout} className="min-h-11 w-fit rounded-md border border-border px-3 py-2 text-sm">
            Log out
          </button>
          {assurance === "aal1" ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium">Authenticator</h2>
              <p className="text-sm text-text-dim">Sensitive changes stay locked until this session is AAL2.</p>
              <button type="button" onClick={enroll} className="min-h-11 w-fit rounded-md bg-primary px-3 py-2 text-sm text-white">
                Set up authenticator
              </button>
              {qrCode ? (
                <img
                  alt="Authenticator QR code"
                  src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
                  className="h-40 w-40 bg-white p-2"
                />
              ) : null}
              {secret ? <p className="font-mono text-xs break-all">{secret}</p> : null}
              {factorId ? (
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
                  />
                  <button type="button" onClick={confirmEnroll} className="min-h-11 rounded-md border border-border px-3 py-2 text-sm">
                    Confirm
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
          {role === "owner" && assurance === "aal2" && surface === "tg" ? (
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
      {focus === "integration" && role === "owner" && assurance === "aal2" ? (
        <form onSubmit={saveIntegration} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Integration reference</h2>
          <label className="flex flex-col gap-1 text-sm">
            Project
            <select
              value={projectSlug}
              onChange={(event) => setProjectSlug(event.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
            >
              <option value="doppler">Doppler</option>
              <option value="smscode">SMS Code</option>
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
      {focus === "integration" && (role !== "owner" || assurance !== "aal2") ? (
        <p className="text-sm text-text-dim">Saving a secret reference needs an owner session at AAL2.</p>
      ) : null}
      {message ? <p className="text-sm text-text-dim">{message}</p> : null}
    </div>
  );
}
