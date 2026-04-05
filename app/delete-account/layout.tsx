import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Account",
  description:
    "Request permanent account deletion from Simnetiq services. App Store compliance.",
};

export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
