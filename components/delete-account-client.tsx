"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import styles from "./document-pages.module.css";
import formStyles from "./contact-section.module.css";

export type DeleteAccountDict = {
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

export function DeleteAccountClient({ dict }: { dict: DeleteAccountDict }) {
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
      <PageHeader title={dict.title} description={dict.body} />
      <div className={styles.container}>
        <div className={`${styles.layout} ${styles.accountLayout}`}>
          <div>
            <div className={styles.warning}>
              <h2 className={styles.subheading}>{dict.warningLabel}</h2>
              <p className={styles.body}>{dict.warningBody}</p>
            </div>
            <h2 className={styles.subheading}>{dict.willBeDeletedLabel}</h2>
            <ul className={`${styles.list} ${styles.body}`}>
              {dict.willBeDeletedItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h2 className={styles.label}>{dict.operationLabel}</h2>
            <dl className={styles.facts}>
              <div><dt>{dict.statusCode}</dt><dd>{dict.statusCodeValue}</dd></div>
              <div><dt>{dict.retention}</dt><dd>{dict.retentionValue}</dd></div>
              <div><dt>{dict.scope}</dt><dd>{dict.scopeValue}</dd></div>
              <div><dt>{dict.reversible}</dt><dd>{dict.reversibleValue}</dd></div>
            </dl>
          </div>
          <section className={styles.formPanel} aria-labelledby="deletion-request-title">
            <h2 id="deletion-request-title" className={styles.heading}>{dict.requestLabel}</h2>
            <form onSubmit={handleSubmit} className={styles.form} aria-busy={status === "sending"}>
              <div>
                <label htmlFor="deletion-email" className={styles.formLabel}>{dict.accountEmail}</label>
                <input id="deletion-email" type="email" autoComplete="email" required
                  aria-describedby="deletion-email-hint" value={form.identity}
                  onChange={(e) => setForm({ ...form, identity: e.target.value })}
                  className={formStyles.input} placeholder="your-email@example.com" />
                <p id="deletion-email-hint" className={`${styles.note} ${styles.hint}`}>{dict.accountEmailHint}</p>
              </div>
              <div>
                <label htmlFor="deletion-reason" className={styles.formLabel}>{dict.reasonLabel}</label>
                <textarea id="deletion-reason" rows={4} value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className={formStyles.input} placeholder={dict.reasonPlaceholder} />
              </div>
              <div className={styles.actions}>
                <button type="submit" disabled={status === "sending"} className="btn-primary">
                  {status === "sending" ? dict.processing : dict.submit}
                </button>
                <button type="button" onClick={() => window.history.back()} className="btn-secondary">{dict.cancel}</button>
              </div>
              {status === "sent" && <p role="status" className={styles.note}>{dict.successMessage}</p>}
              {status === "error" && <p role="alert" className={`${styles.note} ${styles.error}`}>{dict.errorMessage}</p>}
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
