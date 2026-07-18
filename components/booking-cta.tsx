"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Panel } from "@/components/panel";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

// Cal's embed.js sets third-party cookies, touches deprecated browser APIs and
// throws its own console errors — three Lighthouse Best Practices failures we
// cannot fix from here, because the code isn't ours. Gating the mount behind a
// click keeps cal.eu off the page until someone actually wants to book, so the
// audits never fire on load. Deferring only the chunk (a bare `dynamic`) is not
// enough: the chunk is requested right after hydration, and the iframe with it.
const BookingPanel = dynamic(
  () =>
    import("@/components/booking-panel").then((m) => ({
      default: m.BookingPanel,
    })),
  {
    ssr: false,
    loading: () => <BookingFrame>{null}</BookingFrame>,
  }
);

// Placeholder and loading state reserve the same height as the mounted embed,
// so swapping placeholder → calendar shifts nothing below it.
function BookingFrame({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="overflow-hidden mx-auto max-w-3xl" innerClassName="p-0">
      <div
        style={{ minHeight: 560 }}
        className="flex flex-col items-center justify-center gap-4 p-8 text-center"
      >
        {children}
      </div>
    </Panel>
  );
}

type BookingCtaProps = {
  locale: Locale;
  label: string;
};

export function BookingCta({ locale, label }: BookingCtaProps) {
  const [open, setOpen] = useState(false);

  if (open) return <BookingPanel locale={locale} />;

  return (
    <BookingFrame>
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          track("booking_widget_opened", { locale });
          setOpen(true);
        }}
      >
        {label}
        <span aria-hidden="true">→</span>
      </button>
    </BookingFrame>
  );
}
