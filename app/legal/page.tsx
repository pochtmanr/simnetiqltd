"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "impressum", number: "01", label: "IMPRESSUM" },
  { id: "privacy", number: "02", label: "PRIVACY POLICY" },
  { id: "terms", number: "03", label: "TERMS OF SERVICE" },
];

export default function LegalPage() {
  const [active, setActive] = useState("impressum");

  useEffect(() => {
    function handleScroll() {
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
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
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
        <p className="text-label text-outline mb-6">
          LEGAL FRAMEWORK · REGULATORY COMPLIANCE
        </p>
        <h1 className="text-display max-w-3xl">LEGAL DOCUMENTATION</h1>
      </section>

      {/* Content with sidebar */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar TOC */}
            <nav className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <p className="text-label text-outline mb-4">INDEX</p>
                <div className="flex flex-col gap-3">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`text-label transition-colors duration-[50ms] linear ${
                        active === s.id
                          ? "text-on-surface"
                          : "text-outline hover:text-on-surface"
                      }`}
                    >
                      {s.number} {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            {/* Content */}
            <div className="lg:col-span-3 space-y-16">
              {/* Impressum */}
              <div id="impressum" className="scroll-mt-20">
                <p className="text-label text-primary mb-2">[01]</p>
                <h2 className="text-headline text-on-surface mb-6">
                  IMPRESSUM
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-label text-outline mb-1">ENTITY</p>
                    <p className="text-body text-on-surface">SIMNETIQ LTD</p>
                    <p className="text-body text-on-surface-variant">
                      Engineering &amp; Systems Architecture
                    </p>
                  </div>
                  <div className="border-t border-outline-variant pt-4">
                    <p className="text-label text-outline mb-1">
                      REGISTERED OFFICE
                    </p>
                    <p className="text-body text-on-surface-variant">
                      2 Frederick Street, Kings Cross
                    </p>
                    <p className="text-body text-on-surface-variant">
                      London, WC1X 0ND
                    </p>
                    <p className="text-body text-on-surface-variant">
                      England &amp; Wales
                    </p>
                  </div>
                  <div className="border-t border-outline-variant pt-4">
                    <p className="text-label text-outline mb-1">
                      COMPANY NUMBER
                    </p>
                    <p className="text-body text-on-surface">16861177</p>
                  </div>
                  <div className="border-t border-outline-variant pt-4">
                    <p className="text-label text-outline mb-1">
                      MANAGING DIRECTOR
                    </p>
                    <p className="text-body text-on-surface">Roman Pochtman</p>
                  </div>
                  <div className="border-t border-outline-variant pt-4">
                    <p className="text-label text-outline mb-1">
                      RESPONSIBLE FOR CONTENT
                    </p>
                    <p className="text-body text-on-surface">Roman Pochtman</p>
                  </div>
                  <div className="border-t border-outline-variant pt-4">
                    <p className="text-label text-outline mb-1">CONTACT</p>
                    <p className="text-body text-on-surface">
                      support@simnetiq.store
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Policy */}
              <div
                id="privacy"
                className="border-t border-outline-variant pt-16 scroll-mt-20"
              >
                <p className="text-label text-primary mb-2">[02]</p>
                <h2 className="text-headline text-on-surface mb-6">
                  PRIVACY POLICY
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      1. DATA CONTROLLER
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      The data controller for this website is Simnetiq Ltd, 2
                      Frederick Street, Kings Cross, London, WC1X 0ND, United
                      Kingdom. For data protection inquiries, contact
                      support@simnetiq.store.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      2. DATA COLLECTION
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      We collect data you voluntarily provide through our contact
                      form (name, email address, message content) and account
                      deletion request form (identity information, optional
                      reason). We may also collect basic analytics data such as
                      page views, browser type, and approximate geographic
                      location through standard web server logs.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      3. LEGAL BASIS (GDPR)
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      Processing of contact form data is based on your consent
                      (Art. 6(1)(a) GDPR) and our legitimate interest in
                      responding to inquiries (Art. 6(1)(f) GDPR). Analytics
                      data processing is based on our legitimate interest in
                      understanding website usage patterns.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      4. DATA RETENTION
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      Contact form submissions are retained for the duration
                      necessary to respond to your inquiry, typically no longer
                      than 12 months. Account deletion requests are processed
                      within 30 days and associated data is purged from our
                      systems. Web server logs are automatically deleted after 90
                      days.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      5. YOUR RIGHTS
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      Under GDPR, you have the right to access, rectification,
                      erasure, restriction of processing, data portability, and
                      objection. To exercise these rights, contact
                      support@simnetiq.store. You also have the right to lodge a
                      complaint with the UK Information Commissioner&apos;s
                      Office (ICO) at ico.org.uk.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      6. COOKIES &amp; TRACKING
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      This website does not use tracking cookies or third-party
                      analytics services. Essential cookies may be used for basic
                      website functionality only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms of Service */}
              <div
                id="terms"
                className="border-t border-outline-variant pt-16 scroll-mt-20"
              >
                <p className="text-label text-primary mb-2">[03]</p>
                <h2 className="text-headline text-on-surface mb-6">
                  TERMS OF SERVICE
                </h2>
                <p className="text-label text-outline mb-6">
                  LAST REVISION: APRIL 2026. PROTOCOL 1.0.0
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      SCOPE OF OPERATIONS
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      By accessing the Simnetiq website (simnetiq.store), you
                      agree to these Terms of Service. This website provides
                      information about Simnetiq Ltd and its products. The
                      content is provided &quot;as is&quot; without warranty of
                      any kind, express or implied.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      INTELLECTUAL PROPERTY
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      All content on this website, including text, graphics,
                      logos, design elements, and software, is the intellectual
                      property of Simnetiq Ltd and is protected by applicable
                      copyright and trademark laws. Unauthorized reproduction or
                      distribution is prohibited.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      LIMITATION OF LIABILITY
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      Simnetiq Ltd shall not be liable for any indirect,
                      incidental, special, or consequential damages arising from
                      the use of this website. Our total liability shall not
                      exceed the amount paid by you, if any, for accessing this
                      website.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-label text-on-surface mb-2">
                      GOVERNING LAW
                    </h3>
                    <p className="text-body text-on-surface-variant">
                      These Terms are governed by the laws of England and Wales.
                      Any disputes shall be subject to the exclusive
                      jurisdiction of the courts of England and Wales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-8">
                <p className="text-label text-outline">
                  END OF DOCUMENT · SIMNETIQ LTD &copy;{" "}
                  {new Date().getFullYear()} ALL RIGHTS RESERVED
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
