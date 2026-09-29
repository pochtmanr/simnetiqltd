import Script from "next/script";
import { IdentityActions } from "@/components/business-os/identity-actions";
import { WorkspaceSection } from "@/components/business-os/sections";
import { TelegramFrame } from "@/components/business-os/telegram-frame";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { BASES, GRAINS, telegramBack, workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

const ADMIN_LINKS = [
  ["overview", "Overview"],
  ["projects", "Projects"],
  ["sales", "Sales"],
  ["expenses", "Expenses"],
  ["subscriptions", "Subscriptions"],
  ["traffic", "Traffic"],
  ["accounts", "Accounts"],
  ["reports", "Reports"],
  ["integrations", "Integrations"],
  ["documents", "Documents"],
  ["records", "Business records"],
  ["timeline", "Timeline"],
  ["settings", "Settings"],
] as const;

const TG_LINKS = [
  ["overview", "Overview"],
  ["money", "Money"],
  ["add", "Add"],
  ["documents", "Documents"],
  ["more", "More"],
] as const;

const fieldClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-base";

export function BusinessWorkspace({
  surface,
  base,
  query,
  data,
  profile,
  brokerEnabled,
  telegramConfigured,
}: {
  surface: "admin" | "tg";
  base: "/admin" | "/tg";
  query: WorkspaceQuery;
  data: WorkspaceData;
  profile: IdentityProfile;
  brokerEnabled: boolean;
  telegramConfigured: boolean;
}) {
  const links = surface === "tg" ? TG_LINKS : ADMIN_LINKS;
  const backHref = surface === "tg" ? telegramBack(query) : null;
  return (
    <TelegramFrame backHref={backHref}>
      {surface === "tg" ? <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" /> : null}
      <div className={surface === "tg" ? "mx-auto flex min-h-full w-full max-w-lg flex-col gap-6 px-4 pt-[env(safe-area-inset-top)] pb-[calc(5.5rem+env(safe-area-inset-bottom))]" : "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6"}>
        <nav aria-label={surface === "tg" ? "Telegram" : "Admin"} className={surface === "tg" ? "fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]" : "flex gap-2 overflow-x-auto md:w-52 md:shrink-0 md:flex-col"}>
          <div className={surface === "tg" ? "mx-auto grid w-full max-w-lg grid-cols-5" : "contents"}>
            {links.map(([section, label]) => (
              <a
                key={section}
                href={workspaceHref(base, query, { section, metric: null })}
                aria-current={query.section === section ? "page" : undefined}
                className="min-h-11 px-2 py-2 text-center text-sm md:text-left"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header>
            <p className="text-xs tracking-wide text-text-dim uppercase">Business OS</p>
            <h1 className="text-2xl font-medium">{surface === "tg" ? "Telegram" : "Admin"}</h1>
          </header>
          <FilterBar base={base} query={query} projects={data.projects} />
          <WorkspaceSection surface={surface} base={base} query={query} data={data} canWrite={profile.role !== "read_only"} />
          {query.section === "settings" ? (
            <>
              <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                <dt className="text-text-dim">Role</dt>
                <dd>{profile.role}</dd>
                <dt className="text-text-dim">Assurance</dt>
                <dd>{profile.assurance}</dd>
                <dt className="text-text-dim">Telegram</dt>
                <dd>{profile.telegramLinked ? "Linked" : "Not linked"}</dd>
                <dt className="text-text-dim">Session broker</dt>
                <dd>{brokerEnabled ? "Enabled" : "Off until staging proof"}</dd>
              </dl>
              <IdentityActions role={profile.role} assurance={profile.assurance} surface={surface} telegramConfigured={telegramConfigured} focus="session" />
            </>
          ) : null}
          {query.section === "integrations" ? (
            <IdentityActions role={profile.role} assurance={profile.assurance} surface={surface} telegramConfigured={telegramConfigured} focus="integration" />
          ) : null}
        </div>
      </div>
    </TelegramFrame>
  );
}

function FilterBar({ base, query, projects }: { base: "/admin" | "/tg"; query: WorkspaceQuery; projects: { slug: string; name: string }[] }) {
  return (
    <form action={base} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
      <input type="hidden" name="section" value={query.section} />
      <label className="flex flex-col gap-1 text-sm">
        Grain
        <select name="grain" defaultValue={query.grain} className={fieldClass}>
          {GRAINS.map((grain) => (
            <option key={grain} value={grain}>
              {grain}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Basis
        <select name="basis" defaultValue={query.basis} className={fieldClass}>
          {BASES.map((basis) => (
            <option key={basis} value={basis}>
              {basis}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Anchor date
        <input name="anchor" type="date" defaultValue={query.anchor} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Project
        <select name="project" defaultValue={query.project ?? ""} className={fieldClass}>
          <option value="">All</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Custom from
        <input name="from" defaultValue={query.from} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Custom to
        <input name="to" defaultValue={query.to} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Currency
        <input name="currency" defaultValue={query.currency ?? ""} maxLength={3} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Source
        <input name="source" defaultValue={query.source ?? ""} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Status
        <input name="status" defaultValue={query.status ?? ""} className={fieldClass} />
      </label>
      <p className="text-xs text-text-dim sm:col-span-2">
        Window {query.from} to {query.to}. Month and year use the anchor in Europe/London. Custom uses the from and to instants. Currency, source, and status narrow listed rows.
      </p>
      <button type="submit" className="min-h-11 w-fit rounded-md bg-primary px-4 text-sm text-white">
        Apply filters
      </button>
    </form>
  );
}
