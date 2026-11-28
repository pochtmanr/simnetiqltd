import { hasProjectLogo, ProjectLogo } from "@/components/project-logo";
import { sectionIcon } from "@/components/business-os/admin/nav-icons";
import { ProjectLiveDot, ProjectLiveList } from "@/components/business-os/admin/project-status";
import { isClosed, TaskMeta } from "@/components/business-os/admin/sections/task-meta";
import { CompanyStrip } from "@/components/business-os/admin/sections/company-strip";
import { AttentionCard, HeadlineKpis, SourceFreshness } from "@/components/business-os/admin/sections/overview";
import { ChevronRightIcon, ExternalIcon, ServerIcon, TimelineIcon } from "@/components/business-os/ui/icons";
import { Card, CardHead, EmptyState, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { londonDate } from "@/lib/business-os/finance/london";
import { brandIcon, PROJECT_STACKS, type ProjectStack, type ServerProvider, type StackLink } from "@/lib/business-os/projects/stack";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { mauFor, sourceStateFor, type SourceState } from "@/lib/business-os/workspace/derive";
import { formatDate, groupDigits, periodLabel } from "@/lib/business-os/workspace/format";
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
    // Two columns on wide screens. On narrow ones the wrappers dissolve and CSS `order` restores the single-column reading order.
    <div className="bos-dash">
      <div className="bos-dash__main">
        <div className="bos-dash__slot" data-slot="company">
          <CompanyStrip query={query} checklist={data.checklist} />
        </div>
        <div className="bos-dash__slot" data-slot="hubs">
          <ProjectList query={query} data={data} />
        </div>
        <div className="bos-dash__slot" data-slot="kpis">
          <Section title={periodLabel(query)} description="Headline figures for the current month. Open Overview to change the period.">
            <HeadlineKpis query={query} data={data} users />
          </Section>
        </div>
      </div>
      <aside className="bos-dash__rail">
        <div className="bos-dash__slot" data-slot="steps">
          <NextSteps tasks={data.tasks} projects={data.projects} href={link("tasks")} />
        </div>
        <div className="bos-dash__slot" data-slot="attention">
          <AttentionCard query={query} data={data} />
        </div>
        <div className="bos-dash__slot" data-slot="upnext">
          <UpNext upcoming={data.upcoming} href={link("timeline")} />
        </div>
        <div className="bos-dash__slot" data-slot="sources">
          <SourceFreshness data={data} href={link("integrations")} />
        </div>
      </aside>
    </div>
  );
}

