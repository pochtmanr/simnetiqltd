"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home", code: "00" },
  { href: "/projects", label: "Projects", code: "01" },
  { href: "/services", label: "Services", code: "02" },
  { href: "/about", label: "About", code: "03" },
  { href: "/legal", label: "Legal", code: "04" },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState("—");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const utc = `${String(d.getUTCHours()).padStart(2, "0")}:${String(
        d.getUTCMinutes()
      ).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
      setClock(utc);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[#07090D]/85 bg-[var(--color-bg)]">
      {/* Technical top rail */}
      <div className="border-b border-[var(--color-border)] text-[var(--color-text-dim)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex items-center justify-between h-7 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.18em] uppercase">
            <div className="flex items-center gap-3 sm:gap-6">
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                SYS · ONLINE
              </span>
              <span className="hidden sm:inline">51.5074°N · 0.1278°W</span>
              <span className="hidden md:inline">LDN · OPERATIONS</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <span>v1.0.0</span>
              <span suppressHydrationWarning>{clock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Simnetiq"
                width={109}
                height={107}
                className="h-5 w-auto"
                priority
              />
              <span className="text-label text-white">SIMNETIQ</span>
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-10">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-label-sm transition-colors duration-150"
                  >
                    <span
                      className={
                        active
                          ? "text-[var(--color-primary-glow)]"
                          : "text-[var(--color-text-faint)]"
                      }
                    >
                      {link.code}
                    </span>
                    <span
                      className={
                        active
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-dim)] group-hover:text-[var(--color-text)]"
                      }
                    >
                      {link.label.toUpperCase()}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col gap-[5px] p-2"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-transform duration-150 origin-center ${
                  open ? "rotate-45 translate-y-[6px]" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-opacity duration-150 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-transform duration-150 origin-center ${
                  open ? "-rotate-45 -translate-y-[6px]" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[var(--color-border)]">
            <div className="px-6 py-5 flex flex-col gap-4">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[var(--color-text-faint)] text-label-sm">
                        {link.code}
                      </span>
                      <span
                        className={`text-label ${
                          active
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-text-dim)]"
                        }`}
                      >
                        {link.label.toUpperCase()}
                      </span>
                    </span>
                    <span
                      className={`text-label ${
                        active
                          ? "text-[var(--color-primary-glow)]"
                          : "text-[var(--color-text-faint)]"
                      }`}
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
