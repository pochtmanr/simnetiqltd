import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Active deployments. Precision software instruments developed for global scale.",
};

const projectsList = [
  {
    title: "Doppler VPN",
    badge: "VPN · ENC",
    description:
      "Military-grade network obfuscation using custom VLESS-Reality implementation. Zero-log architecture with geo-distributed nodes across multiple regions. Built for privacy-first users who demand uncompromising security.",
    tags: ["SWIFT", "WINUI", "C#", "WEB"],
    link: { label: "VISIT WEBSITE", href: "https://dopplervpn.org" },
  },
  {
    title: "Creator AI",
    badge: "NEURAL · GEN",
    description:
      "Neural network automated content synthesis. Fine-tuned LLMs for technical documentation and professional content editing. Automated pipelines for multi-language content generation and distribution.",
    tags: ["SWIFT", "KOTLIN"],
    link: { label: "VISIT WEBSITE", href: "https://www.creatorai.art/en" },
  },
];

export default function ProjectsPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-16">
        <p className="text-label text-outline mb-6">ENGINEERING ARCHIVE</p>
        <h1 className="text-display max-w-3xl">ACTIVE DEPLOYMENTS</h1>
        <p className="text-body text-on-surface-variant mt-6 max-w-lg">
          A catalog of precision software instruments developed for global
          scale. Built with industrial-grade reliability and minimalist
          principles.
        </p>
      </section>

      {/* Projects Grid */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {projectsList.map((project, i) => (
              <div
                key={project.title}
                className={`p-8 border border-outline-variant ${
                  i > 0 ? "md:border-l-0" : ""
                }`}
              >
                <p className="text-label text-primary mb-4">{project.badge}</p>
                <h2 className="text-headline text-on-surface mb-4">
                  {project.title}
                </h2>
                <p className="text-body text-on-surface-variant mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-label text-outline border border-outline-variant px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={project.link.href}
                  target={
                    project.link.href.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    project.link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="text-label text-on-surface hover:text-primary transition-colors duration-[50ms] linear"
                >
                  {project.link.label} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
