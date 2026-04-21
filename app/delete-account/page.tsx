"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, Rail, SpecRow } from "@/components/panel";

export default function DeleteAccountPage() {
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
            items={[
              "◆ SIMNETIQ / 04 / EXIT",
              "DE-PROVISIONING PROTOCOL",
              "STATUS 410 · GONE",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Account Lifecycle
              </p>
              <h1 className="text-display mt-6">System exit</h1>
              <p className="text-body mt-6 max-w-lg">
                Permanent account dissolution for Simnetiq eSIM app users.
                Submit the de-provisioning request below. All associated data
                will be purged from production within 30 days.
              </p>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-5">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  ▸ Operation
                </p>
                <SpecRow label="Status code" value="410 · Gone" />
                <SpecRow label="Retention" value="30d wipe" />
                <SpecRow label="Scope" value="All account data" />
                <SpecRow label="Reversible" value="No" />
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
                ◇ Applicable
              </p>
              <h2 className="text-headline mt-5">Products</h2>
              <p className="text-body mt-4 max-w-sm">
                This protocol applies to account holders of the Simnetiq eSIM
                application on iOS and Android.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-primary-glow)] mb-3">
                  ▸ iOS
                </p>
                <p className="text-title mb-1">Simnetiq — Travel eSIM Data</p>
                <p className="text-body mb-6">App Store distribution</p>
                <Link
                  href="https://apps.apple.com/pl/app/simnetiq-travel-esim-data/id6755963262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-label-sm text-[var(--color-text)] hover:text-[var(--color-primary-glow)] transition-colors"
                >
                  Open App Store →
                </Link>
              </Panel>
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-primary-glow)] mb-3">
                  ▸ Android
                </p>
                <p className="text-title mb-1">Simnetiq — Travel eSIM Data</p>
                <p className="text-body mb-6">Google Play distribution</p>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.simnetiq.storeAndroid&hl=gsw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-label-sm text-[var(--color-text)] hover:text-[var(--color-primary-glow)] transition-colors"
                >
                  Open Google Play →
                </Link>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Split: Warning/what-gets-deleted vs Form */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Warning block */}
            <div className="lg:col-span-5 space-y-6">
              <Panel
                className=""
                innerClassName="p-6 lg:p-8 border-t-2 border-[var(--color-error)]"
              >
                <p className="text-label-sm text-[var(--color-error)] mb-3 tracking-[0.2em]">
                  ⚠ Final confirmation required
                </p>
                <p className="text-body">
                  This action is permanent and cannot be undone. All data
                  associated with your account — including eSIM profiles,
                  purchase history, and authentication credentials — will be
                  permanently deleted from the Simnetiq production environment.
                </p>
              </Panel>

              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ What will be deleted
                </p>
                <ul className="space-y-2">
                  {[
                    "Account and authentication data (Google or Apple Sign-In link)",
                    "eSIM profiles and associated carrier data",
                    "Purchase and transaction history",
                    "Usage analytics and preferences",
                  ].map((item) => (
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

            {/* Form */}
            <div className="lg:col-span-7">
              <Panel innerClassName="p-6 lg:p-10" corners>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-6">
                  ▸ De-provisioning request
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      Account email
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
                      Use the email linked to your Google or Apple Sign-In.
                    </p>
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      Reason (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors resize-none"
                      placeholder="Optional feedback"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary"
                    >
                      {status === "sending"
                        ? "Processing…"
                        : "Execute deletion →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="btn-secondary"
                    >
                      Cancel process
                    </button>
                  </div>
                  {status === "sent" && (
                    <div className="border-l-2 border-[var(--color-primary-glow)] pl-4 py-2">
                      <p className="text-label-sm text-[var(--color-primary-glow)]">
                        ▸ Deletion request submitted. Your account and all
                        associated data will be permanently removed within 30
                        days.
                      </p>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="border-l-2 border-[var(--color-error)] pl-4 py-2">
                      <p className="text-label-sm text-[var(--color-error)]">
                        ▸ Process failed. Please retry or contact
                        support@simnetiq.store.
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