function NextSteps({ tasks, projects, href }: { tasks: WorkspaceData["tasks"]; projects: ProjectRow[]; href: string }) {
  if (!tasks || "error" in tasks) return null;
  const today = londonDate(new Date());
  const open = tasks.rows.filter((task) => !isClosed(task));
  return (
    <Card tone="accent">
      <CardHead title={<IconTitle section="tasks">Tasks</IconTitle>} meta={`${open.length} open`} actions={<a className="bos-caption bos-link" href={href}>All tasks</a>} />
      {open.length === 0 ? (
        <EmptyState icon={<TimelineIcon />} title="Nothing open">
          Add a task under Tasks, or ask the agent to plan the week.
        </EmptyState>
      ) : (
        <ul className="bos-rows">
          {open.slice(0, 5).map((task) => (
            <li key={task.id} className="bos-row">
              <span className="bos-row__main">
                <span className="bos-row__title">{task.title}</span>
                <TaskMeta task={task} today={today} projects={projects} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** A card title led by its section's side-menu icon, so the card and the menu entry read as the same place. */
function IconTitle({ section, children }: { section: string; children: React.ReactNode }) {
  return (
    <span className="bos-icon-title">
      {sectionIcon(section, 16)}
      {children}
    </span>
  );
}

function Mau({ value }: { value: number | null }) {
  return (
    <span className="bos-project-row__stat" title="Website visitors in the last 30 days, from Google Analytics">
      <span className="bos-num">{value === null ? "—" : groupDigits(String(value))}</span>
      <span className="bos-caption">monthly users</span>
    </span>
  );
}

/** Every product at a glance: is it up, is its data flowing, how many people use it. The detail lives on the project's own tab. */
function ProjectList({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  return (
    <Card>
      <CardHead title="Projects" meta="Open a project for its sites, consoles and servers." />
      <ul className="bos-rows">
        {PROJECT_STACKS.map((stack) => {
          const tracked = data.projects.some((row) => row.slug === stack.slug);
          const source = tracked ? sourceStateFor(data, stack.slug) : null;
          return (
            <li key={stack.slug}>
              <a className="bos-row bos-project-row" href={workspaceHref(BASE, query, { section: "project", project: stack.slug, metric: null })}>
                {/* Logos differ in width; one fixed slot keeps the names in a column. */}
                <span className="bos-project-row__logo" aria-hidden>
                  {hasProjectLogo(stack.slug) ? <ProjectLogo project={stack.slug} alt="" size={26} /> : null}
                </span>
                <span className="bos-row__main">
                  <span className="bos-row__title">{stack.name}</span>
                  <span className="bos-project-row__status">
                    {stack.health ? <ProjectLiveDot urls={stack.health} /> : null}
                    {source ? <StatusPill tone={source.tone} label={source.label} compact /> : null}
                  </span>
                </span>
                {tracked ? <Mau value={mauFor(data, stack.slug)} /> : null}
                <ChevronRightIcon size={16} className="bos-row__chev" />
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** One project's own page: its figures link, data source, monthly users, sites, consoles and servers. */
export function ProjectPage({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const stack = PROJECT_STACKS.find((item) => item.slug === query.project);
  if (!stack) {
    return <Notice tone="warn">No project called “{query.project ?? "—"}”. Pick one under Projects in the sidebar.</Notice>;
  }
  const tracked = data.projects.some((row) => row.slug === stack.slug);
  return (
    <ProjectHub
      stack={stack}
      source={tracked ? sourceStateFor(data, stack.slug) : null}
      mau={tracked ? mauFor(data, stack.slug) : null}
      overviewHref={workspaceHref(BASE, query, { section: "overview", project: stack.slug, metric: null })}
      sourcesHref={workspaceHref(BASE, query, { section: "integrations", project: null, metric: null })}
    />
  );
}

/** One product's sites, consoles and servers, grouped so everything about it is in one place. */
function ProjectHub({
  stack,
  source,
  mau,
  overviewHref,
  sourcesHref,
}: {
  stack: ProjectStack;
  /** Null for a stack with no business_os.projects row: it has nothing to report yet. */
  source: SourceState | null;
  mau: number | null;
  overviewHref: string;
  sourcesHref: string;
}) {
  return (
    <Card>
      <CardHead
        title={
          <span className="flex items-center gap-2">
            {hasProjectLogo(stack.slug) ? <ProjectLogo project={stack.slug} alt="" size={22} /> : null}
            {stack.name}
            {stack.health ? <ProjectLiveDot urls={stack.health} /> : null}
          </span>
        }
        meta={stack.tagline}
        actions={
          source ? (
            <a className="bos-caption bos-link" href={overviewHref}>
              Figures
            </a>
          ) : null
        }
      />
      {source ? (
        <div className="bos-hub-group">
          <p className="bos-label">Data</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href={sourcesHref} title="Open Sources">
              <StatusPill tone={source.tone} label={source.label} />
            </a>
            <Mau value={mau} />
          </div>
        </div>
      ) : null}
      {stack.health ? (
        <div className="bos-hub-group">
          <p className="bos-label">Live</p>
          <ProjectLiveList urls={stack.health} />
        </div>
      ) : null}
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
        <CardHead title={<IconTitle section="timeline">Calendar</IconTitle>} />
        <div className="p-4">
          <Notice>The timeline is unavailable.</Notice>
        </div>
      </Card>
    );
  }
  const overdue = upcoming.rows.filter((row) => row.occursOn < today && ACTIONABLE.has(row.kind));
  const ahead = upcoming.rows.filter((row) => row.occursOn >= today);
  return (
    <Card tone="teal">
      <CardHead title={<IconTitle section="timeline">Calendar</IconTitle>} meta="Next 14 days" actions={<a className="bos-caption bos-link" href={href}>Open calendar</a>} />
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
