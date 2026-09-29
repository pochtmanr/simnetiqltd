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
      <div className={surface === "tg" ? "flex min-h-full w-full flex-col gap-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]" : "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6"}>
        <nav aria-label={surface === "tg" ? "Sections" : "Admin"} className={surface === "tg" ? "fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg px-4 pb-[env(safe-area-inset-bottom)]" : "flex gap-2 overflow-x-auto md:w-52 md:shrink-0 md:flex-col"}>
          <div className={surface === "tg" ? "mx-auto grid w-full max-w-lg grid-cols-5" : "contents"}>
            {links.map(([section, label]) => (
              <a
                key={section}
                href={workspaceHref(base, query, { section, metric: null })}
                aria-current={query.section === section ? "page" : undefined}
                className={
                  surface === "tg"
                    ? `min-h-11 px-2 py-2 text-center text-xs font-semibold ${query.section === section ? "text-primary" : "text-text-dim"}`
                    : "min-h-11 px-2 py-2 text-center text-sm md:text-left"
                }
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header>
            <p className={surface === "tg" ? "text-xs font-semibold tracking-wider text-text-dim uppercase" : "text-xs tracking-wide text-text-dim uppercase"}>Business OS</p>
            <h1 className={surface === "tg" ? "font-display text-2xl font-bold" : "text-2xl font-medium"}>{surface === "tg" ? periodTitle(query) : "Admin"}</h1>
          </header>
          <FilterBar base={base} query={query} projects={data.projects} presentation={surface === "tg" ? "sheet" : "inline"} />
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

function periodTitle(query: WorkspaceQuery): string {
  if (query.grain === "year") return query.anchor.slice(0, 4);
  if (query.grain === "month") {
    const year = Number(query.anchor.slice(0, 4));
    const month = Number(query.anchor.slice(5, 7));
    const day = Number(query.anchor.slice(8, 10));
    return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  }
  const format = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
  return `${format.format(new Date(query.from))} to ${format.format(new Date(query.to))}`;
}

function filterSummary(query: WorkspaceQuery, projects: { slug: string; name: string }[]): string {
  const grain = query.grain === "month" ? "Month" : query.grain === "year" ? "Year" : "Custom";
  const project = query.project ? (projects.find((item) => item.slug === query.project)?.name ?? query.project) : "All projects";
  return `${grain} · ${query.basis.replaceAll("_", " ")} · ${query.anchor} · ${project}`;
}

function FilterBar({
  base,
  query,
  projects,
  presentation,
}: {
  base: "/admin" | "/tg";
  query: WorkspaceQuery;
  projects: { slug: string; name: string }[];
  presentation: "inline" | "sheet";
}) {
  const fieldClass = presentation === "sheet" ? "min-h-11 rounded-xl border border-border bg-bg px-3 text-base" : "min-h-11 rounded-md border border-border bg-surface px-3 text-base";
  const fields = (
    <>
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
      <label className={`flex flex-col gap-1 text-sm ${presentation === "inline" ? "sm:col-span-2" : ""}`}>
        Custom from
        <input name="from" defaultValue={query.from} className={fieldClass} />
      </label>
      <label className={`flex flex-col gap-1 text-sm ${presentation === "inline" ? "sm:col-span-2" : ""}`}>
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
      <p className={`text-xs text-text-dim ${presentation === "inline" ? "sm:col-span-2" : ""}`}>
        Window {query.from} to {query.to}. Month and year use the anchor in Europe/London. Custom uses the from and to instants. Currency, source, and status narrow listed rows.
      </p>
      <button type="submit" className={presentation === "sheet" ? "min-h-11 w-fit rounded-xl bg-primary px-4 text-sm font-semibold text-white" : "min-h-11 w-fit rounded-md bg-primary px-4 text-sm text-white"}>
        Apply filters
      </button>
    </>
  );
  if (presentation === "sheet") {
    return (
      <details className="rounded-2xl border border-border bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate font-semibold">{filterSummary(query, projects)}</span>
          <span className="font-semibold text-primary">Filters</span>
        </summary>
        <form action={base} className="grid gap-3 border-t border-border p-3">
          {fields}
        </form>
      </details>
    );
  }
  return (
    <form action={base} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
      {fields}
    </form>
  );
}
