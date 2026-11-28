"use client";

import { useEffect, useState, type ReactNode } from "react";
import { copyText } from "@/lib/business-os/copy-text";
import { Button, cx } from "@/components/business-os/ui/primitives";

type CopyState = "idle" | "copied" | "failed";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <Glyph>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    </Glyph>
  );
}

function CheckIcon() {
  return (
    <Glyph>
      <path d="m5 12 5 5 9-10" />
    </Glyph>
  );
}

function copyTone(state: CopyState): string {
  if (state === "copied") return "text-[var(--bos-ok)]";
  if (state === "failed") return "text-[var(--bos-bad)]";
  return "text-[var(--color-text-dim)]";
}

function liveMessage(state: CopyState): string {
  if (state === "copied") return "Copied";
  if (state === "failed") return "Copy failed";
  return "";
}

/** Copies `value` and only reports success when the clipboard accepted it. */
export function CopyControl({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    const ok = await copyText(value);
    setState(ok ? "copied" : "failed");
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        onClick={copy}
        disabled={!value}
        aria-label={state === "copied" ? "Copied" : label}
        className={cx(copyTone(state))}
      >
        {state === "copied" ? <CheckIcon /> : <ClipboardIcon />}
        <span className="sr-only" aria-live="polite">
          {liveMessage(state)}
        </span>
      </Button>
      {state === "failed" ? <p className="bos-caption max-w-40 text-[var(--bos-warn)]">Select the text and copy by hand.</p> : null}
    </span>
  );
}
