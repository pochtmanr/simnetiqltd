import type { Metadata } from "next";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Legal — Simnetiq Ltd Impressum, Terms & Company Details",
  description:
    "Legal documentation for Simnetiq Ltd — Companies House No. 16861177, registered in England & Wales. Impressum, terms of engagement, company details, registered office at 2 Frederick Street, Kings Cross, London, WC1X 0ND.",
  keywords: [
    "Simnetiq legal",
    "Simnetiq Ltd impressum",
    "Simnetiq terms",
    "Simnetiq company details",
    "Simnetiq Companies House",
    "Simnetiq 16861177",
    "Simnetiq registered office",
    "UK limited company impressum",
    "London software studio impressum",
  ],
  alternates: {
    canonical: `${SITE_URL}/legal`,
  },
  openGraph: {
    title: "Legal — Simnetiq Ltd",
    description:
      "Legal documentation, Impressum, and company details for Simnetiq Ltd (Company No. 16861177).",
    url: `${SITE_URL}/legal`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
