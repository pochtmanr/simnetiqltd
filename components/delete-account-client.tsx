"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, Rail, SpecRow } from "@/components/panel";

export type DeleteAccountDict = {
  rail: { index: string; protocol: string; status: string };
  eyebrow: string;
  title: string;
  body: string;
  operationLabel: string;
  statusCode: string;
  statusCodeValue: string;
  retention: string;
  retentionValue: string;
  scope: string;
  scopeValue: string;
  reversible: string;
  reversibleValue: string;
  applicable: {
    eyebrow: string;
    title: string;
    body: string;
    iosTitle: string;
    iosDistribution: string;
    androidTitle: string;
    androidDistribution: string;
  };
  warningLabel: string;
  warningBody: string;
  willBeDeletedLabel: string;
  willBeDeletedItems: string[];
  requestLabel: string;
  accountEmail: string;
  accountEmailHint: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  submit: string;
  processing: string;
  cancel: string;
  successMessage: string;
  errorMessage: string;
};

export type DeleteAccountCommon = {
  openAppStore: string;
  openGooglePlay: string;
};

export function DeleteAccountClient({
  dict,
  common,
}: {
  dict: DeleteAccountDict;
  common: DeleteAccountCommon;
}) {
  const [form, setForm] = useState({ identity: "", reason: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ identity: "", reason: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[dict.rail.index, dict.rail.protocol, dict.rail.status]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                {dict.eyebrow}
              </p>
              <h1 className="text-display mt-6">{dict.title}</h1>
              <p className="text-body mt-6 max-w-lg">{dict.body}</p>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-5">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  {dict.operationLabel}
                </p>
                <SpecRow label={dict.statusCode} value={dict.statusCodeValue} />
                <SpecRow label={dict.retention} value={dict.retentionValue} />
                <SpecRow label={dict.scope} value={dict.scopeValue} />
                <SpecRow label={dict.reversible} value={dict.reversibleValue} />
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Apps */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {dict.applicable.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{dict.applicable.title}</h2>
              <p className="text-body mt-4 max-w-sm">{dict.applicable.body}</p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-primary-glow)] mb-3">
                  ▸ iOS
                </p>
                <p className="text-title mb-1">{dict.applicable.iosTitle}</p>
                <p className="text-body mb-6">
                  {dict.applicable.iosDistribution}
                </p>
                <Link
                  href="https://apps.apple.com/pl/app/simnetiq-travel-esim-data/id6755963262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-label-sm text-[var(--color-text)] hover:text-[var(--color-primary-glow)] transition-colors"
                >
                  {common.openAppStore} <span>→</span>
                </Link>
              </Panel>
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-primary-glow)] mb-3">
                  ▸ Android
                </p>
                <p className="text-title mb-1">
                  {dict.applicable.androidTitle}
                </p>
                <p className="text-body mb-6">
                  {dict.applicable.androidDistribution}
                </p>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.simnetiq.storeAndroid&hl=gsw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-label-sm text-[var(--color-text)] hover:text-[var(--color-primary-glow)] transition-colors"
                >
                  {common.openGooglePlay} <span>→</span>
                </Link>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Warning vs Form */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5 space-y-6">
              <Panel
                innerClassName="p-6 lg:p-8 border-t-2 border-[var(--color-error)]"
              >
                <p className="text-label-sm text-[var(--color-error)] mb-3 tracking-[0.2em]">
                  {dict.warningLabel}
                </p>
                <p className="text-body">{dict.warningBody}</p>
              </Panel>

              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  {dict.willBeDeletedLabel}
                </p>
                <ul className="space-y-2">
                  {dict.willBeDeletedItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-body"
                    >
                      <span className="mt-[9px] inline-block w-2 h-[1px] bg-[var(--color-text-dim)] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="lg:col-span-7">
              <Panel innerClassName="p-6 lg:p-10" corners>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-6">
                  {dict.requestLabel}
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      {dict.accountEmail}
                    </label>
                    <input
                      type="email"
                      required
                      value={form.identity}
                      onChange={(e) =>
                        setForm({ ...form, identity: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors"
                      placeholder="your-email@example.com"
                    />
                    <p className="text-label-sm text-[var(--color-text-faint)] mt-2">
                      {dict.accountEmailHint}
                    </p>
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      {dict.reasonLabel}
                    </label>
                    <textarea
                      rows={4}
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors resize-none"
                      placeholder={dict.reasonPlaceholder}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary"
                    >
                      {status === "sending" ? dict.processing : dict.submit}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="btn-secondary"
                    >
                      {dict.cancel}
                    </button>
                  </div>
                  {status === "sent" && (
                    <div className="border-l-2 border-[var(--color-primary-glow)] pl-4 py-2">
                      <p className="text-label-sm text-[var(--color-primary-glow)]">
                        {dict.successMessage}
                      </p>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="border-l-2 border-[var(--color-error)] pl-4 py-2">
                      <p className="text-label-sm text-[var(--color-error)]">
                        {dict.errorMessage}
                      </p>
                    </div>
                  )}
                </form>
              </Panel>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
