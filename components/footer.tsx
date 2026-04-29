import Link from "next/link";
import { Logo } from "@/components/logo";
import { localizePath, type Locale } from "@/lib/i18n";

type FooterDict = {
  tagline: string;
  body: string;
  columns: {
    entity: string;
    documents: string;
    contact: string;
  };
  lines: {
    company: string;
    companyNumber: string;
    jurisdiction: string;
    legal: string;
    privacy: string;
    deletion: string;
    studio: string;
    hours: string;
  };
  bottom: string;
};

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

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: FooterDict;
}) {
  const year = new Date().getFullYear();

  type FooterLine = { text: string; strong?: boolean; href?: string };
  const columns: { label: string; lines: FooterLine[] }[] = [
    {
      label: dict.columns.entity,
      lines: [
        { text: dict.lines.company, strong: true },
        { text: dict.lines.companyNumber },
        { text: dict.lines.jurisdiction },
      ],
    },
    {
      label: dict.columns.documents,
      lines: [
        { text: dict.lines.legal, href: localizePath(locale, "/legal"), strong: true },
        { text: dict.lines.privacy, href: localizePath(locale, "/privacy-policy") },
        { text: dict.lines.deletion, href: localizePath(locale, "/delete-account") },
      ],
    },
    {
      label: dict.columns.contact,
      lines: [
        { text: "support@simnetiq.store", strong: true },
        { text: dict.lines.studio },
        { text: dict.lines.hours },
      ],
    },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-16 pb-10">
        {/* Top: identity block + metadata columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <Logo className="h-5 w-auto" />
              <span className="text-label text-[var(--color-text)]">SIMNETIQ</span>
            </div>
            <p className="text-display mt-8" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              {dict.tagline}
            </p>
            <p className="text-body mt-6 max-w-md">{dict.body}</p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {columns.map((col) => (
              <div key={col.label}>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ {col.label}
                </p>
                <div className="space-y-1.5">
                  {col.lines.map((line, i) => {
                    if (line.href) {
                      return (
                        <Link
                          key={i}
                          href={line.href}
                          className={
                            line.strong
                              ? "block text-body-strong text-[var(--color-text)] hover:text-[var(--color-primary-glow)] transition-colors"
                              : "block text-body hover:text-[var(--color-primary-glow)] transition-colors"
                          }
                        >
                          {line.text}
                        </Link>
                      );
                    }
                    return (
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
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom rail */}
        <div className="mt-14 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <p className="text-mono">{dict.bottom.replace("{year}", String(year))}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
