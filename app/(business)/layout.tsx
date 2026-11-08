import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { ThemeInitScript } from "@/components/theme-init-script";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

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
    // ThemeInitScript runs first for /admin and /login; /tg themeBoot overrides afterward.
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-bg font-sans text-text antialiased">
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
