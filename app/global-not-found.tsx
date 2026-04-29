import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Panel, Rail, SpecRow } from "@/components/panel";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "404 — Signal Lost · Simnetiq",
  description:
    "The page you requested is not in our archive. Return to Simnetiq or explore our active deployments.",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en-GB"
      dir="ltr"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <main className="flex-1">
          <section className="border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
              <Rail
                items={[
                  "◆ SIMNETIQ / ERR / 404",
                  "SIGNAL LOST",
                  "ROUTE · UNRESOLVED",
                ]}
                className="mb-10"
              />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                  <p className="text-label text-[var(--color-primary-glow)]">
                    ◇ Error / 404 / Not Found
                  </p>
                  <h1 className="text-display mt-6">
                    <span className="block">Signal</span>
                    <span className="block text-[var(--color-text-dim)]">
                      Lost.
                    </span>
                  </h1>
                </div>
                <div className="lg:col-span-5 self-end">
                  <p className="text-body max-w-md">
                    The page you requested is not in our archive. It may have
                    been moved, decommissioned, or never existed. Head back to
                    base or jump directly to an active deployment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
              <Panel innerClassName="p-6 lg:p-10" corners>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-mono text-[var(--color-text-faint)]">
                        00 · RECOVERY
                      </span>
                      <span className="text-label-sm text-[var(--color-primary-glow)]">
                        ERR · 404
                      </span>
                    </div>
                    <h2 className="text-headline mb-5">Return paths</h2>
                    <p className="text-body mb-8 max-w-lg">
                      No trace of this resource. Pick a route below — every
                      link goes to a live page. If you landed here from an old
                      bookmark, the project catalog is the fastest way back.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Link href="/en" className="btn-primary">
                        Return to base
                        <span>→</span>
                      </Link>
                      <Link href="/en/projects" className="btn-secondary">
                        Browse projects
                        <span>↗</span>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="border-l border-[var(--color-border)] lg:pl-10">
                      <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                        ▸ Telemetry
                      </p>
                      <SpecRow label="Status" value="404 · Not Found" />
                      <SpecRow label="Method" value="GET" />
                      <SpecRow label="Route" value="unresolved" />
                      <SpecRow label="Host" value="simnetiq.store" />
                      <div className="mt-6 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                        <span className="text-mono text-[var(--color-primary-glow)]">
                          Signal · Dropped
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
