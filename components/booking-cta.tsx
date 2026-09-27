"use client";

import dynamic from "next/dynamic";
import { GoogleMeetIcon } from "@/components/google-meet-icon";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./contact-section.module.css";

const BookingPanel = dynamic(
  () => import("@/components/booking-panel").then((m) => m.BookingPanel),
  { ssr: false },
);

type BookingCtaProps = {
  locale: Locale;
  label: string;
  heading: string;
  description: string;
  note: string;
  meta: string[];
  closeLabel: string;
  fallbackLabel: string;
  loadingLabel: string;
  timezoneLabel: string;
};

export function BookingCta({ locale, label, heading, description, note, meta, closeLabel, fallbackLabel, loadingLabel, timezoneLabel }: BookingCtaProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [activated, setActivated] = useState(false);
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? "simnetiq/30min";
  const calOrigin = process.env.NEXT_PUBLIC_CAL_ORIGIN ?? "https://cal.eu";

  return (
    <div>
      <h3 className={styles.bookingTitle}>{heading}</h3>
      <p className={styles.bookingDescription}>{description}</p>
      <div className={styles.bookingMeta}>
        <span className={styles.meetLabel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></svg>
          {meta[0]}
        </span>
        <span aria-hidden="true">·</span>
        <span className={styles.meetLabel}>
          <GoogleMeetIcon />
          {meta[1]}
        </span>
      </div>
      <button className={styles.scheduleButton} type="button" aria-haspopup="dialog" onClick={() => {
        setActivated(true);
        dialog.current?.showModal();
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18m-13 5h3" /></svg>
        {label}
        <span aria-hidden="true">↗</span>
      </button>
      <p className={styles.scheduleNote}>{note}</p>
      <dialog ref={dialog} className={styles.bookingDialog} aria-labelledby="booking-dialog-title" onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close();
        }
      }}>
        <div className={styles.dialogHeader}>
          <h3 id="booking-dialog-title" className={styles.bookingTitle}>{heading}</h3>
          <button type="button" className={styles.closeButton} aria-label={closeLabel} onClick={() => dialog.current?.close()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className={styles.calendar}>
          {activated && <BookingPanel locale={locale} loadingLabel={loadingLabel} timezoneLabel={timezoneLabel} />}
        </div>
        <a className={styles.bookingLink} href={`${calOrigin.replace(/\/$/, "")}/${calLink}`} target="_blank" rel="noopener noreferrer">{fallbackLabel} ↗</a>
      </dialog>
    </div>
  );
}
