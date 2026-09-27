import Link from "next/link";
import styles from "@/components/footer.module.css";
import { ThemeToggle } from "@/components/theme-toggle";
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
    about: string;
    howWeWork: string;
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
  themeLabels,
}: {
  locale: Locale;
  dict: FooterDict;
  themeLabels: { toggle: string; light: string; dark: string };
}) {
  const year = new Date().getFullYear();

  const documents = [
    { text: dict.lines.about, href: "/about" },
    { text: dict.lines.howWeWork, href: "/how-we-work" },
    { text: dict.lines.legal, href: "/legal" },
    { text: dict.lines.privacy, href: "/privacy-policy" },
    { text: dict.lines.deletion, href: "/delete-account" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <p className={styles.tagline}>{dict.tagline}</p>
            <p className={styles.description}>{dict.body}</p>
          </div>
          <a className={styles.email} href="mailto:support@simnetiq.com" aria-label="support@simnetiq.com" dir="ltr">
            <span>support@<br />simnetiq.com</span>
            <Arrow />
          </a>
        </div>

        <div className={styles.directory}>
          <div>
            <h2 className={styles.heading}>{dict.columns.entity}</h2>
            <div className={styles.company}>
              <p>{dict.lines.company}</p>
              <p>{dict.lines.companyNumber}</p>
              <p>{dict.lines.jurisdiction}</p>
            </div>
          </div>
          <nav aria-label={dict.columns.documents}>
            <h2 className={styles.heading}>{dict.columns.documents}</h2>
            <ul className={styles.links}>
              {documents.map((item) => (
                <li key={item.href}>
                  <Link href={localizePath(locale, item.href)}>{item.text}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.contact}>
            <h2 className={styles.heading}>{dict.columns.contact}</h2>
            <div className={styles.company}>
              <p>{dict.lines.studio}</p>
              <p>{dict.lines.hours}</p>
            </div>
            <ul className={styles.socials}>
              {social.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    <SocialIcon name={item.label} />
                    <span>{item.label}</span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link href={localizePath(locale, "/")} className={styles.wordmark} aria-label="Simnetiq" dir="ltr">
          {Array.from("SIMNETIQ").map((letter, index) => <span key={index} aria-hidden="true">{letter}</span>)}
        </Link>

        <div className={styles.baseline}>
          <p>{dict.bottom.replace("{year}", String(year))}</p>
          <ThemeToggle labels={{ generic: themeLabels.toggle, cycleToLight: themeLabels.light, cycleToDark: themeLabels.dark }} />
        </div>
      </div>
    </footer>
  );
}

function Arrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

function SocialIcon({ name }: { name: string }) {
  return name === "Instagram" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.5 9h3v12h-3V9Zm6 0h3v1.6c.8-1.2 2-1.9 3.6-1.9 3.1 0 4.4 1.9 4.4 5.4V21h-3v-6.2c0-2.1-.7-3.1-2.3-3.1-1.7 0-2.7 1.2-2.7 3.2V21h-3V9Z" />
    </svg>
  );
}
