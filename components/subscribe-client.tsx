"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./document-pages.module.css";
import formStyles from "./contact-section.module.css";

type ConfirmState = "ok" | "already" | "invalid" | "error" | "unsubscribed";
type SubmitState = "idle" | "sending" | "sent" | "error" | "limited";

export function SubscribeClient({
  dict,
  locale,
  initialConfirmState,
}: {
  dict: Dictionary["subscribe"];
  locale: Locale;
  initialConfirmState: ConfirmState | null;
}) {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [confirmation, setConfirmation] = useState(initialConfirmState);
  const confirmed = confirmation === "ok" || confirmation === "already";
  const finished = confirmed || status === "sent";
  const confirmationError = confirmation === "invalid" || confirmation === "error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    if (!form.has("consent")) return;
    setConfirmation(null);
    setStatus("sending");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          website: form.get("website"),
          consent: true,
          locale,
        }),
      });
      if (!response.ok) {
        setStatus(response.status === 429 ? "limited" : "error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <PageHeader title={dict.title} description={dict.body} />
      <div className={styles.container}>
        <div className={`${styles.layout} ${styles.accountLayout}`}>
          <div>
            <h2 className={styles.heading}>{dict.detailsTitle}</h2>
            <p className={styles.body}>{dict.detailsBody}</p>
            <p className={`${styles.note} ${styles.end}`}>{dict.privacyBody}</p>
            <Link className={formStyles.emailLink} href={localizePath(locale, "/privacy-policy")}>
              {dict.privacyLink}
            </Link>
          </div>
          <section className={styles.formPanel} aria-labelledby="subscribe-form-title">
            <h2 id="subscribe-form-title" className={styles.heading}>
              {finished ? dict.statusTitle : dict.formTitle}
            </h2>
            {confirmation && (
              <p role={confirmationError ? "alert" : "status"}
                className={`${styles.body} ${confirmationError ? styles.error : ""}`}>
                {dict.confirmation[confirmation]}
              </p>
            )}
            {status === "sent" && <p role="status" className={styles.body}>{dict.sentMessage}</p>}
            {!finished && (
              <form onSubmit={handleSubmit} className={`${styles.form} ${confirmation ? styles.end : ""}`}
                aria-busy={status === "sending"}>
                <div>
                  <label htmlFor="subscribe-name" className={styles.formLabel}>{dict.nameLabel}</label>
                  <input id="subscribe-name" name="name" type="text" autoComplete="name"
                    maxLength={120} disabled={status === "sending"} className={formStyles.input} />
                </div>
                <div>
                  <label htmlFor="subscribe-email" className={styles.formLabel}>{dict.emailLabel}</label>
                  <input id="subscribe-email" name="email" type="email" autoComplete="email"
                    required maxLength={254} dir="ltr" disabled={status === "sending"}
                    className={formStyles.input} aria-describedby="subscribe-email-hint" />
                  <p id="subscribe-email-hint" className={`${styles.note} ${styles.hint}`}>{dict.emailHint}</p>
                </div>
                <div hidden aria-hidden="true">
                  <label htmlFor="subscribe-website">Website</label>
                  <input id="subscribe-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed">
                  <input name="consent" type="checkbox" required disabled={status === "sending"}
                    className="mt-1 h-5 w-5 shrink-0 accent-current" />
                  <span>{dict.consent}</span>
                </label>
                <button type="submit" disabled={status === "sending"} className="btn-primary">
                  {status === "sending" ? dict.processing : dict.submit}
                </button>
                {(status === "error" || status === "limited") && (
                  <p role="alert" className={`${styles.note} ${styles.error}`}>
                    {status === "limited" ? dict.rateLimitMessage : dict.errorMessage}
                  </p>
                )}
              </form>
            )}
            {finished && (
              <Link href={localizePath(locale, "/")} className={`btn-secondary ${styles.end}`}>
                {dict.backHome}
              </Link>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
