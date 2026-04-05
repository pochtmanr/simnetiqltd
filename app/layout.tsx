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
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
