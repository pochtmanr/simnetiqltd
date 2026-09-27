import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { CardArrow } from "@/components/sections/card-arrow";
import styles from "@/components/about-page.module.css";
import { notFound } from "next/navigation";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const ABOUT_KEYWORDS = [
  "About Simnetiq",
  "Simnetiq Ltd company",
  "Simnetiq company number",
  "Simnetiq London office",
  "Simnetiq team",
  "Simnetiq founders",
  "Roman Pochtman",
  "David Zitomirsky",
  "London software studio team",
  "technology studio Kings Cross",
  "England and Wales registered software company",
  "Companies House 16861177",
  "2 Frederick Street Kings Cross",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  return buildLocalizedMetadata({
    locale,
    routeKey: "about",
    path: "/about",
    keywords: ABOUT_KEYWORDS,
    markdownAlternate: true,
  });
}

const PRINCIPLE_IMAGES = ["/why-people.avif", "/why-scope.avif", "/why-ownership.avif", "/why-support.avif"];

type Params = Promise<{ locale: string }>;

export default async function AboutPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const a = dict.about;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: dict.nav.links.home, url: `${SITE_URL}/${locale}` },
          { name: dict.footer.lines.about, url: `${SITE_URL}/${locale}/about` },
        ]}
      />
      <PageHeader title={a.title} description={a.body} />
      <div className={styles.container}>
        <dl className={styles.facts}>
          <div><dt>{a.founded}</dt><dd>2025</dd></div>
          <div><dt>{a.operations}</dt><dd>{a.operationsValue}</dd></div>
        </dl>
      </div>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2>{a.personnel.title}</h2>
          <p className="text-body">{a.personnel.body}</p>
        </div>
        <div className={styles.team}>
          {a.team.map((member) => (
            <article key={member.name} className={styles.member}>
              <p className={styles.role}>{member.role}</p>
              <h3>{member.name}</h3>
              <p className="text-body">{member.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2>{a.principles.title}</h2>
          <p className="text-body">{a.principles.body}</p>
        </div>
        <div className={styles.principles}>
          {a.values.map((value, index) => (
            <article key={value.code} className={styles.principle}>
              <div className={styles.principleImage}>
                <Image src={PRINCIPLE_IMAGES[index]} alt="" fill sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 100vw" />
              </div>
              <h3>{value.title}</h3>
              <p className="text-body">{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.company}>
          <div className={styles.sectionHeader}>
            <h2>{a.registration.title}</h2>
            <p className="text-body">{a.registration.body}</p>
          </div>
          <dl className={styles.details}>
            <div><dt>{a.registration.legalName}</dt><dd>Simnetiq Ltd</dd></div>
            <div><dt>{a.registration.companyNo}</dt><dd>16861177</dd></div>
            <div><dt>{a.registration.jurisdiction}</dt><dd>{a.registration.jurisdictionValue}</dd></div>
            <div><dt>{a.registration.vatStatus}</dt><dd>{a.registration.vatStatusValue}</dd></div>
          </dl>
          <div className={styles.address}>
            <h3>{a.registration.registeredAddress}</h3>
            <address dir="ltr">Simnetiq Ltd<br />2 Frederick Street<br />Kings Cross<br />London, WC1X 0ND<br />United Kingdom</address>
            <Link href="https://maps.google.com/?q=2+Frederick+Street+Kings+Cross+London+WC1X+0ND" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
              {dict.common.viewOnGoogleMaps.replace(/\s*[→↗]\s*$/, "")}<CardArrow external />
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.contact}>
          <h2>{a.cta.title}</h2>
          <div>
            <p className="text-body">{a.cta.body}</p>
            <div className={styles.actions}>
              <Link href={localizePath(locale, "/#contact")} className="btn-primary">{a.cta.contact}<CardArrow /></Link>
              <Link href={localizePath(locale, "/projects")} className="btn-secondary">{a.cta.work}<CardArrow /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
