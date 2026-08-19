"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { SectionFrame } from "@/components/section-frame";
import { OfferedServicesSection } from "@/components/sections/offered-services-section";
import { WhyUsSection } from "@/components/sections/why-us-section";
import { RecentWorkSection } from "@/components/sections/recent-work-section";
import { HeroGraph } from "@/components/hero-graph";
import { HeroNavSentinel } from "@/components/hero-nav-sentinel";
import { ContactDisclosure } from "@/components/contact-disclosure";
import { BookingCta } from "@/components/booking-cta";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type CapKey = "mobile" | "web" | "aiAutomation";

type HomeDict = {
  frame: {
    signal: { number: string; slug: string };
    services: { number: string; slug: string };
    works: { number: string; slug: string };
    contact: { number: string; slug: string };
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    accolade: { label: string; value: string };
  };
  projects: {
    eyebrow: string;
    title: string;
    body: string;
    stack: string;
    visit: string;
    caseStudy: string;
    items: Record<
      | "argus"
      | "physics"
      | "doppler"
      | "creator"
      | "delivery"
      | "greenflagged"
      | "smsactivate"
      | "visapassage",
      { title: string; badge: string; description: string; accolade?: string }
    >;
  };
  capabilities: {
    eyebrow: string;
    title: string;
    body: string;
    subtitle?: string;
    viewService: string;
    items: Record<CapKey, { title: string; text: string }>;
  };
  whyUs: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    items: Record<
      "people" | "scope" | "ownership" | "support",
      { title: string; text: string }
    >;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    directLabel: string;
    email: string;
    location: string;
    location_value: string;
    response: string;
    response_value: string;
    bookingHeading: string;
    bookingSubtitle: string;
    bookingRail: string[];
    bookingFooter: string;
    bookingCta: string;
    formHeading: string;
    name: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    ready: string;
    sending: string;
    submit: string;
    transmitted: string;
    failed: string;
    successMessage: string;
    errorMessage: string;
  };
};

