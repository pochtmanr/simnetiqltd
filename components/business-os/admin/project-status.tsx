"use client";

import { useSyncExternalStore } from "react";
import type { HealthResult } from "@/lib/business-os/projects/health";

const POLL_MS = 60_000;

/* One poller shared by every hub on the page, started by the first subscriber. */
let results: Map<string, HealthResult> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

async function poll() {
  try {
    const response = await fetch("/api/business-os/projects/health", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { results: HealthResult[] };
    results = new Map(body.results.map((result) => [result.url, result]));
    listeners.forEach((listener) => listener());
  } catch {
    // Keep the last known state; the next tick retries.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    void poll();
    timer = setInterval(poll, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function useHealth() {
  return useSyncExternalStore(subscribe, () => results, () => null);
}

function describe(result: HealthResult | undefined) {
  if (!result) return { tone: "pending", text: "checking…" };
  if (!result.up) return { tone: "bad", text: result.status ? `down · ${result.status}` : "down · no answer" };
  return { tone: "ok", text: `up · ${result.ms} ms` };
}

/** Overall dot for a hub header: green when every URL answers. */
export function ProjectLiveDot({ urls }: { urls: string[] }) {
  const health = useHealth();
  const checked = urls.map((url) => health?.get(url));
  const tone = checked.some((result) => !result) ? "pending" : checked.every((result) => result?.up) ? "ok" : "bad";
  const label = tone === "pending" ? "Checking" : tone === "ok" ? "Live" : "Down";
  return (
    <span className="bos-live" data-tone={tone} title={label}>
      <span className="bos-live__dot" aria-hidden />
      <span className="bos-caption">{label}</span>
    </span>
  );
}

/** One tile per checked URL with its status and response time. */
export function ProjectLiveList({ urls }: { urls: string[] }) {
  const health = useHealth();
  return (
    <ul className="bos-hub-links">
      {urls.map((url) => {
        const { tone, text } = describe(health?.get(url));
        const host = new URL(url).hostname;
        return (
          <li key={url}>
            <a className="bos-hub-link" href={url} target="_blank" rel="noopener noreferrer" title={`${host} — ${text}`}>
              <span className="bos-hub-link__title">
                <span className="bos-live" data-tone={tone}>
                  <span className="bos-live__dot" aria-hidden />
                </span>
                <span className="bos-hub-link__label">{host}</span>
              </span>
              <span className="bos-caption">{text}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
