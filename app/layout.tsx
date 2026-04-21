import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "SIMNETIQ — Technology Studio",
    template: "%s — SIMNETIQ",
  },
  description:
    "Precision software engineering. Web development, mobile apps, automation, and VPN infrastructure. Based in London, UK.",
  metadataBase: new URL("https://simnetiq.store"),
  openGraph: {
    title: "SIMNETIQ — Technology Studio",
    description:
      "Precision software engineering. Web development, mobile apps, automation, and VPN infrastructure. Based in London, UK.",
    url: "https://simnetiq.store",
    siteName: "SIMNETIQ",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "105x103", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/favicon.png", sizes: "105x103", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
