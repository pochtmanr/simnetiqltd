"use client";

import { useState } from "react";

export default function DeleteAccountPage() {
  const [form, setForm] = useState({ identity: "", reason: "" });
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
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
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
        <p className="text-label text-outline mb-6">
          DE-PROVISIONING PROTOCOL
        </p>
        <h1 className="text-display max-w-3xl">SYSTEM EXIT</h1>
        <p className="text-body text-on-surface-variant mt-6 max-w-lg">
          PERMANENT ACCOUNT DISSOLUTION AND CRYPTOGRAPHIC IDENTITY REMOVAL.
        </p>
      </section>

      {/* Warning */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
          <div className="border border-error bg-surface-container p-6 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="text-error text-2xl flex-shrink-0">
                &#9888;
              </div>
              <div>
                <p className="text-label text-error mb-2">
                  FINAL CONFIRMATION REQUIRED
                </p>
                <p className="text-body text-on-surface-variant">
                  This action is permanent and cannot be undone. All data
                  associated with this identity, including project history, VPN
                  configurations, and secure tokens, will be purged from the
                  Simnetiq production environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
            <div>
              <label className="text-label text-outline block mb-2">
                CONFIRM IDENTITY (VPN-XXXX-XXXX-XXXX OR EMAIL)
              </label>
              <input
                type="text"
                required
                value={form.identity}
                onChange={(e) =>
                  setForm({ ...form, identity: e.target.value })
                }
                className="w-full bg-surface-container-highest border-b border-outline px-4 py-3 text-body text-on-surface focus:outline-none focus:border-primary"
                placeholder="VPN-XXXX-XXXX-XXXX or email@example.com"
              />
            </div>
            <div>
              <label className="text-label text-outline block mb-2">
                REASON FOR TERMINATION (OPTIONAL)
              </label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
                className="w-full bg-surface-container-highest border-b border-outline px-4 py-3 text-body text-on-surface focus:outline-none focus:border-primary resize-none"
                placeholder="Optional reason"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary"
              >
                {status === "sending"
                  ? "PROCESSING..."
                  : "EXECUTE DELETION →"}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn-secondary"
              >
                CANCEL PROCESS
              </button>
            </div>
            {status === "sent" && (
              <div className="border border-outline-variant p-4">
                <p className="text-label text-primary">
                  DELETION REQUEST SUBMITTED. YOUR REQUEST WILL BE PROCESSED
                  WITHIN 30 DAYS.
                </p>
              </div>
            )}
            {status === "error" && (
              <p className="text-label text-error">
                PROCESS FAILED. PLEASE RETRY OR CONTACT SUPPORT@SIMNETIQ.STORE.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Status Codes */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
            <p className="text-label text-outline">
              STATUS CODE : 410 GONE
            </p>
            <p className="text-label text-outline">
              RETENTION : 480 : 30D WIPE
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
