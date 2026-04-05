import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Simnetiq is a technical design and engineering collective. Functional precision and geometric absolutism.",
};

const team = [
  { role: "Lead Engineer", name: "R. POCHTMAN" },
  { role: "Legal / Contracts", name: "D. ZITOMIRSKY" },
  { role: "Developer / Marketing", name: "D. POLSKOY" },
];

const values = [
  {
    title: "PRECISION",
    text: "Mathematics over aesthetics. Every pixel and line serves a structural purpose.",
  },
  {
    title: "FUNCTION",
    text: "We build instruments, not toys. UI is for control, not decoration.",
  },
  {
    title: "INTEGRITY",
    text: "Direct communication. Transparent architecture. Unwavering quality.",
  },
  {
    title: "LEGACY",
    text: "Rooted in German and Swedish industrial design principles.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
        <p className="text-label text-outline mb-6">MISSION CONTEXT</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <h1 className="text-display max-w-3xl">
              WE BUILD THE KINETIC BLUEPRINT FOR INDUSTRIAL EXCELLENCE.
            </h1>
            <p className="text-body text-on-surface-variant mt-6 max-w-lg">
              Simnetiq is a technical design and engineering collective. We
              reject decorative trends in favor of functional precision and
              geometric absolutism.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="border border-outline-variant p-6">
              <p className="text-display text-on-surface">2019</p>
              <p className="text-label text-outline mt-2">FOUNDED</p>
            </div>
            <div className="border border-outline-variant p-6">
              <p className="text-headline text-on-surface">GERMANY</p>
              <p className="text-label text-outline mt-2">OPERATIONS</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <p className="text-label text-outline mb-4">PERSONNEL</p>
          <h2 className="text-headline text-on-surface mb-8">
            THE ARCHITECTURE TEAM
          </h2>
          <div className="max-w-2xl">
            {team.map((member, i) => (
              <div
                key={member.name}
                className={`flex items-center justify-between py-4 ${
                  i < team.length - 1 ? "border-b border-outline-variant" : ""
                }`}
              >
                <span className="text-body text-on-surface-variant">
                  {member.role}
                </span>
                <span className="text-label text-on-surface">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Geometric placeholder */}
      <section className="bg-surface-container-highest">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="h-64 border border-outline-variant bg-surface-container flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 border-2 border-outline mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 border border-outline-variant rotate-45" />
              </div>
              <p className="text-label text-outline">
                STRUCTURAL FORM · GEOMETRIC IDENTITY
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-outline-variant p-6">
              <p className="text-label text-outline mb-4">
                REGISTRATION DETAILS
              </p>
              <p className="text-body text-on-surface font-medium">
                SIMNETIQ LTD
              </p>
              <p className="text-body text-on-surface-variant mt-2">
                Company Number: 16861177
              </p>
              <p className="text-body text-on-surface-variant">
                2 Frederick Street, Kings Cross
              </p>
              <p className="text-body text-on-surface-variant">
                London, WC1X 0ND
              </p>
              <p className="text-body text-on-surface-variant">
                England &amp; Wales
              </p>
            </div>
            <div className="border border-outline-variant p-6">
              <p className="text-label text-outline mb-4">
                REGISTERED ADDRESS
              </p>
              <p className="text-body text-on-surface font-medium">
                Simnetiq Ltd
              </p>
              <p className="text-body text-on-surface-variant mt-2">
                2 Frederick Street, Kings Cross
              </p>
              <p className="text-body text-on-surface-variant">
                London, WC1X 0ND
              </p>
              <p className="text-body text-on-surface-variant">
                United Kingdom
              </p>
              <Link
                href="https://maps.google.com/?q=2+Frederick+Street+Kings+Cross+London+WC1X+0ND"
                target="_blank"
                rel="noopener noreferrer"
                className="text-label text-primary mt-4 inline-block hover:text-on-surface transition-colors duration-[50ms] linear"
              >
                VIEW ON GOOGLE MAPS &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <p className="text-label text-outline mb-8">
            CERTIFIED ENGINEERING ENTITY
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {values.map((value, i) => (
              <div
                key={value.title}
                className={`p-6 border border-outline-variant ${
                  i > 0 ? "sm:border-l-0" : ""
                } ${i >= 2 ? "sm:border-t-0 lg:border-t" : ""} ${
                  i >= 1 ? "lg:border-t" : ""
                }`}
              >
                <h3 className="text-label text-on-surface mb-3">
                  {value.title}
                </h3>
                <p className="text-body text-on-surface-variant">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
