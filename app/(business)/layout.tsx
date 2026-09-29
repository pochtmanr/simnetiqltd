import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Business OS",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    // telegram-web-app.js writes data-theme and viewport variables onto <html> before hydration.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