export function HomePageClient({
  locale,
  dict,
}: {
  locale: Locale;
  dict: HomeDict;
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
        track("message_form_submit", { locale });
      } else {
        setStatus("error");
        track("message_form_error", {
          locale,
          reason: `http_${res.status}`,
        });
      }
    } catch (err) {
      setStatus("error");
      const reason = err instanceof Error ? err.name : "network";
      track("message_form_error", { locale, reason });
    }
  }

  return (
    <>
      {/* HERO — composition and seam maths live in app/globals.css .hero-field */}
      <section className="hero-field">
        <div className="hero-field__inner">
          <h1 className="hero-field__title">
            <span className="block">{dict.hero.titleLine1}</span>
            <span className="block">{dict.hero.titleLine2}</span>
          </h1>

          <p className="hero-field__body">{dict.hero.body}</p>

          <div className="hero-field__actions">
            {/* Icons are bare <svg>, not wrapped in a <span>: .btn-primary >
                span:last-child is the site's hover-arrow rule, and a wrapper
                would make the icon slide instead of the arrow. Both glyphs are
                non-directional so they survive the RTL flip unmirrored. */}
            <a
              href="#contact"
              onClick={() => track("hero_cta_click", { cta: "primary", locale })}
              className="btn-primary"
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M8 2.75v4M16 2.75v4M3 10h18M9.4 15.4l1.9 1.9 3.4-3.7" />
              </svg>
              {dict.hero.ctaPrimary}
            </a>
            <Link
              href={localizePath(locale, "/projects")}
              onClick={() => track("hero_cta_click", { cta: "secondary", locale })}
              className="btn-secondary"
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2" />
                <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2" />
                <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2" />
                <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2" />
              </svg>
              {dict.hero.ctaSecondary}
            </Link>
          </div>

          <p className="hero-field__proof">
            <span aria-hidden="true" className="hero-field__proof-mark">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M17.5 13.5c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.02-3.12.94-3.95 2.4-1.69 2.93-.43 7.27 1.21 9.65.81 1.16 1.77 2.46 3.04 2.41 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.18 2.94-2.34.93-1.34 1.31-2.65 1.33-2.72-.03-.01-2.55-.98-2.58-3.93zM15.05 6.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.71-1.16 1.86-1.02 2.95 1.07.08 2.18-.55 2.85-1.35z" />
              </svg>
            </span>
            <span className="sr-only">{dict.hero.accolade.label}: </span>
            {dict.hero.accolade.value}
          </p>
        </div>

        <HeroGraph />

        <HeroNavSentinel />
      </section>

      {/* OFFERED SERVICES — moved BEFORE recent work */}
      <SectionFrame id="services" className="scroll-mt-24">
        <OfferedServicesSection
          locale={locale}
          dict={{ capabilities: dict.capabilities }}
        />
      </SectionFrame>

      {/* WHY WORK WITH US */}
      <SectionFrame id="why" className="scroll-mt-24">
        <WhyUsSection locale={locale} dict={{ whyUs: dict.whyUs }} />
      </SectionFrame>

      {/* RECENT WORK */}
      <SectionFrame id="projects" className="scroll-mt-24">
        <RecentWorkSection locale={locale} dict={{ projects: dict.projects }} />
      </SectionFrame>

      {/* CONTACT */}
      <SectionFrame
        as={motion.section}
        id="contact"
        className="scroll-mt-24"
        onViewportEnter={() => track("contact_section_view", { locale })}
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <h2 className="text-headline">{dict.contact.title}</h2>
                <p className="text-body mt-6 max-w-sm">{dict.contact.body}</p>
                <div className="mt-10">
                  <Panel innerClassName="p-6">
                    <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                      {dict.contact.directLabel}
                    </p>
                    <SpecRow
                      label={dict.contact.email}
                      value="support@simnetiq.store"
                    />
                    <SpecRow
                      label={dict.contact.location}
                      value={dict.contact.location_value}
                    />
                    <SpecRow
                      label={dict.contact.response}
                      value={dict.contact.response_value}
                    />
                  </Panel>
                </div>
              </div>

              {/* Email message form — disclosure pattern. Booking is primary. */}
              <ContactDisclosure
                heading={dict.contact.formHeading}
                locale={locale}
              >
                <Panel innerClassName="p-6 lg:p-8" corners>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                        {dict.contact.name}
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
                        placeholder={dict.contact.namePlaceholder}
                      />
                    </div>
                    <div>
                      <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                        {dict.contact.emailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
                        placeholder={dict.contact.emailPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                        {dict.contact.message}
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors resize-none"
                        placeholder={dict.contact.messagePlaceholder}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-mono text-[var(--color-text-faint)]">
                        {status === "sent"
                          ? dict.contact.transmitted
                          : status === "error"
                          ? dict.contact.failed
                          : dict.contact.ready}
                      </div>
                      <button
                        type="submit"
                        disabled={status === "sending"}
                        className="btn-primary"
                      >
                        {status === "sending"
                          ? dict.contact.sending
                          : dict.contact.submit}
                        {status !== "sending" && <span aria-hidden="true">→</span>}
                      </button>
                    </div>
                    {status === "sent" && (
                      <p className="text-label-sm text-[var(--color-text)]">
                        {dict.contact.successMessage}
                      </p>
                    )}
                    {status === "error" && (
                      <p className="text-label-sm text-[var(--color-error)]">
                        {dict.contact.errorMessage}
                      </p>
                    )}
                  </form>
                </Panel>
              </ContactDisclosure>
            </div>
            <div className="lg:col-span-7">
              <h3 className="text-title mb-2">
                {dict.contact.bookingHeading}
              </h3>
              <p className="text-body mb-4 max-w-md">
                {dict.contact.bookingSubtitle}
              </p>
              <Rail items={dict.contact.bookingRail} className="mb-3" />
              <BookingCta locale={locale} label={dict.contact.bookingCta} />
              <p className="text-mono text-[var(--color-text-faint)] mt-3">
                {dict.contact.bookingFooter}
              </p>
            </div>
          </div>
        </div>
      </SectionFrame>
    </>
  );
}
