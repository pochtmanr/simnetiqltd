import { AdminWorkspace } from "@/components/business-os/admin/shell";
import { IdentityActions } from "@/components/business-os/identity-actions";
import { WorkspaceSection } from "@/components/business-os/sections";
import { TelegramFrame } from "@/components/business-os/telegram-frame";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { BASES, GRAINS, telegramBack, workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

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
  if (surface === "admin") {
    return (
      <TelegramFrame backHref={null}>
        <AdminWorkspace query={query} data={data} profile={profile} brokerEnabled={brokerEnabled} telegramConfigured={telegramConfigured} />
      </TelegramFrame>
    );
  }

  const backHref = telegramBack(query);

  return (
    <TelegramFrame backHref={backHref}>
      <div className="flex min-h-full w-full flex-col gap-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid w-full max-w-lg grid-cols-5">
            {TG_LINKS.map(([section, label]) => (
              <a
                key={section}
                href={workspaceHref(base, query, { section, metric: null })}
                aria-current={query.section === section ? "page" : undefined}
                className={`min-h-11 px-2 py-2 text-center text-xs font-semibold ${query.section === section ? "text-primary" : "text-text-dim"}`}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 pt-4">
          <header>
            <p className="text-xs font-semibold tracking-wider text-text-dim uppercase">Business OS</p>
            <h1 className="font-display text-2xl font-bold">{periodTitle(query)}</h1>
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
              <IdentityActions role={profile.role} assurance={profile.assurance} surface={surface} telegramConfigured={telegramConfigured} focus="session" stepUpUntil={profile.stepUpUntil} />
            </>
          ) : null}
          {query.section === "integrations" ? (
            <IdentityActions role={profile.role} assurance={profile.assurance} surface={surface} telegramConfigured={telegramConfigured} focus="integration" projects={data.projects} />
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
}: {
  base: "/admin" | "/tg";
  query: WorkspaceQuery;
  projects: { slug: string; name: string }[];
}) {
  const fieldClass = "min-h-11 rounded-xl border border-border bg-bg px-3 text-base";
  const fields = (
    <>
      <input type="hidden" name="section" value={query.section} />
      <label className="flex flex-col gap-1 text-sm">
        <span>Grain</span>
        <select name="grain" defaultValue={query.grain} className={fieldClass}>
          {GRAINS.map((grain) => (
            <option key={grain} value={grain}>
              {grain}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Basis</span>
        <select name="basis" defaultValue={query.basis} className={fieldClass}>
          {BASES.map((basis) => (
            <option key={basis} value={basis}>
              {basis}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Anchor date</span>
        <input name="anchor" type="date" defaultValue={query.anchor} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Project</span>
        <select name="project" defaultValue={query.project ?? ""} className={fieldClass}>
          <option value="">All</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Custom from</span>
        <input name="from" defaultValue={query.from} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Custom to</span>
        <input name="to" defaultValue={query.to} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Currency</span>
        <input name="currency" defaultValue={query.currency ?? ""} maxLength={3} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Source</span>
        <input name="source" defaultValue={query.source ?? ""} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Status</span>
        <input name="status" defaultValue={query.status ?? ""} className={fieldClass} />
      </label>
      <p className="text-xs text-text-dim">
        Window {query.from} to {query.to}. Month and year use the anchor in Europe/London. Custom uses the from and to instants. Currency, source, and status narrow listed rows.
      </p>
      <div>
        <button type="submit" className="min-h-11 w-fit rounded-xl bg-primary px-4 text-sm font-semibold text-white">
          Apply filters
        </button>
      </div>
    </>
  );
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
