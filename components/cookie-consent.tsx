"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import styles from "@/components/cookie-consent.module.css";
import { OPEN_EVENT, openConsentSettings, readConsent, subscribeConsent, writeConsent } from "@/lib/consent";

type ConsentLabels = {
  label: string;
  body: string;
  privacy: string;
  accept: string;
  decline: string;
};

// "pending" on the server and during hydration, so nothing renders until the
// stored choice is known.
const getServerSnapshot = () => "pending" as const;
const getClientSnapshot = () => readConsent() ?? ("unset" as const);

export function CookieConsent({
  gaId,
  privacyHref,
  labels,
}: {
  gaId: string;
  privacyHref: string;
  labels: ConsentLabels;
}) {
  const choice = useSyncExternalStore(subscribeConsent, getClientSnapshot, getServerSnapshot);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const decide = (value: "granted" | "denied") => {
    setReopened(false);
    writeConsent(value);
  };

  return (
    <>
      {choice === "granted" ? <GoogleAnalytics gaId={gaId} /> : null}
      {choice === "unset" || reopened ? (
        <section className={styles.banner} aria-label={labels.label}>
          <p className={styles.body}>
            {labels.body}{" "}
            <Link href={privacyHref}>{labels.privacy}</Link>
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => decide("denied")}>
              {labels.decline}
            </button>
            <button type="button" className={styles.button} onClick={() => decide("granted")}>
              {labels.accept}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentSettings}>
      {label}
    </button>
  );
}
