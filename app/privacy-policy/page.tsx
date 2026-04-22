import type { Metadata } from "next";
import { Panel, Rail, SpecRow } from "@/components/panel";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Privacy Policy — Simnetiq Ltd",
  description:
    "Privacy Policy for Simnetiq Ltd and its products including the Simnetiq eSIM app. GDPR-aligned processing, UK ICO oversight, data controller at 2 Frederick Street, Kings Cross, London. Details on data collection, retention, rights, sharing with eSIM and payment processors, cookies, and children's privacy.",
  keywords: [
    "Simnetiq privacy policy",
    "Simnetiq eSIM privacy policy",
    "GDPR privacy policy UK",
    "Simnetiq Ltd data controller",
    "UK ICO privacy policy",
    "eSIM app privacy policy",
    "Simnetiq data retention",
    "Simnetiq data rights",
  ],
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy — Simnetiq Ltd",
    description:
      "GDPR-compliant privacy policy for Simnetiq Ltd and the Simnetiq eSIM application. Full data handling, retention, and user rights.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
};

const blocks = [
  {
    number: "1",
    title: "Data Controller",
    body: "The data controller is Simnetiq Ltd, 2 Frederick Street, Kings Cross, London, WC1X 0ND, United Kingdom. For data protection inquiries, contact support@simnetiq.store.",
  },
  {
    number: "2",
    title: "Data Collection",
    body: "We collect data you voluntarily provide through our contact form (name, email address, message content) and account deletion request form (identity information, optional reason). We may also collect basic analytics data such as page views, browser type, and approximate geographic location through standard web server logs.",
  },
  {
    number: "3",
    title: "Mobile Application Data",
    body: "The Simnetiq eSIM application collects the following data to provide its services: account information (email, name) for authentication; device information necessary for eSIM provisioning; purchase history for order management; and optional push notification tokens. All data is processed in accordance with this policy and stored securely using industry-standard encryption.",
  },
  {
    number: "4",
    title: "Legal Basis (GDPR)",
    body: "Processing of contact form data is based on your consent (Art. 6(1)(a) GDPR) and our legitimate interest in responding to inquiries (Art. 6(1)(f) GDPR). Processing of account and purchase data is necessary for the performance of a contract (Art. 6(1)(b) GDPR). Analytics data processing is based on our legitimate interest in understanding usage patterns.",
  },
  {
    number: "5",
    title: "Data Sharing",
    body: "We do not sell your personal data. We may share data with: eSIM providers for the purpose of activating your connectivity plans; payment processors (Stripe, Apple, Google) to process transactions; and hosting providers (Vercel, Supabase) for infrastructure. All third-party processors are bound by data processing agreements compliant with GDPR.",
  },
  {
    number: "6",
    title: "Data Retention",
    body: "Contact form submissions are retained for the duration necessary to respond to your inquiry, typically no longer than 12 months. Account data is retained for the duration of your account and deleted within 30 days of an account deletion request. Purchase records may be retained for up to 7 years for tax and legal compliance. Web server logs are automatically deleted after 90 days.",
  },
  {
    number: "7",
    title: "Your Rights",
    body: "Under GDPR, you have the right to access, rectification, erasure, restriction of processing, data portability, and objection. To exercise these rights, contact support@simnetiq.store. You may also request account deletion directly through our app or at simnetiq.store/delete-account. You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.",
  },
  {
    number: "8",
    title: "Cookies & Tracking",
    body: "This website and our mobile applications do not use tracking cookies or third-party analytics services. Essential cookies may be used for basic website functionality only.",
  },
  {
    number: "9",
    title: "Children's Privacy",
    body: "Our services are not directed to children under 13. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child under 13, we will delete it promptly.",
  },
  {
    number: "10",
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Your continued use of our services after changes constitutes acceptance of the updated policy.",
  },
  {
    number: "11",
    title: "Contact",
    body: "For any questions or concerns about this Privacy Policy or our data practices, contact us at support@simnetiq.store or write to: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London, WC1X 0ND, United Kingdom.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              "◆ SIMNETIQ / 03.02 / PRIVACY",
              "DATA PROTECTION POLICY",
              "REV · APR 2026",
            ]}
            className="mb-10"
          />
          <p className="text-label text-[var(--color-primary-glow)]">
            ◇ Legal Framework
          </p>
          <h1 className="text-display mt-6 max-w-3xl">Privacy Policy</h1>
          <p className="text-mono mt-6">Last updated: April 2026</p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Meta sidebar */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28 space-y-6">
                <Panel innerClassName="p-5">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                    ▸ Document
                  </p>
                  <SpecRow label="Revision" value="Apr 2026" />
                  <SpecRow label="Protocol" value="1.0.0" />
                  <SpecRow label="Jurisdiction" value="UK · GDPR" />
                  <SpecRow label="Entries" value={String(blocks.length)} />
                </Panel>
                <Panel innerClassName="p-5">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                    ▸ Contact
                  </p>
                  <p className="text-body-strong text-[var(--color-text)]">
                    support@simnetiq.store
                  </p>
                  <p className="text-body mt-2">Simnetiq Ltd</p>
                  <p className="text-body">Kings Cross, London</p>
                </Panel>
              </div>
            </aside>

            {/* Body */}
            <div className="lg:col-span-9">
              <div className="space-y-8 lg:space-y-10 max-w-3xl">
                {blocks.map((b) => (
                  <div key={b.number} className="grid grid-cols-12 gap-4">
                    <div className="col-span-2 sm:col-span-1 text-mono text-[var(--color-text-faint)] pt-1">
                      {b.number}
                    </div>
                    <div className="col-span-10 sm:col-span-11">
                      <h2 className="text-title mb-2">{b.title}</h2>
                      <p className="text-body">{b.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-border)] mt-14 pt-8">
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
