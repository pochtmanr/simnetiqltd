"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { SectionFrame } from "@/components/section-frame";
import { OfferedServicesSection } from "@/components/sections/offered-services-section";
import { WhyUsSection } from "@/components/sections/why-us-section";
import { RecentWorkSection } from "@/components/sections/recent-work-section";
import { HeroChartProof, type ChartProofCopy } from "@/components/hero-chart-proof";
import { GoogleMeetIcon } from "@/components/google-meet-icon";
import { HeroGraph } from "@/components/hero-graph";
import { HeroNavSentinel } from "@/components/hero-nav-sentinel";
import { ContactFigure } from "@/components/contact-figure";
import { BookingCta } from "@/components/booking-cta";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

import landingStyles from "./sections/landing-sections.module.css";
import contactStyles from "./contact-section.module.css";

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
    accolade: ChartProofCopy;
  };
  projects: {
    eyebrow: string;
    title: string;
    body: string;
    stack: string;
    visit: string;
    caseStudy: string;
    seeAll: string;
    seeLess: string;
    items: Record<
      | "argus"
      | "physics"
      | "doppler"
      | "creator"
      | "delivery"
      | "greenflagged"
      | "smscode"
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
    bookingClose: string;
    bookingFallback: string;
    formHeading: string;
    formBody: string;
    bookingLoading: string;
    bookingTimezone: string;
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
        body: JSON.stringify({ ...form, locale }),
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
            <a
              href="#contact"
              onClick={() => track("hero_cta_click", { cta: "primary", locale })}
              className="btn-primary"
            >
              <GoogleMeetIcon />
              {dict.hero.ctaPrimary}
            </a>
            <Link
              href={localizePath(locale, "/projects")}
              onClick={() => track("hero_cta_click", { cta: "secondary", locale })}
              className="btn-secondary"
            >
              {dict.hero.ctaSecondary}
              <svg className="hero-field__work-arrow rtl-mirror" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>
            </Link>
          </div>

          <HeroChartProof copy={dict.hero.accolade} />
        </div>

        <HeroGraph />

        <HeroNavSentinel />
      </section>

      {/* OFFERED SERVICES — moved BEFORE recent work */}
      <SectionFrame noTop id="services" className="scroll-mt-24">
        <OfferedServicesSection
          locale={locale}
          dict={{ capabilities: dict.capabilities }}
        />
      </SectionFrame>

      {/* WHY WORK WITH US */}
      <SectionFrame noTop id="why" className="scroll-mt-24">
        <WhyUsSection locale={locale} dict={{ whyUs: dict.whyUs }} />
      </SectionFrame>

      {/* RECENT WORK */}
      <SectionFrame noTop id="projects" className="scroll-mt-24">
        <RecentWorkSection locale={locale} dict={{ projects: dict.projects }} />
      </SectionFrame>

      {/* CONTACT */}
      <SectionFrame
        noTop
        as={motion.section}
        id="contact"
        className={`scroll-mt-24 ${contactStyles.contrast}`}
        onViewportEnter={() => track("contact_section_view", { locale })}
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        <div className={contactStyles.section}>
          <div className={contactStyles.intro}>
            <div>
              <h2 className={`${landingStyles.sectionTitle} ${contactStyles.title}`}>{dict.contact.title}</h2>
              <p className={landingStyles.sectionDescription}>{dict.contact.body}</p>
            </div>
            <ContactFigure />
          </div>
          <div className={contactStyles.columns}>
            <div className={contactStyles.bookingColumn}>
              <BookingCta
                locale={locale}
                label={dict.contact.bookingCta}
                heading={dict.contact.bookingHeading}
                description={dict.contact.bookingSubtitle}
                note={dict.contact.bookingFooter}
                meta={dict.contact.bookingRail}
                closeLabel={dict.contact.bookingClose}
                fallbackLabel={dict.contact.bookingFallback}
                loadingLabel={dict.contact.bookingLoading}
                timezoneLabel={dict.contact.bookingTimezone}
              />
            </div>
            <div id="contact-message-form" className={contactStyles.messageColumn}>
              <h3 className={contactStyles.subheading}>{dict.contact.formHeading}</h3>
              <p className={contactStyles.formBody}>{dict.contact.formBody}</p>
              <form onSubmit={handleSubmit} className={contactStyles.form} aria-busy={status === "sending"}>
                <div>
                  <label htmlFor="contact-name" className={contactStyles.label}>
                    {dict.contact.name}
                  </label>
                  <input
                    id="contact-name"
                    autoComplete="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className={contactStyles.input}
                    placeholder={dict.contact.namePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={contactStyles.label}>
                    {dict.contact.emailLabel}
                  </label>
                  <input
                    id="contact-email"
                    autoComplete="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={contactStyles.input}
                    placeholder={dict.contact.emailPlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className={contactStyles.label}>
                    {dict.contact.message}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className={contactStyles.input}
                    placeholder={dict.contact.messagePlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={`btn-secondary ${contactStyles.submit}`}
                >
                  {status === "sending"
                    ? dict.contact.sending
                    : dict.contact.submit}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>
                </button>
                {status === "sent" && (
                  <p role="status" className={contactStyles.feedback}>
                    {dict.contact.successMessage}
                  </p>
                )}
                {status === "error" && (
                  <p role="alert" className={contactStyles.feedback}>
                    {dict.contact.errorMessage}
                  </p>
                )}
              </form>
              <a className={contactStyles.emailLink} href="mailto:support@simnetiq.com" dir="ltr">
                support@simnetiq.com
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>
              </a>
            </div>
          </div>
        </div>
      </SectionFrame>
    </>
  );
}
