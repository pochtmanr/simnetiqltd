import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { BreadcrumbSchema } from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Doppler VPN — Case Study",
  description:
    "Doppler VPN is a censorship-resistant VPN built on VLESS-Reality. Traffic is indistinguishable from normal HTTPS, defeats deep packet inspection, TSPU, and active probing. No registration, no logs, native apps on iOS, Android, macOS, and Windows. Pay with card or crypto.",
  alternates: { canonical: `${SITE_URL}/projects/doppler-vpn` },
  openGraph: {
    title: "Doppler VPN — Case Study",
    description:
      "Censorship-resistant VPN built on VLESS-Reality. Undetectable by DPI, zero-log, no registration — iOS, Android, macOS, Windows.",
    url: `${SITE_URL}/projects/doppler-vpn`,
    siteName: "Simnetiq",
    type: "article",
    locale: "en_GB",
    images: [{ url: "/doppler-header.avif", alt: "Doppler VPN — hero visual" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doppler VPN — Case Study",
    description:
      "VLESS-Reality VPN that works where other VPNs get blocked. Zero registration, zero logs.",
    images: ["/doppler-header.avif"],
  },
};

const specs = [
  { label: "Status", value: "Launched · Live" },
  { label: "Deployed", value: "2025" },
  { label: "Protocol", value: "VLESS · Reality" },
  { label: "Infrastructure", value: "Marzban · self-hosted" },
  { label: "Regions", value: "Five · Global" },
  { label: "Devices", value: "Up to 10" },
  { label: "Logs", value: "None · by design" },
];

const insideItems = [
  {
    figure: "TLS",
    label: "DPI bypass",
    body: "VLESS-Reality performs a genuine TLS handshake against a real site certificate. Deep packet inspection sees ordinary HTTPS, not a VPN tunnel — nothing to classify, nothing to block.",
  },
  {
    figure: "ID-0",
    label: "No registration",
    body: "The device is the account. No email, no phone number, no personal information. A subscription key unlocks connectivity — accounts we never create can't be breached, subpoenaed, or leaked.",
  },
  {
    figure: "RT",
    label: "Smart routing",
    body: "Traffic is routed by destination, not by server list. The client picks the fastest healthy path automatically — no manual server hopping, no stale hops when a region is under load.",
  },
  {
    figure: "DNS",
    label: "Encrypted DNS",
    body: "Every query is encrypted end-to-end and discarded after resolution. Tracker and malware domains are filtered at the DNS layer across every app on the device, not just the browser.",
  },
];

const infrastructure = [
  {
    id: "I-01",
    label: "Protocol",
    title: "VLESS-Reality",
    body: "XTLS-Reality over VLESS. Zero TLS fingerprint, genuine certificate from a third-party front site, resistant to active probing.",
  },
  {
    id: "I-02",
    label: "Control plane",
    title: "Marzban",
    body: "Self-hosted Marzban orchestrates inbound nodes, subscription issuance, and key rotation across every region — no third-party SaaS in the auth path.",
  },
  {
    id: "I-03",
    label: "Edge",
    title: "Frankfurt · Paris · Moscow · Tokyo · Tel Aviv",
    body: "Five geo-distributed inbound nodes running the same dual-protocol stack. Failover is automatic; smart routing selects the lowest-latency healthy hop for each destination.",
  },
  {
    id: "I-04",
    label: "Data policy",
    title: "Zero-log architecture",
    body: "No browsing logs. No IP logs. No DNS query storage. No account database. Privacy isn't policy text — it's what the system is physically able to store.",
  },
  {
    id: "I-05",
    label: "Obfuscation",
    title: "Anti-TSPU · Anti-DPI",
    body: "Defeats TSPU, TLS fingerprinting, and active probing — the stack used by Russia, China, and Iran to block commercial VPNs. Domain on Roskomnadzor blocklist; service still operational via Telegram bot.",
  },
  {
    id: "I-06",
    label: "Billing",
    title: "Card · Crypto · Stores",
    body: "Pay through the App Store, Google Play, web checkout, or with BTC, ETH, USDT and USDC. One subscription, up to ten devices, no auto-renewal.",
  },
];

const platforms = [
  { id: "01", name: "iOS" },
  { id: "02", name: "Android" },
  { id: "03", name: "macOS" },
  { id: "04", name: "Windows" },
];

// Doppler VPN design system — referenced on this Simnetiq page as case-study content.
// Palette values come from Doppler's token system (dark mode defaults).
const dopplerPalette = [
  { name: "Ink", hex: "#141414", role: "Page", onDark: true },
  { name: "Panel", hex: "#1C1C1C", role: "Surface", onDark: true },
  { name: "Elevated", hex: "#242424", role: "Overlay", onDark: true },
  { name: "Bone", hex: "#F5F5F5", role: "Foreground" },
  { name: "Gold", hex: "#E1DECF", role: "Accent" },
  { name: "Teal", hex: "#00ABAB", role: "Primary" },
  { name: "Violet", hex: "#8B7FD9", role: "Pro" },
  { name: "Amber", hex: "#F4C95D", role: "Highlight" },
  { name: "Danger", hex: "#F06763", role: "Destructive" },
  { name: "Muted", hex: "#C5C5C5", role: "Text muted" },
];

export default function DopplerVpnPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Projects", url: `${SITE_URL}/projects` },
          { name: "Doppler VPN", url: `${SITE_URL}/projects/doppler-vpn` },
        ]}
      />

      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[
              "◆ SIMNETIQ / 02 / PROJECTS / DOPPLER-VPN",
              "CASE STUDY",
              "VLESS · REALITY · LIVE",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Privacy · Censorship-resistant · Native
              </p>
              <h1 className="text-display mt-6">
                <span className="block">Works where</span>
                <span className="block text-[var(--color-text-dim)]">
                  other VPNs don&apos;t.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-md">
                Doppler VPN is a censorship-resistant VPN built on{" "}
                <span className="text-body-strong">VLESS-Reality</span>. Your
                traffic looks like ordinary HTTPS — undetectable by deep packet
                inspection. No registration, no logs, no tracking. Native apps
                on iOS, Android, macOS, and Windows.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="https://dopplervpn.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit site
                  <span>↗</span>
                </Link>
                <Link
                  href="https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  App Store
                  <span>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header image + specs */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8">
              <Panel innerClassName="p-2" corners>
                <div className="relative w-full overflow-hidden aspect-[16/9]">
                  <Image
                    src="/doppler-header.avif"
                    alt="Doppler VPN — native apps on iOS, Android, macOS, and Windows"
                    fill
                    priority
                    sizes="(min-width: 1440px) 896px, (min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Panel>
              <div className="mt-4 text-mono text-[var(--color-text-faint)]">
                Fig. 01 · Doppler VPN clients across four platforms
              </div>
            </div>

            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ Specification
                </p>
                {specs.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
                <div className="mt-6 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    Live · Nominal
                  </span>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 01 · About
              </p>
              <h2 className="text-headline">
                <span className="block">A VPN that</span>
                <span className="block text-[var(--color-text-dim)]">
                  stays invisible.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5">
              <p className="text-body">
                Most consumer VPNs were built for a friendlier internet. They
                tunnel with well-known protocols, sign transport layers with
                recognisable fingerprints, and rely on server IPs that blocklists
                catch within days. The moment a network operator wants them gone,
                they&apos;re gone.
              </p>
              <p className="text-body">
                Doppler starts from the opposite constraint: assume the network
                is hostile. Every connection is wrapped in{" "}
                <span className="text-body-strong">VLESS-Reality</span> —
                XTLS-Reality over VLESS — so outbound traffic is
                indistinguishable from a genuine HTTPS session to a legitimate
                website. There is no TLS fingerprint to classify, no handshake
                signature to match, nothing for deep packet inspection to lock
                onto.
              </p>
              <p className="text-body">
                Around the protocol sits a deliberately thin control plane. No
                account database, no email, no phone number — the device itself
                is the identity, and a subscription key unlocks connectivity.
                There is no browsing log, no IP log, no DNS query storage. The
                privacy claim isn&apos;t a policy line; it&apos;s a direct
                consequence of what the infrastructure is built to never store.
              </p>
              <p className="text-body">
                The product ships as native apps on iOS, Android, macOS, and
                Windows, backed by a self-hosted Marzban control plane and
                geo-distributed edge nodes. Subscriptions are payable through
                the App Store, Google Play, web checkout, or with BTC, ETH,
                USDT, and USDC — one plan, up to ten devices, one tap to
                connect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DPI bypass — standout feature callout */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <Panel innerClassName="p-8 lg:p-14 relative overflow-hidden" corners>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-7">
                <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                  § 02 · DPI Bypass · VLESS-Reality
                </p>
                <h2 className="text-headline mb-6">
                  <span className="block">A tunnel that</span>
                  <span className="block text-[var(--color-text-dim)]">
                    looks like nothing.
                  </span>
                </h2>
                <p className="text-body max-w-xl mb-5">
                  VLESS-Reality performs a real TLS handshake with a real
                  website certificate. The edge node borrows its TLS identity
                  from a legitimate third-party site, then muxes authenticated
                  client traffic through the same connection. An observer —
                  censor, ISP, or transit provider — sees a completely normal
                  HTTPS session.
                </p>
                <p className="text-body max-w-xl">
                  Because the signature is genuine, there is no anomaly to
                  detect. Active probes against our servers get a real website
                  back. Only an authenticated client activates the VPN tunnel —
                  which is why Doppler stays online behind TSPU, the GFW, and
                  the same inspection hardware that catches commercial VPNs
                  within hours of launch.
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="border-l border-[var(--color-border)] lg:pl-10">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                    ▸ Operational against
                  </p>
                  <ul className="space-y-3">
                    {[
                      "TSPU hardware deployed across Russian ISPs.",
                      "TLS fingerprinting and JA3/JA4 classifiers.",
                      "Active probing of server IPs by censors.",
                      "Domain-level blocks — reachable via Telegram bot.",
                    ].map((q) => (
                      <li
                        key={q}
                        className="text-body border-l-2 border-[var(--color-primary-glow)] pl-4"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href="https://dopplervpn.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Open Doppler
                      <span>↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      {/* What's inside — four cards */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="mb-10">
            <p className="text-mono text-[var(--color-primary-glow)] mb-6">
              § 03 · What&apos;s inside
            </p>
            <h2 className="text-headline">Four moving parts.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insideItems.map((item, i) => (
              <Panel key={item.label} innerClassName="p-8" corners>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    0{i + 1} · ENTRY
                  </span>
                  <span className="text-label-sm text-[var(--color-primary-glow)]">
                    {item.label.toUpperCase()}
                  </span>
                </div>
                <div
                  className="mb-6"
                  style={{
                    fontSize: "clamp(2.25rem, 3.6vw, 3rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                    color: "var(--color-text)",
                  }}
                >
                  {item.figure}
                </div>
                <p className="text-body">{item.body}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure — swap for Physics's design-system section */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 04 · Infrastructure
              </p>
              <h2 className="text-headline">
                <span className="block">Built to stay</span>
                <span className="block text-[var(--color-text-dim)]">
                  unreachable.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">
                The stack is deliberately small. A self-hosted Marzban control
                plane issues subscriptions and rotates keys. Edge nodes run
                VLESS-Reality behind real third-party certificates. Nothing
                logs. Every layer is picked because it either contributes to
                unobservability or it doesn&apos;t ship.
              </p>
            </div>
          </div>

          <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
            ▸ Stack
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {infrastructure.map((tile) => (
              <Panel key={tile.id} innerClassName="p-6 lg:p-8" corners>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    {tile.id}
                  </span>
                  <span className="text-label-sm text-[var(--color-primary-glow)]">
                    {tile.label.toUpperCase()}
                  </span>
                </div>
                <div
                  className="mb-5"
                  style={{
                    fontFamily:
                      "var(--font-display), var(--font-inter), sans-serif",
                    fontSize: "clamp(1.375rem, 1.8vw, 1.625rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    color: "var(--color-text)",
                  }}
                >
                  {tile.title}
                </div>
                <p className="text-body">{tile.body}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* Design system — Doppler's palette + typography pairing */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 05 · Design system
              </p>
              <h2 className="text-headline">
                <span className="block">Cinematic dark,</span>
                <span className="block text-[var(--color-text-dim)]">
                  measured accents.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">
                Doppler flattens dark mode to a single page ground and lifts
                cards with a graduated surface scale. Teal owns primary
                interaction. Gold is the brand warmth. Violet is reserved for
                the Pro tier. Amber flags freshness and warnings. Every accent
                clears WCAG AA on the page bg.
              </p>
            </div>
          </div>

          {/* Palette swatches */}
          <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
            ▸ Palette
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {dopplerPalette.map((s) => (
              <Panel key={s.hex} innerClassName="p-0 overflow-hidden">
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{ backgroundColor: s.hex }}
                >
                  {s.onDark && (
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-[0.18]"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%)",
                        backgroundSize: "8px 8px",
                      }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="text-label-sm text-[var(--color-text-faint)]">
                    {s.role}
                  </div>
                  <div className="mt-2 text-title">{s.name}</div>
                  <div className="mt-1 text-mono text-[var(--color-text-muted)]">
                    {s.hex}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          {/* Typography pairing */}
          <p className="text-label-sm text-[var(--color-text-faint)] mt-12 mb-4">
            ▸ Typography pairing
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Serif hero */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                01 · Hero
              </div>
              <div
                style={{
                  fontFamily:
                    "var(--font-serif), Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "clamp(2.25rem, 3.6vw, 3rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.02,
                  color: "var(--color-text)",
                }}
              >
                Aa Bb 01
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                Instrument Serif — Transitional serif, italic
              </div>
              <p className="mt-3 text-body">
                Reserved for the landing hero headline on dopplervpn.org.
                Italic, low contrast, oversized — carries all of the brand
                warmth without a logotype.
              </p>
            </Panel>

            {/* Body */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                02 · Body
              </div>
              <div
                style={{
                  fontFamily:
                    "var(--font-display), 'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.25,
                  color: "var(--color-text)",
                }}
              >
                Works where other VPNs get blocked.
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                Space Grotesk — Geometric sans
              </div>
              <p className="mt-3 text-body">
                Default for sections, navigation, UI copy and pricing.
                Weights 400, 500, 600, 700.
              </p>
            </Panel>

            {/* Cyrillic */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                03 · Cyrillic
              </div>
              <div
                style={{
                  fontFamily:
                    "var(--font-rubik), 'Rubik', system-ui, sans-serif",
                  fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.25,
                  color: "var(--color-text)",
                }}
              >
                Работает там, где нет VPN.
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                Rubik — Cyrillic companion
              </div>
              <p className="mt-3 text-body">
                Active on ru and uk locales. Matches Space Grotesk&apos;s metrics
                while shipping a full Cyrillic glyph set.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      {/* Platforms — all live */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 06 · Platforms
              </p>
              <h2 className="text-headline">
                <span className="block">Four clients,</span>
                <span className="block text-[var(--color-text-dim)]">
                  all native.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">
                Native apps on every supported platform — SwiftUI on iOS and
                macOS, Kotlin on Android, a signed Windows client for x64 and
                ARM64. One subscription covers up to ten devices. Status syncs
                across them via a device-bound token, never via an email
                address.
              </p>
            </div>
          </div>

          <Panel innerClassName="p-0" corners>
            <ul>
              {platforms.map((p, i) => (
                <li
                  key={p.id}
                  className={`grid grid-cols-12 items-center gap-4 px-6 lg:px-8 py-5 ${
                    i < platforms.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  }`}
                >
                  <span className="col-span-2 md:col-span-1 text-mono text-[var(--color-text-faint)]">
                    {p.id}
                  </span>
                  <span className="col-span-7 md:col-span-8 text-title">
                    {p.name}
                  </span>
                  <span className="col-span-3 md:col-span-3 flex justify-end items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      LIVE
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <Panel innerClassName="p-8 lg:p-14" corners>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                  ◇ Continue
                </p>
                <h2 className="text-headline">Connect in one tap.</h2>
                <p className="text-body mt-5 max-w-lg">
                  Five regions, four native clients, one subscription up to ten
                  devices. No registration, no logs — start with a three-day
                  free trial on iOS or Android.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="https://dopplervpn.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Visit site
                    <span>↗</span>
                  </Link>
                  <Link
                    href="https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    App Store
                    <span>↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}
