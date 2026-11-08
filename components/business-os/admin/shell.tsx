import { cookies } from "next/headers";
import { MobileTabBar, ProjectSwitcher } from "@/components/business-os/admin/chrome";
import { navItem } from "@/components/business-os/admin/nav";
import { AdminSection } from "@/components/business-os/admin/sections";
import { AdminSidebar } from "@/components/business-os/admin/sidebar";
import { SIDEBAR_COOKIE, parseSidebarPrefs } from "@/components/business-os/admin/sidebar-prefs";
import { PeriodControl } from "@/components/business-os/ui/date-picker";
import { CloseIcon, FilterIcon } from "@/components/business-os/ui/icons";
import { SheetButton, ToastProvider } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink, Field, Select } from "@/components/business-os/ui/primitives";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { attentionFor, sourcesNeedAttention } from "@/lib/business-os/workspace/derive";
import { BASES, workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { BASIS_LABELS, METRIC_LABELS, humanize } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

const BASE = "/admin" as const;

export async function AdminWorkspace({
  query,
  data,
  profile,
  brokerEnabled,
  telegramConfigured,
}: {
  query: WorkspaceQuery;
  data: WorkspaceData;
  profile: IdentityProfile;
  brokerEnabled: boolean;
  telegramConfigured: boolean;
}) {
  const item = navItem(query.section, query.project);
  const canWrite = profile.role !== "read_only";
  const categories = "error" in data.categories ? null : data.categories.rows;
  const sourcesAlert = sourcesNeedAttention(data);
  const attentionCount = attentionFor(data).length;
  const sidebarPrefs = parseSidebarPrefs((await cookies()).get(SIDEBAR_COOKIE)?.value);

  return (
    <div className="bos admin-shell bos-app">
      <ToastProvider>
          <AdminSidebar
            query={query}
            initialPrefs={sidebarPrefs}
            attentionCount={attentionCount}
            sourcesAlert={sourcesAlert}
            account={{ name: humanize(profile.organizationSlug) || "Account", role: humanize(profile.role) }}
          />

          <div className="bos-main">
            <main className="bos-content">
              <div className="bos-page-head">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="bos-title">{item.label}</h1>
                    {canWrite ? null : (
                      <span className="bos-pill" data-tone="muted" data-outline="">
                        View only
                      </span>
                    )}
                  </div>
                  <p className="bos-caption bos-page-head__intro mt-1">{item.description}</p>
                </div>
                {item.periodic === "period" ? (
                  <div className="bos-page-head__row">
                    <PeriodControl base={BASE} query={query} />
                  </div>
                ) : item.periodic ? (
                  <FilterRow query={query} data={data} scopeOnly={item.periodic === "scope"} />
                ) : null}
              </div>
              <AdminSection
                query={query}
                data={data}
                profile={profile}
                canWrite={canWrite}
                brokerEnabled={brokerEnabled}
                telegramConfigured={telegramConfigured}
              />
            </main>
          </div>

          <MobileTabBar query={query} projects={data.projects} categories={categories} canWrite={canWrite} sourcesAlert={sourcesAlert} />
      </ToastProvider>
    </div>
  );
}

function distinct(values: (string | null | undefined)[], current: string | null): string[] {
  const set = new Set(values.filter((value): value is string => Boolean(value)));
  if (current) set.add(current);
  return [...set].sort();
}

/** Period, basis, project and the secondary filters, all carried in the URL. */
function FilterRow({ query, data, scopeOnly }: { query: WorkspaceQuery; data: WorkspaceData; scopeOnly: boolean }) {
  const observations = "error" in data.observations ? [] : data.observations.rows;
  const expenses = "error" in data.expenses ? [] : data.expenses.rows;
  const currencies = distinct([...observations.map((row) => row.currency), ...expenses.map((row) => row.currency)], query.currency);
  const sources = distinct(observations.map((row) => row.source), query.source);
  const statuses = distinct([...observations.map((row) => row.status), ...expenses.map((row) => row.status)], query.status);
  const bases = query.section === "reports" || query.basis === "sms_legacy" ? BASES : BASES.filter((basis) => basis !== "sms_legacy");
  const project = data.projects.find((item) => item.slug === query.project);

  const chips: [string, string][] = [];
  if (query.project) chips.push([`Project: ${project?.name ?? query.project}`, workspaceHref(BASE, query, { project: null })]);
  if (query.currency) chips.push([`Currency: ${query.currency}`, workspaceHref(BASE, query, { currency: null })]);
  if (query.source) chips.push([`Source: ${humanize(query.source)}`, workspaceHref(BASE, query, { source: null })]);
  if (query.status) chips.push([`Status: ${humanize(query.status)}`, workspaceHref(BASE, query, { status: null })]);
  if (query.metric) chips.push([`Drill: ${METRIC_LABELS[query.metric] ?? query.metric}`, workspaceHref(BASE, query, { metric: null })]);
  const secondary = [query.currency, query.source, query.status].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="bos-page-head__row">
        {scopeOnly ? null : <PeriodControl base={BASE} query={query} />}
        <ProjectSwitcher base={BASE} query={query} projects={data.projects} />
        <div className="bos-seg" role="group" aria-label="Count sales when" hidden={scopeOnly}>
          {bases.map((basis) => (
            <a
              key={basis}
              className="bos-seg__item"
              href={workspaceHref(BASE, query, { basis, metric: null })}
              aria-current={query.basis === basis ? "true" : undefined}
              title={BASIS_LABELS[basis]?.hint}
            >
              {BASIS_LABELS[basis]?.label ?? basis}
            </a>
          ))}
        </div>
        <SheetButton
          title="Filters"
          variant="ghost"
          label={
            <>
              <FilterIcon size={16} />
              Filters
              {secondary > 0 ? <span className="bos-count !bg-[var(--bos-accent)]">{secondary}</span> : null}
            </>
          }
        >
          <form action={BASE} className="bos-form">
            <input type="hidden" name="section" value={query.section} />
            <input type="hidden" name="grain" value={query.grain} />
            <input type="hidden" name="basis" value={query.basis} />
            <input type="hidden" name="anchor" value={query.anchor} />
            {query.grain === "custom" ? (
              <>
                <input type="hidden" name="from" value={query.from} />
                <input type="hidden" name="to" value={query.to} />
              </>
            ) : null}
            {query.project ? <input type="hidden" name="project" value={query.project} /> : null}
            <Field label="Currency" htmlFor="filter-currency" hint="Narrows sales and expense rows.">
              <Select id="filter-currency" name="currency" defaultValue={query.currency ?? ""}>
                <option value="">Any currency</option>
                {currencies.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source" htmlFor="filter-source" hint="Applies to sales rows.">
              <Select id="filter-source" name="source" defaultValue={query.source ?? ""}>
                <option value="">Any source</option>
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="filter-status">
              <Select id="filter-status" name="status" defaultValue={query.status ?? ""}>
                <option value="">Any status</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              <ButtonLink href={workspaceHref(BASE, query, { currency: null, source: null, status: null })}>Clear</ButtonLink>
              <Button type="submit" variant="primary">
                Apply filters
              </Button>
            </div>
          </form>
        </SheetButton>
      </div>
      {chips.length > 0 ? (
        <div className="bos-chips" aria-label="Active filters">
          {chips.map(([label, remove]) => (
            <a key={label} className="bos-chip" href={remove} aria-label={`Remove ${label}`}>
              {label}
              <CloseIcon size={14} />
            </a>
          ))}
          {chips.length > 1 ? (
            <a className="bos-caption bos-link" href={workspaceHref(BASE, query, { project: null, currency: null, source: null, status: null, metric: null })}>
              Clear all
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
