import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    label: "Entity",
    lines: [
      { text: "SIMNETIQ LTD", strong: true },
      { text: "No. 16861177" },
      { text: "England & Wales" },
    ],
  },
  {
    label: "Operations",
    lines: [
      { text: "LONDON · UK", strong: true },
      { text: "2 Frederick Street" },
      { text: "Kings Cross, WC1X 0ND" },
    ],
  },
  {
    label: "Transmission",
    lines: [
      { text: "support@simnetiq.store", strong: true },
      { text: "Technical studio" },
      { text: "Mon–Fri · 09:00–18:00 BST" },
    ],
  },
];

const social = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/simnetiq/",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/romanpochtman/",
  },
];

const legalLinks = [
  { href: "/legal", label: "Legal" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/delete-account", label: "Data Deletion" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-16 pb-10">
        {/* Top: identity block + metadata columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Simnetiq"
                width={109}
                height={107}
                className="h-5 w-auto"
              />
              <span className="text-label text-white">SIMNETIQ</span>
            </div>
            <p className="text-display mt-8" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              PRECISION
              <br />
              ENGINEERING
            </p>
            <p className="text-body mt-6 max-w-md">
              A London-based technology studio building high-integrity software for
              web, mobile, VPN infrastructure, and AI systems.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {columns.map((col) => (
              <div key={col.label}>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ {col.label}
                </p>
                <div className="space-y-1.5">
                  {col.lines.map((line, i) => (
                    <p
                      key={i}
                      className={
                        line.strong
                          ? "text-body-strong text-[var(--color-text)]"
                          : "text-body"
                      }
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom rail */}
        <div className="mt-14 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <p className="text-mono">
            © {year} SIMNETIQ LTD · ALL SYSTEMS RESERVED
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-label-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <span className="h-3 w-px bg-[var(--color-border-strong)] hidden md:block" />
            {social.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary-glow)] transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
