import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Simnetiq",
  description:
    "Privacy Policy for Simnetiq Ltd and its products including the Simnetiq eSIM app.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
        <p className="text-label text-outline mb-6">
          LEGAL FRAMEWORK · DATA PROTECTION
        </p>
        <h1 className="text-display max-w-3xl">PRIVACY POLICY</h1>
        <p className="text-label text-outline mt-4">
          LAST UPDATED: APRIL 2026
        </p>
      </section>

      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="max-w-3xl space-y-8">
            <div>
              <h2 className="text-label text-on-surface mb-2">
                1. DATA CONTROLLER
              </h2>
              <p className="text-body text-on-surface-variant">
                The data controller is Simnetiq Ltd, 2 Frederick Street, Kings
                Cross, London, WC1X 0ND, United Kingdom. For data protection
                inquiries, contact support@simnetiq.store.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                2. DATA COLLECTION
              </h2>
              <p className="text-body text-on-surface-variant">
                We collect data you voluntarily provide through our contact form
                (name, email address, message content) and account deletion
                request form (identity information, optional reason). We may
                also collect basic analytics data such as page views, browser
                type, and approximate geographic location through standard web
                server logs.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                3. MOBILE APPLICATION DATA
              </h2>
              <p className="text-body text-on-surface-variant">
                The Simnetiq eSIM application collects the following data to
                provide its services: account information (email, name) for
                authentication; device information necessary for eSIM
                provisioning; purchase history for order management; and optional
                push notification tokens. All data is processed in accordance
                with this policy and stored securely using industry-standard
                encryption.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                4. LEGAL BASIS (GDPR)
              </h2>
              <p className="text-body text-on-surface-variant">
                Processing of contact form data is based on your consent (Art.
                6(1)(a) GDPR) and our legitimate interest in responding to
                inquiries (Art. 6(1)(f) GDPR). Processing of account and
                purchase data is necessary for the performance of a contract
                (Art. 6(1)(b) GDPR). Analytics data processing is based on our
                legitimate interest in understanding usage patterns.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                5. DATA SHARING
              </h2>
              <p className="text-body text-on-surface-variant">
                We do not sell your personal data. We may share data with: eSIM
                providers for the purpose of activating your connectivity
                plans; payment processors (Stripe, Apple, Google) to process
                transactions; and hosting providers (Vercel, Supabase) for
                infrastructure. All third-party processors are bound by data
                processing agreements compliant with GDPR.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                6. DATA RETENTION
              </h2>
              <p className="text-body text-on-surface-variant">
                Contact form submissions are retained for the duration necessary
                to respond to your inquiry, typically no longer than 12 months.
                Account data is retained for the duration of your account and
                deleted within 30 days of an account deletion request. Purchase
                records may be retained for up to 7 years for tax and legal
                compliance. Web server logs are automatically deleted after 90
                days.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                7. YOUR RIGHTS
              </h2>
              <p className="text-body text-on-surface-variant">
                Under GDPR, you have the right to access, rectification,
                erasure, restriction of processing, data portability, and
                objection. To exercise these rights, contact
                support@simnetiq.store. You may also request account deletion
                directly through our app or at simnetiq.store/delete-account.
                You have the right to lodge a complaint with the UK Information
                Commissioner&apos;s Office (ICO) at ico.org.uk.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                8. COOKIES &amp; TRACKING
              </h2>
              <p className="text-body text-on-surface-variant">
                This website and our mobile applications do not use tracking
                cookies or third-party analytics services. Essential cookies may
                be used for basic website functionality only.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                9. CHILDREN&apos;S PRIVACY
              </h2>
              <p className="text-body text-on-surface-variant">
                Our services are not directed to children under 13. We do not
                knowingly collect personal data from children. If we become
                aware that we have collected data from a child under 13, we will
                delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">
                10. CHANGES TO THIS POLICY
              </h2>
              <p className="text-body text-on-surface-variant">
                We may update this Privacy Policy from time to time. Changes
                will be posted on this page with an updated revision date. Your
                continued use of our services after changes constitutes
                acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-label text-on-surface mb-2">11. CONTACT</h2>
              <p className="text-body text-on-surface-variant">
                For any questions or concerns about this Privacy Policy or our
                data practices, contact us at support@simnetiq.store or write
                to: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London, WC1X
                0ND, United Kingdom.
              </p>
            </div>

            <div className="border-t border-outline-variant pt-8">
              <p className="text-label text-outline">
                END OF DOCUMENT · SIMNETIQ LTD &copy; {new Date().getFullYear()}{" "}
                ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
