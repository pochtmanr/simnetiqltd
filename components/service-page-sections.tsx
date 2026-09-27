import Image from "next/image";
import Link from "next/link";
import { CardArrow } from "@/components/sections/card-arrow";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import { getServiceFullTitle, type Service } from "@/lib/services";
import styles from "./services.module.css";

const WORK = {
  doppler: { image: "/doppler-header.avif", path: "/projects/doppler-vpn" },
  smscode: { image: "/smscode-header.avif", path: "/projects/sms-code" },
  physics: { image: "/physics-header.avif", path: "/projects/physics-explained" },
  greenflagged: { image: "/greenflagged-header.avif", path: "/projects/green-flagged" },
  visapassage: { image: "/visapassage-header.avif", path: "/projects/visapassage" },
} as const;
const SERVICE_WORK: Record<string, readonly (keyof typeof WORK)[]> = {
  "mobile-desktop": ["doppler", "smscode"],
  "web-platforms": ["physics", "visapassage"],
  "ai-automation": ["greenflagged", "visapassage"],
};

export function ServiceWork({ locale, dict, slug }: { locale: Locale; dict: Dictionary; slug?: string }) {
  const keys = slug ? SERVICE_WORK[slug] : ["doppler", "greenflagged"] as const;
  return <section className={styles.section}>
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <h2 className="text-headline">{dict.serviceDetail.work.title}</h2>
        <p className="text-body">{dict.serviceDetail.work.body}</p>
      </div>
      <div className={styles.workGrid}>
        {keys.map((key) => {
          const project = WORK[key];
          const copy = dict.projects.items[key];
          const href = localizePath(locale, project.path);
          return <article className={styles.workItem} key={key}>
            <Link href={href} className={styles.workImage} aria-label={`${dict.projects.caseStudy}: ${copy.title}`}>
              <Image src={project.image} alt="" fill sizes="(min-width: 1440px) 650px, (min-width: 768px) 45vw, 100vw" />
            </Link>
            <p className={styles.number}>{copy.badge}</p>
            <h3>{copy.title}</h3>
            <p className="text-body">{copy.description}</p>
            <Link href={href} className={styles.textLink}>{dict.serviceDetail.work.viewProject}<CardArrow /></Link>
          </article>;
        })}
      </div>
    </div>
  </section>;
}

export function ServiceContact({ locale, dict, related = [] }: { locale: Locale; dict: Dictionary; related?: Service[] }) {
  const copy = dict.serviceDetail.cta;
  return <section className={styles.cta}>
    <div className={styles.container}>
      <div className={styles.ctaGrid}>
        <h2 className={styles.ctaTitle}>{copy.title}</h2>
        <div>
          <p className={`text-body ${styles.ctaBody}`}>{copy.body}</p>
          <div className={styles.actions}>
            <Link href={localizePath(locale, "/#contact")} className="btn-primary">{copy.sendBrief}<CardArrow /></Link>
            <Link href={localizePath(locale, "/projects")} className="btn-secondary">{copy.viewDeployments}<CardArrow /></Link>
          </div>
        </div>
      </div>
      {related.length > 0 && <nav aria-label={dict.servicesIndex.eyebrow} className={styles.related}>
        {related.map((service) => <Link key={service.slug} className={styles.textLink} href={localizePath(locale, `/services/${service.slug}`)}>{getServiceFullTitle(service)}<CardArrow /></Link>)}
      </nav>}
    </div>
  </section>;
}
