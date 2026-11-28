"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircleIcon } from "@/components/business-os/ui/icons";
import { Sheet } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink, Notice } from "@/components/business-os/ui/primitives";

const DEFAULT_LABEL = "Confirm this change";
const POLL_MS = 2000;
const RESEND_SECONDS = 30;

let handler: ((label: string) => Promise<boolean>) | null = null;
let inflight: Promise<boolean> | null = null;

/**
 * Called when a write returns step_up_required. Opens the confirmation dialog and
 * resolves true once this browser is trusted. Parallel asks share one dialog.
 */
export function ensureStepUp(label: string = DEFAULT_LABEL): Promise<boolean> {
  if (!handler) return Promise.resolve(false);
  if (!inflight) {
    inflight = handler(label).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; status: number; payload: Record<string, unknown> }> {
  const csrf = (await (await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" })).json().catch(() => ({}))) as { csrf?: string };
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-business-os-csrf": csrf.csrf ?? "" },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status, payload: (await response.json().catch(() => ({}))) as Record<string, unknown> };
}

function explainSend(error: unknown): string {
  if (error === "telegram_not_linked") return "No Telegram account is linked yet. Open the Business OS bot in Telegram and link it from the mini app first.";
  if (error === "telegram_send_failed") return "Telegram did not deliver the message. Open the bot, press Start, then send again.";
  if (error === "rate_limited") return "Too many requests. Wait a few minutes, then send again.";
  if (error === "telegram_unconfigured") return "Telegram confirmation is not set up on this server.";
  return "The request could not be sent. Check your connection and send again.";
}

type Phase = "sending" | "waiting" | "checking" | "done" | "stopped";

/**
 * Sends an Approve button to the member's Telegram and waits for the tap; the
 * typed code is the fallback. The original request is retried by the caller.
 */
export function StepUpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(DEFAULT_LABEL);
  const [phase, setPhase] = useState<Phase>("sending");
  const [attempt, setAttempt] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    handler = (nextLabel) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setLabel(nextLabel);
        setCode("");
        setProblem(null);
        setRequestId(null);
        setPhase("sending");
        setAttempt((value) => value + 1);
        setOpen(true);
      });
    return () => {
      handler = null;
    };
  }, []);

  function finish(ok: boolean) {
    setOpen(false);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(ok);
  }

  // Send (or resend) the Telegram message.
  useEffect(() => {
    if (!open || attempt === 0) return;
    let cancelled = false;
    void (async () => {
      const sent = await post("/api/business-os/auth/telegram-code/send", { label }).catch(() => null);
      if (cancelled) return;
      if (!sent?.ok || typeof sent.payload.requestId !== "string") {
        setProblem(explainSend(sent?.payload.error));
        setPhase("stopped");
        return;
      }
      setRequestId(sent.payload.requestId);
      setTelegramUrl(typeof sent.payload.telegramUrl === "string" ? sent.payload.telegramUrl : null);
      setWait(RESEND_SECONDS);
      setPhase("waiting");
    })();
    return () => {
      cancelled = true;
    };
    // `label` is fixed for the life of one ask; `attempt` is what triggers a send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attempt]);

  // Wait for the tap in Telegram.
  useEffect(() => {
    if (!open || phase !== "waiting" || !requestId) return;
    const timer = setInterval(async () => {
      const read = await post("/api/business-os/auth/step-up/status", { requestId }).catch(() => null);
      const status = read?.payload.status;
      if (status === "approved") {
        setPhase("done");
      } else if (status === "denied") {
        setProblem("This was blocked from Telegram. Nothing was changed.");
        setPhase("stopped");
      } else if (status === "expired") {
        setProblem("The request expired. Send a new one.");
        setPhase("stopped");
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [open, phase, requestId]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  // Let the confirmation register before the dialog closes and the action continues.
  useEffect(() => {
    if (phase !== "done" || !open) return;
    const timer = setTimeout(() => finish(true), 600);
    return () => clearTimeout(timer);
  }, [phase, open]);

  async function submitCode(value: string) {
    setProblem(null);
    setPhase("checking");
    const checked = await post("/api/business-os/auth/telegram-code/verify", { code: value }).catch(() => null);
    if (checked?.ok) {
      setPhase("done");
      return;
    }
    setCode("");
    setProblem(
      checked?.payload.error === "code_expired"
        ? "That code expired. Send a new one."
        : checked?.payload.error === "rate_limited"
          ? "Too many attempts. Wait a few minutes."
          : "That code is not right. Check the latest message and try again.",
    );
    setPhase(checked?.payload.error === "code_expired" ? "stopped" : "waiting");
  }

  function typed(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, 6);
    setCode(next);
    if (next.length === 6 && phase === "waiting") void submitCode(next);
  }

  function resend() {
    setProblem(null);
    setCode("");
    setRequestId(null);
    setPhase("sending");
    setAttempt((value) => value + 1);
  }

  const busy = phase === "sending" || phase === "checking";

  return (
    <>
      {children}
      <Sheet open={open} onClose={() => finish(false)} title="Confirm it's you" kind="dialog">
        <div className="bos-stepup">
          <p className="bos-stepup__for">
            <span>To continue</span>
            <strong>{label}</strong>
          </p>

          {phase === "done" ? (
            <p className="bos-stepup__state" data-tone="ok" role="status">
              <CheckCircleIcon size={18} />
              Confirmed. This browser is trusted for 30 days.
            </p>
          ) : phase === "stopped" ? null : (
            <p className="bos-stepup__state" role="status">
              <span className="bos-stepup__pulse" aria-hidden />
              {phase === "sending" ? "Sending to Telegram…" : phase === "checking" ? "Checking the code…" : "Waiting for your tap in Telegram…"}
            </p>
          )}

          {problem ? <Notice tone={phase === "stopped" ? "bad" : "warn"}>{problem}</Notice> : null}

          {phase === "waiting" || phase === "checking" ? (
            <>
              <p className="bos-body">
                Tap <strong>Approve</strong> in the message from the Business OS bot. This page continues by itself.
              </p>
              {telegramUrl ? (
                <ButtonLink href={telegramUrl} target="_blank" rel="noopener noreferrer" variant="primary">
                  Open Telegram
                </ButtonLink>
              ) : null}
              <label className="bos-stepup__code">
                <span className="bos-stepup__or">or type the 6-digit code from that message</span>
                <span className="bos-otp" data-filled={code.length}>
                  <input
                    value={code}
                    onChange={(event) => typed(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    aria-label="6-digit code"
                    disabled={busy}
                  />
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} className="bos-otp__cell" data-active={index === Math.min(code.length, 5) ? "" : undefined} aria-hidden>
                      {code[index] ?? ""}
                    </span>
                  ))}
                </span>
              </label>
            </>
          ) : null}

          {phase === "done" ? null : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={phase === "stopped" ? "primary" : "ghost"} onClick={resend} disabled={busy || (phase === "waiting" && wait > 0)}>
                {phase === "waiting" && wait > 0 ? `Send again in ${wait}s` : "Send again"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => finish(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}
