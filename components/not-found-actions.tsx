"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, localizePath } from "@/lib/i18n";

type Dict = {
  home: string;
  projects: string;
};

export function NotFoundActions({ dict }: { dict: Dict }) {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  const locale = isLocale(first) ? first : DEFAULT_LOCALE;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link href={localizePath(locale, "/")} className="btn-primary btn-tracer">
        {dict.home}
        <span aria-hidden="true" className="btn-arrow">→</span>
      </Link>
      <Link
        href={localizePath(locale, "/projects")}
        className="btn-secondary btn-tracer"
      >
        {dict.projects}
        <span aria-hidden="true" className="btn-arrow">↗</span>
      </Link>
    </div>
  );
}
