"use client";

import { useEffect, useState } from "react";
import { Panel, Rail, SpecRow } from "@/components/panel";

const sections = [
  { id: "impressum", number: "01", label: "Impressum" },
  { id: "privacy", number: "02", label: "Privacy Policy" },
  { id: "terms", number: "03", label: "Terms of Service" },
];

export default function LegalPage() {
  const [active, setActive] = useState("impressum");

  useEffect(() => {
    function handleScroll() {
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActive(section.id);
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              "◆ SIMNETIQ / 03 / LEGAL",
              "REGULATORY COMPLIANCE",
              "REV · APR 2026",
            ]}
            className="mb-10"
          />
          <p className="text-label text-[var(--color-primary-glow)]">
            ◇ Legal Framework
          </p>
          <h1 className="text-display mt-6 max-w-3xl">
            Legal documentation
          </h1>
        </div>
      </section>

      {/* Split: TOC left, content right */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* TOC sidebar */}
            <nav className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  ▸ Index
                </p>
                <div className="flex flex-col">
                  {sections.map((s) => {
                    const isActive = active === s.id;
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className={`flex items-center justify-between py-3 border-b border-[var(--color-border)] transition-colors ${
                          isActive
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`text-mono ${
                              isActive
                                ? "text-[var(--color-primary-glow)]"
                                : "text-[var(--color-text-faint)]"
                            }`}
                          >
                            {s.number}
                          </span>
                          <span className="text-label-sm">
                            {s.label.toUpperCase()}
                          </span>
                        </span>
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                        )}
                      </a>
                    );
                  })}
                </div>
                <div className="mt-8">
                  <Panel innerClassName="p-5">
                    <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                      ▸ Document
                    </p>
                    <SpecRow label="Revision" value="Apr 2026" />
                    <SpecRow label="Protocol" value="1.0.0" />
                    <SpecRow label="Jurisdiction" value="UK" />
                  </Panel>
                </div>
              </div>
            </nav>

            {/* Content */}
            <div className="lg:col-span-9 space-y-14 lg:space-y-20">
              {/* Impressum */}
              <article id="impressum" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [01]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    Entity disclosure
                  </span>
                </div>
                <h2 className="text-headline mb-8">Impressum</h2>
                <Panel innerClassName="p-6 lg:p-8">
                  <SpecRow label="Entity" value="Simnetiq Ltd" />
                  <SpecRow
                    label="Activity"
                    value="Engineering & Systems Architecture"
                  />
                  <SpecRow
                    label="Registered office"
                    value="2 Frederick Street, Kings Cross, London, WC1X 0ND, England & Wales"
                  />
                  <SpecRow label="Company number" value="16861177" />
                  <SpecRow label="Managing director" value="Roman Pochtman" />
                  <SpecRow
                    label="Responsible for content"
                    value="Roman Pochtman"
                  />
                  <SpecRow label="Contact" value="support@simnetiq.store" />
                </Panel>
              </article>

              {/* Privacy */}
              <article id="privacy" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [02]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    Data protection
                  </span>
                </div>
                <h2 className="text-headline mb-8">Privacy Policy</h2>
                <div className="space-y-8 max-w-3xl">
                  <LegalBlock
                    number="1"
                    title="Data Controller"
                    body="The data controller for this website is Simnetiq Ltd, 2 Frederick Street, Kings Cross, London, WC1X 0ND, United Kingdom. For data protection inquiries, contact support@simnetiq.store."
                  />
                  <LegalBlock
                    number="2"
                    title="Data Collection"
                    body="We collect data you voluntarily provide through our contact form (name, email address, message content) and account deletion request form (identity information, optional reason). We may also collect basic analytics data such as page views, browser type, and approximate geographic location through standard web server logs."
                  />
                  <LegalBlock
                    number="3"
                    title="Legal Basis (GDPR)"
                    body="Processing of contact form data is based on your consent (Art. 6(1)(a) GDPR) and our legitimate interest in responding to inquiries (Art. 6(1)(f) GDPR). Analytics data processing is based on our legitimate interest in understanding website usage patterns."
                  />
                  <LegalBlock
                    number="4"
                    title="Data Retention"
                    body="Contact form submissions are retained for the duration necessary to respond to your inquiry, typically no longer than 12 months. Account deletion requests are processed within 30 days and associated data is purged from our systems. Web server logs are automatically deleted after 90 days."
                  />
                  <LegalBlock
                    number="5"
                    title="Your Rights"
                    body="Under GDPR, you have the right to access, rectification, erasure, restriction of processing, data portability, and objection. To exercise these rights, contact support@simnetiq.store. You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk."
                  />
                  <LegalBlock
                    number="6"
                    title="Cookies & Tracking"
                    body="This website does not use tracking cookies or third-party analytics services. Essential cookies may be used for basic website functionality only."
                  />
                </div>
              </article>

              {/* Terms */}
              <article id="terms" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [03]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    Terms of service
                  </span>
                </div>
                <h2 className="text-headline mb-6">Terms of Service</h2>
                <p className="text-mono mb-8">
                  Last revision: April 2026 · Protocol 1.0.0
                </p>
                <div className="space-y-8 max-w-3xl">
                  <LegalBlock
                    number="1"
                    title="Scope of Operations"
                    body={`By accessing the Simnetiq website (simnetiq.store), you agree to these Terms of Service. This website provides information about Simnetiq Ltd and its products. The content is provided "as is" without warranty of any kind, express or implied.`}
                  />
                  <LegalBlock
                    number="2"
                    title="Intellectual Property"
                    body="All content on this website, including text, graphics, logos, design elements, and software, is the intellectual property of Simnetiq Ltd and is protected by applicable copyright and trademark laws. Unauthorized reproduction or distribution is prohibited."
                  />
                  <LegalBlock
                    number="3"
                    title="Limitation of Liability"
                    body="Simnetiq Ltd shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of this website. Our total liability shall not exceed the amount paid by you, if any, for accessing this website."
                  />
                  <LegalBlock
                    number="4"
                    title="Governing Law"
                    body="These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales."
                  />
                </div>
              </article>

              <div className="border-t border-[var(--color-border)] pt-8">
                <p className="text-mono">
                  END OF DOCUMENT · SIMNETIQ LTD © {new Date().getFullYear()} ·
                  ALL RIGHTS RESERVED
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LegalBlock({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-2 sm:col-span-1 text-mono text-[var(--color-text-faint)] pt-1">
        {number}
      </div>
      <div className="col-span-10 sm:col-span-11">
        <h3 className="text-title mb-2">{title}</h3>
        <p className="text-body">{body}</p>
      </div>
    </div>
  );
}
