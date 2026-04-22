import type { Metadata } from "next";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Delete Account — Simnetiq Data Deletion Request",
  description:
    "Request permanent account and data deletion from Simnetiq services, including the Simnetiq eSIM app. GDPR-compliant deletion flow, App Store and Google Play policy compliant. Processed within 30 days.",
  keywords: [
    "Simnetiq delete account",
    "Simnetiq data deletion",
    "Simnetiq eSIM delete account",
    "account deletion request",
    "GDPR data deletion",
    "App Store data deletion compliance",
    "Google Play data deletion compliance",
  ],
  alternates: {
    canonical: `${SITE_URL}/delete-account`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Delete Account — Simnetiq",
    description:
      "Request permanent account and data deletion from Simnetiq services. GDPR compliant, processed within 30 days.",
    url: `${SITE_URL}/delete-account`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
};

export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
