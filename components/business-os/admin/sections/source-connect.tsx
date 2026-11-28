"use client";

import { useId, useState } from "react";
import { businessPost } from "@/components/business-os/business-post";
import { Button, Field, Input } from "@/components/business-os/ui/primitives";

const EXPLAIN: Record<string, string> = {
  source_secret_missing: "The signing secret for this source is not set on the Business OS server yet.",
  source_unavailable: "The product's export API did not answer. It may still be switched off there.",
  project_mismatch: "That address answered as a different project or environment.",
  dataset_invalid: "The product reported no datasets Business OS can import.",
  step_up_required: "This needs your confirmation in Telegram. Try again and tap Approve.",
  forbidden: "Only the owner can change a data source.",
  invalid_body: "Check the address and the key id.",
};

function explain(payload: Record<string, unknown>): string {
  const code = typeof payload.error === "string" ? payload.error : "";
  return EXPLAIN[code] ?? (code ? code.replaceAll("_", " ") : "The request failed.");
}

/** The first pull covers the last year; after that the sync follows the current month. */
function backfillWindow(): { initialFrom: string; initialTo: string } {
  const to = new Date();
  to.setUTCHours(24, 0, 0, 0);
  const from = new Date(to.getTime() - 365 * 86_400_000);
  const instant = (date: Date) => date.toISOString().replace(".000Z", "Z");
  return { initialFrom: instant(from), initialTo: instant(to) };
}

/**
 * Registers a project's export API as a source and switches it on. With an
 * existing connection it only re-reads what the product offers, because
 * registering again would switch the connection off.
 */
export function SourceConnect({
  projectSlug,
  baseUrl: defaultBaseUrl,
  secretReference,
  connectionId,
}: {
  projectSlug: string;
  baseUrl: string;
  secretReference: string;
  connectionId: string | null;
}) {
  const id = useId();
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [keyId, setKeyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    let target = connectionId;
    if (!target) {
      const registered = await businessPost("/api/business-os/sync/connections", {
        projectSlug,
        environment: "production",
        baseUrl: baseUrl.trim().replace(/\/+$/, ""),
        keyId: keyId.trim(),
        secretReference,
      });
      if (!registered.ok || typeof registered.payload.id !== "string") {
        setError(explain(registered.payload));
        setBusy(false);
        return;
      }
      target = registered.payload.id;
    }
    const enabled = await businessPost("/api/business-os/sync/connections/enable", { connectionId: target, ...backfillWindow() });
    if (!enabled.ok) {
      setError(explain(enabled.payload));
      setBusy(false);
      // A registered but not yet enabled connection now exists; show it.
      if (!connectionId) window.location.reload();
      return;
    }
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {connectionId ? (
        <p className="bos-body">Asks the product which datasets it offers now and switches them on. Nothing already imported is removed.</p>
      ) : (
        <>
          <Field label="Export API address" htmlFor={`${id}-url`} hint="The product's own site. Business OS calls /api/business-os/v1 on it.">
            <Input id={`${id}-url`} type="url" required value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </Field>
          <Field label="Key id" htmlFor={`${id}-key`} hint="The keyId from the product's BOS_EXPORT_KEYS setting. Not the secret itself.">
            <Input id={`${id}-key`} required autoComplete="off" spellCheck={false} className="bos-mono" value={keyId} onChange={(event) => setKeyId(event.target.value)} />
          </Field>
          <p className="bos-caption">
            The secret is read on the server from <span className="bos-mono">{secretReference}</span>.
          </p>
        </>
      )}
      {error ? (
        <p className="bos-field__error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-fit" disabled={busy}>
        {busy ? "Working…" : connectionId ? "Refresh datasets" : "Connect"}
      </Button>
    </form>
  );
}
