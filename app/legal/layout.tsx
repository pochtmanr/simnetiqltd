import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Legal documentation for Simnetiq Ltd. Impressum, Privacy Policy, and Terms of Service.",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
