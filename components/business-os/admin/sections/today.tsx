import { hasProjectLogo, ProjectLogo } from "@/components/project-logo";
import { AttentionCard, HeadlineKpis, SourceFreshness } from "@/components/business-os/admin/sections/overview";
import { ExternalIcon, ServerIcon, TimelineIcon } from "@/components/business-os/ui/icons";
import { Card, CardHead, EmptyState, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { londonDate } from "@/lib/business-os/finance/london";
import { brandIcon, PROJECT_STACKS, type ProjectStack, type ServerProvider, type StackLink } from "@/lib/business-os/projects/stack";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { formatDate, humanize, periodLabel } from "@/lib/business-os/workspace/format";
import type { ProjectRow, UpcomingRow, WorkspaceData } from "@/lib/business-os/workspace/load";

const BASE = "/admin" as const;

const KIND_LABEL: Record<string, string> = {
  finance_due: "Expense due",
  recurring_expectation: "Recurring",
  service_renewal: "Renewal",
  service_due: "Due",
  manual: "Event",
};

/** Kinds that still need action once their date has passed; past manual events are simply over. */
const ACTIONABLE = new Set(["finance_due", "recurring_expectation", "service_renewal", "service_due"]);

export function Today({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const link = (section: string) => workspaceHref(BASE, query, { section, metric: null });
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {PROJECT_STACKS.map((stack) => (
          <ProjectHub
            key={stack.slug}
            stack={stack}
            project={data.projects.find((row) => row.slug === stack.slug)}
            overviewHref={workspaceHref(BASE, query, { section: "overview", project: stack.slug, metric: null })}
          />
        ))}
      </div>
      <AttentionCard query={query} data={data} />
      <Section title={periodLabel(query)} description="Headline figures for the current month. Open Overview to change the period.">
        <HeadlineKpis query={query} data={data} />
      </Section>
      <div className="bos-grid-2">
        <UpNext upcoming={data.upcoming} href={link("timeline")} />
        <SourceFreshness data={data} href={link("integrations")} />
      </div>
    </div>
  );
}

/** One project's own page. For now it shows the same hub as the Dashboard. */
export function ProjectPage({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const stack = PROJECT_STACKS.find((item) => item.slug === query.project);
  if (!stack) {
    return <Notice tone="warn">No project called “{query.project ?? "—"}”. Pick one under Projects in the sidebar.</Notice>;
  }
  return (
    <ProjectHub
      stack={stack}
      project={data.projects.find((row) => row.slug === stack.slug)}
      overviewHref={workspaceHref(BASE, query, { section: "overview", project: stack.slug, metric: null })}
    />
  );
}

/** One product's sites, consoles and servers, grouped so everything about it is in one place. */
function ProjectHub({ stack, project, overviewHref }: { stack: ProjectStack; project: ProjectRow | undefined; overviewHref: string }) {
  return (
    <Card>
      <CardHead
        title={
          <span className="flex items-center gap-2">
            {hasProjectLogo(stack.slug) ? <ProjectLogo project={stack.slug} alt="" size={22} /> : null}
            {stack.name}
            {project ? <StatusPill status={project.state} label={humanize(project.state)} compact /> : null}
          </span>
        }
        meta={stack.tagline}
        actions={
          <a className="bos-caption bos-link" href={overviewHref}>
            Figures
          </a>
        }
      />
      {stack.groups.map((group) => (
        <div key={group.title} className="bos-hub-group">
          <p className="bos-label">{group.title}</p>
          <ul className="bos-hub-links">
            {group.links.map((link) => (
              <li key={link.label}>
                <HubLink link={link} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {stack.servers ? (
        <div className="bos-hub-group">
          <p className="bos-label">Servers</p>
          <ul className="bos-hub-links" data-wide="">
            {stack.servers.map((host, index) => (
              <li key={host.provider ?? `unrecorded-${index}`}>
                <ServerHost host={host} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

function ServerHost({ host }: { host: ServerProvider }) {
  const name = host.provider ?? "Provider not recorded";
  return (
    <div className="bos-hub-host">
      <p className="bos-hub-link__title">
        {host.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny static favicon; next/image adds nothing here.
          <img src={host.logo} alt="" width={16} height={16} className="bos-hub-provider-logo" />
        ) : (
          <ServerIcon size={16} />
        )}
        {host.href ? (
          <a className="bos-link bos-hub-link__label" href={host.href} target="_blank" rel="noopener noreferrer" title={name}>
            {name}
          </a>
        ) : (
          <span className={`bos-hub-link__label${host.provider ? "" : " text-[var(--color-text-dim)]"}`} title={name}>
            {name}
          </span>
        )}
        <span className="bos-caption">· {host.servers.length}</span>
      </p>
      {host.note ? (
        <p className="bos-caption truncate" title={host.note}>
          {host.note}
        </p>
      ) : null}
      <ul className="bos-hub-servers" aria-label={`${name} servers`}>
        {host.servers.map((server) => (
          <li key={server.place} className="bos-hub-server" title={server.role}>
            <span aria-hidden>{server.flag}</span>
            <span className="whitespace-nowrap">{server.place}</span>
            {server.role ? <span className="bos-caption">· {server.role}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HubLink({ link }: { link: StackLink }) {
  const icon = brandIcon(link);
  const tooltip = link.note ? `${link.label} — ${link.note}` : link.label;
  const body = (
    <>
      <span className="bos-hub-link__title">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny static brand mark; next/image adds nothing here.
          <img src={icon.src} alt="" width={16} height={16} className={`bos-hub-provider-logo${icon.dark ? " bos-hub-brand--dark" : ""}`} />
        ) : null}
        <span className="bos-hub-link__label">{link.label}</span>
        {link.href ? <ExternalIcon size={12} /> : null}
      </span>
      {link.note ? <span className="bos-caption truncate">{link.note}</span> : null}
    </>
  );
  return link.href ? (
    <a className="bos-hub-link" href={link.href} target="_blank" rel="noopener noreferrer" title={tooltip}>
      {body}
    </a>
  ) : (
    <div className="bos-hub-link" title={tooltip}>
      {body}
    </div>
  );
}

function UpNext({ upcoming, href }: { upcoming: WorkspaceData["upcoming"]; href: string }) {
  const today = londonDate(new Date());
  if (!upcoming || "error" in upcoming) {
    return (
      <Card>
        <CardHead title="Up next" />
        <div className="p-4">
          <Notice>The timeline is unavailable.</Notice>
        </div>
      </Card>
    );
  }
  const overdue = upcoming.rows.filter((row) => row.occursOn < today && ACTIONABLE.has(row.kind));
  const ahead = upcoming.rows.filter((row) => row.occursOn >= today);
  return (
    <Card>
      <CardHead title="Up next" meta="Next 14 days" actions={<a className="bos-caption bos-link" href={href}>Calendar</a>} />
      {overdue.length + ahead.length === 0 ? (
        <EmptyState icon={<TimelineIcon />} title="Nothing due">
          No renewals, due expenses or events in the next two weeks.
        </EmptyState>
      ) : (
        <ul className="bos-rows">
          {overdue.map((row) => (
            <UpNextRow key={`${row.kind}-${row.sourceId}-${row.occursOn}`} row={row} overdue />
          ))}
          {ahead.map((row) => (
            <UpNextRow key={`${row.kind}-${row.sourceId}-${row.occursOn}`} row={row} today={row.occursOn === today} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function UpNextRow({ row, overdue = false, today = false }: { row: UpcomingRow; overdue?: boolean; today?: boolean }) {
  return (
    <li className="bos-row">
      <span className="bos-row__main">
        <span className="bos-row__title">{row.title}</span>
        <span className="bos-caption">
          {KIND_LABEL[row.kind] ?? row.kind}
          {row.projectSlug ? ` · ${row.projectSlug}` : ""} · {formatDate(`${row.occursOn}T12:00:00Z`)}
        </span>
      </span>
      {overdue ? <StatusPill tone="bad" label="Overdue" /> : today ? <StatusPill tone="warn" label="Today" /> : null}
    </li>
  );
}
