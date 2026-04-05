"use client";

import { useState } from "react";

const projects = [
  {
    title: "Doppler VPN",
    badge: "VPN · ENC",
    description:
      "Military-grade network obfuscation using custom VLESS-Reality implementation. Zero-log architecture with geo-distributed nodes.",
  },
  {
    title: "Simnetiq eSIM",
    badge: "eSIM · GLOBAL",
    description:
      "Global cellular authentication platform. Dynamic profile provisioning across 180 countries with automated carrier integration.",
  },
  {
    title: "Creator AI",
    badge: "NEURAL · GEN",
    description:
      "Neural network automated content synthesis. Fine-tuned LLMs for technical documentation and professional content editing.",
  },
];

const capabilities = [
  "App Development",
  "VPN Infrastructure",
  "AI Integration",
];

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-24 pb-20">
        <p className="text-label text-outline mb-6">
          TECHNOLOGY STUDIO · LONDON
        </p>
        <h1 className="text-display max-w-4xl">SIMNETIQ</h1>
        <p className="text-body text-on-surface-variant mt-6 max-w-lg">
          Technology studio based in London. Precision software engineering for
          web, mobile, VPN infrastructure, and AI systems.
        </p>
      </section>

      {/* Featured Projects */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <p className="text-label text-outline mb-8">SELECTED · OPERATIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {projects.map((project, i) => (
              <div
                key={project.title}
                className={`p-6 border border-outline-variant ${
                  i > 0 ? "md:border-l-0" : ""
                }`}
              >
                <p className="text-label text-primary mb-3">{project.badge}</p>
                <h3 className="text-headline text-on-surface mb-3">
                  {project.title}
                </h3>
                <p className="text-body text-on-surface-variant">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="bg-surface-container-highest">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-label text-outline mb-4">METHODOLOGY</p>
              <h2 className="text-headline text-on-surface mb-4">
                CORE CAPABILITIES
              </h2>
              <p className="text-body text-on-surface-variant max-w-md">
                Engineering-led approach to digital products. We prioritize
                reliability and architectural purity, building technical
                foundations for high-stakes digital products.
              </p>
            </div>
            <div className="flex flex-col">
              {capabilities.map((cap, i) => (
                <div
                  key={cap}
                  className={`flex items-center justify-between py-4 ${
                    i < capabilities.length - 1
                      ? "border-b border-outline-variant"
                      : ""
                  }`}
                >
                  <span className="text-body font-medium text-on-surface">
                    {cap}
                  </span>
                  <span className="text-label text-outline">&rarr;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <p className="text-label text-outline mb-4">TRANSMISSION</p>
          <h2 className="text-headline text-on-surface mb-8">CONTACT US</h2>
          <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
            <div>
              <label className="text-label text-outline block mb-2">NAME</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-container-highest border-b border-outline px-4 py-3 text-body text-on-surface focus:outline-none focus:border-primary"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-label text-outline block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-surface-container-highest border-b border-outline px-4 py-3 text-body text-on-surface focus:outline-none focus:border-primary"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-label text-outline block mb-2">
                MESSAGE
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-surface-container-highest border-b border-outline px-4 py-3 text-body text-on-surface focus:outline-none focus:border-primary resize-none"
                placeholder="Your message"
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary"
            >
              {status === "sending" ? "SENDING..." : "EXECUTE →"}
            </button>
            {status === "sent" && (
              <p className="text-label text-primary">
                MESSAGE TRANSMITTED SUCCESSFULLY.
              </p>
            )}
            {status === "error" && (
              <p className="text-label text-error">
                TRANSMISSION FAILED. PLEASE RETRY.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
