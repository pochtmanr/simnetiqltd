"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/legal", label: "Legal" },
  { href: "/delete-account", label: "Delete Account" },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-outline-variant bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Simnetiq"
              width={48}
              height={17}
              className="h-[17px] w-auto"
            />
            <span className="text-label text-on-surface tracking-[0.05em]">
              SIMNETIQ
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-label transition-colors duration-[50ms] linear ${
                  pathname === link.href
                    ? "text-on-surface"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-[5px] p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-[1px] bg-on-surface transition-transform duration-[50ms] linear ${
                open ? "rotate-45 translate-y-[3px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1px] bg-on-surface transition-opacity duration-[50ms] linear ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1px] bg-on-surface transition-transform duration-[50ms] linear ${
                open ? "-rotate-45 -translate-y-[3px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-outline-variant">
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-label ${
                  pathname === link.href
                    ? "text-on-surface"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
