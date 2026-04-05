import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-label text-on-surface">SIMNETIQ LTD</p>
            <p className="text-label text-outline mt-1">
              &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
            <Link
              href="mailto:support@simnetiq.store"
              className="text-label text-outline hover:text-on-surface transition-colors duration-[50ms] linear"
            >
              SUPPORT@SIMNETIQ.STORE
            </Link>
            <span className="text-label text-outline">LONDON, UK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
