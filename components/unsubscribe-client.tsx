"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./document-pages.module.css";
import formStyles from "./contact-section.module.css";

type Status = "idle" | "sending" | "done" | "error" | "invalid" | "limited";

export function UnsubscribeClient({
  dict,
  locale,
  initialEmail,
  newsletterToken,
  coldToken,
  preStatus,
}: {
  dict: Dictionary["unsubscribe"];
  locale: Locale;
  initialEmail: string;
  newsletterToken: string | null;
  coldToken: string | null;
  preStatus: "done" | "error" | "invalid" | null;
}) {
  const [status, setStatus] = useState<Status>(preStatus ?? "idle");
  const hasToken = Boolean(newsletterToken || coldToken);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    const reason = form.get("reason");
    const requests: { url: string; body: object }[] = [];
    if (coldToken) requests.push({ url: "/api/cold-unsub", body: { token: coldToken, reason } });
    if (newsletterToken || !coldToken) {
      requests.push({
        url: "/api/unsubscribe",
        body: newsletterToken
          ? { token: newsletterToken, reason, locale }
          : { email: form.get("email"), reason, locale },
      });
    }
    // Both endpoints are idempotent, so a partially failed request can be retried.
    const results = await Promise.allSettled(requests.map(({ url, body }) => fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })));
    if (results.every((result) => result.status === "fulfilled" && result.value.ok)) {
      setStatus("done");
    } else if (results.some((result) => result.status === "fulfilled" && result.value.status === 429)) {
      setStatus("limited");
    } else {
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
            <Link className={formStyles.emailLink} href={localizePath(locale, "/privacy-policy")}>
              {dict.privacyLink}
            </Link>
          </div>
          <section className={styles.formPanel} aria-labelledby="unsubscribe-form-title">
            <h2 id="unsubscribe-form-title" className={styles.heading}>
              {status === "done" ? dict.doneTitle : dict.formTitle}
            </h2>
            {status === "done" ? (
              <>
                <p role="status" className={styles.body}>{dict.doneMessage}</p>
                <Link href={localizePath(locale, "/")} className={`btn-secondary ${styles.end}`}>
                  {dict.backHome}
                </Link>
              </>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form} aria-busy={status === "sending"}>
                {hasToken ? <p className={styles.body}>{dict.tokenHint}</p> : (
                  <div>
                    <label htmlFor="unsubscribe-email" className={styles.formLabel}>{dict.emailLabel}</label>
                    <input id="unsubscribe-email" name="email" type="email" autoComplete="email"
                      required maxLength={254} defaultValue={initialEmail} dir="ltr"
                      disabled={status === "sending"} className={formStyles.input}
                      aria-describedby="unsubscribe-email-hint" />
                    <p id="unsubscribe-email-hint" className={`${styles.note} ${styles.hint}`}>{dict.emailHint}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="unsubscribe-reason" className={styles.formLabel}>{dict.reasonLabel}</label>
                  <textarea id="unsubscribe-reason" name="reason" rows={3} maxLength={500}
                    disabled={status === "sending"} className={formStyles.input} />
                </div>
                <div className={styles.actions}>
                  <button type="submit" disabled={status === "sending"} className="btn-primary">
                    {status === "sending" ? dict.processing : dict.submit}
                  </button>
                  <Link href={localizePath(locale, "/")} className="btn-secondary">{dict.cancel}</Link>
                </div>
                {(status === "error" || status === "invalid" || status === "limited") && (
                  <p role="alert" className={`${styles.note} ${styles.error}`}>
                    {status === "limited" ? dict.rateLimitMessage : status === "invalid" ? dict.invalidMessage : dict.errorMessage}
                  </p>
                )}
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
