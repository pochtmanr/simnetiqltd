import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Rail } from "@/components/panel";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Engineering capabilities offered by Simnetiq: mobile & desktop, growth & marketing, AI integration, and web platforms.",
};

export default function ServicesIndexPage() {
  return (
    <>
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              "◆ SIMNETIQ / 02 / SERVICES",
              "CAPABILITY INDEX",
              `ENTRIES · 0${services.length}`,
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Capabilities
              </p>
              <h1 className="text-display mt-6">
                <span className="block">Engineering</span>
                <span className="block text-[var(--color-text-dim)]">
                  Services
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 self-end">
              <p className="text-body max-w-sm">
                Four capability groups. Each with a defined scope, stack, and
                pricing tier — every engagement scoped against a signed SOW.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-6">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="block group"
            >
              <Panel innerClassName="p-6 lg:p-10" corners>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                  <div className="lg:col-span-3 flex lg:flex-col justify-between">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      {service.code}
                    </span>
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {service.badge}
                    </span>
                  </div>
                  <div className="lg:col-span-6">
                    <h2 className="text-headline mb-3">{service.title}</h2>
                    <p className="text-body max-w-lg">{service.summary}</p>
                  </div>
                  <div className="lg:col-span-3 flex lg:flex-col lg:items-end lg:justify-between gap-3">
                    <div className="text-mono text-[var(--color-text-faint)]">
                      {service.services.length} services
                    </div>
                    <span className="text-label-sm text-[var(--color-text)] group-hover:text-[var(--color-primary-glow)] transition-colors">
                      View brief →
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
