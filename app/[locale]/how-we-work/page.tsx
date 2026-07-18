import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail } from "@/components/panel";
import { getHowWeWork } from "@/lib/how-we-work";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const HOW_WE_WORK_KEYWORDS = [
  "how software agencies work",
  "what to check before hiring a software agency",
  "questions to ask a development agency",
  "software development engagement model",
  "fixed price software development UK",
  "software development statement of work",
  "work directly with developers",
  "software agency no account manager",
  "who owns the code software agency",
  "software IP ownership UK",
  "avoid vendor lock-in software",
  "software maintenance after launch",
  "post-launch app support UK",
  "London software studio engagement terms",
  "small software studio vs agency",
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
    routeKey: "howWeWork",
    path: "/how-we-work",
    keywords: HOW_WE_WORK_KEYWORDS,
    markdownAlternate: true,
  });
}

type Params = Promise<{ locale: string }>;

export default async function HowWeWorkIndexPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const h = dict.howWeWorkIndex;
  const entries = getHowWeWork(locale);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "How we work", url: `${SITE_URL}/${locale}/how-we-work` },
        ]}
      />

      {/* ============================================================ */}
      {/* HERO BAND                                                     */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              h.rail.index,
              h.rail.principlesIndex,
              h.rail.entries.replace("{count}", String(entries.length)),
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                {h.eyebrow}
              </p>
              <h1 className="text-display mt-6">
                <span className="block">{h.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {h.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 self-end">
              <p className="text-body max-w-sm">{h.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ENTRY LIST                                                    */}
      {/* ============================================================ */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-6">
          {entries.map((entry) => (
            <Link
              key={entry.slug}
              href={localizePath(locale, `/how-we-work/${entry.slug}`)}
              className="block group"
            >
              <Panel innerClassName="p-6 lg:p-10" corners>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                  <div className="lg:col-span-3 flex lg:flex-col justify-between">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      {entry.code}
                    </span>
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {entry.badge}
                    </span>
                  </div>
                  <div className="lg:col-span-6">
                    <h2 className="text-headline mb-3">
                      <span>{entry.title}</span>{" "}
                      <span className="text-[var(--color-text-dim)]">
                        {entry.titleSecondary}
                      </span>
                    </h2>
                    <p className="text-body max-w-lg">{entry.summary}</p>
                  </div>
                  <div className="lg:col-span-3 flex flex-col lg:items-end lg:justify-between gap-3">
                    <div className="flex items-center justify-between lg:justify-end w-full text-mono text-[var(--color-text-faint)]">
                      {h.sectionsCount.replace(
                        "{count}",
                        String(entry.sections.length)
                      )}
                    </div>
                    {/* Mobile: pre-filled, full-width — no hover on touch */}
                    <span className="lg:hidden text-label-sm !text-white flex w-full items-center justify-between gap-1.5 px-3 py-2.5 bg-[var(--color-primary)]">
                      <span>{h.readMore}</span>
                      <span aria-hidden="true" className="rtl-mirror">
                        →
                      </span>
                    </span>
                    {/* Desktop: slide-fill on hover */}
                    <span className="cta-fill text-label-sm self-end hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-[var(--color-text-dim)] transition-colors duration-300 group-hover:text-white">
                      <span>{h.readMore}</span>
                      <span aria-hidden="true" className="rtl-mirror">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
