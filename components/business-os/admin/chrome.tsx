"use client";

import { useState, type ReactNode } from "react";
import { ExpenseForm } from "@/components/business-os/admin/expense-form";
import { NAV_GROUPS, SETTINGS_ITEM, isCurrent, navGroupOf, navHref, navKey, type NavGroup } from "@/components/business-os/admin/nav";
import { businessPost } from "@/components/business-os/business-post";
import {
  BrainIcon,
  ExpenseIcon,
  HomeIcon,
  IncomeIcon,
  LogoutIcon,
  MoneyNavIcon,
  MoreIcon,
  MoonIcon,
  PlusIcon,
  ProjectIcon,
  SettingsIcon,
  SunIcon,
} from "@/components/business-os/admin/nav-icons";
import { MenuLink, Popover, Sheet, useSheetClose } from "@/components/business-os/ui/overlay";
import { Button } from "@/components/business-os/ui/primitives";
import { useTheme, type ThemeChoice } from "@/components/theme-provider";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";

type Categories = { code: string; name: string }[] | null;
type Projects = { slug: string; name: string }[];

/* ---------- App settings ---------- */

export function AppSettings() {
  const { choice, setChoice } = useTheme();
  async function logout() {
    await businessPost("/api/business-os/auth/logout", {});
    window.location.assign("/login?next=/admin");
  }
  const themes: [ThemeChoice, string, ReactNode][] = [
    ["system", "Match device", <SettingsIcon key="s" size={16} />],
    ["light", "Light", <SunIcon key="l" size={16} />],
    ["dark", "Dark", <MoonIcon key="d" size={16} />],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="bos-label">Theme</p>
        <div className="bos-seg" role="group" aria-label="Theme">
          {themes.map(([value, label, icon]) => (
            <button key={value} type="button" className="bos-seg__item gap-1.5" aria-pressed={choice === value} onClick={() => setChoice(value)}>
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-start border-t border-[var(--color-border)] pt-4">
        <Button onClick={logout}>
          <LogoutIcon size={16} />
          Log out
        </Button>
      </div>
    </div>
  );
}

/* ---------- Project scope ---------- */

export function ProjectSwitcher({ base, query, projects }: { base: "/admin"; query: WorkspaceQuery; projects: Projects }) {
  const current = projects.find((project) => project.slug === query.project);
  return (
    <Popover
      title="Project"
      label={
        <>
          <ProjectIcon size={16} />
          <span className="max-w-[10rem] truncate">{current?.name ?? query.project ?? "All projects"}</span>
        </>
      }
    >
      <div className="flex min-w-56 flex-col" role="menu">
        <MenuLink href={workspaceHref(base, query, { project: null, metric: null })} current={!query.project}>
          All projects
        </MenuLink>
        <div className="bos-menu-sep" />
        {projects.map((project) => (
          <MenuLink key={project.slug} href={workspaceHref(base, query, { project: project.slug, metric: null })} current={query.project === project.slug}>
            {project.name}
          </MenuLink>
        ))}
      </div>
    </Popover>
  );
}

/* ---------- New entry ---------- */

function NewEntryChooser({ onPick }: { onPick: (kind: "expense" | "manual_income") => void }) {
  const close = useSheetClose();
  return (
    <div className="flex min-w-52 flex-col" role="menu">
      <button
        type="button"
        role="menuitem"
        className="bos-menu-item"
        onClick={() => {
          close();
          onPick("expense");
        }}
      >
        <ExpenseIcon size={16} />
        Expense
      </button>
      <button
        type="button"
        role="menuitem"
        className="bos-menu-item"
        onClick={() => {
          close();
          onPick("manual_income");
        }}
      >
        <IncomeIcon size={16} />
        Income
      </button>
    </div>
  );
}

function EntrySheet({ kind, onClose, projects, categories, project }: { kind: "expense" | "manual_income" | null; onClose: () => void; projects: Projects; categories: Categories; project: string | null }) {
  return (
    <Sheet open={kind !== null} onClose={onClose} title={kind === "manual_income" ? "New income" : "New expense"}>
      {kind ? <ExpenseForm key={kind} projects={projects} categories={categories} defaultKind={kind} defaultProject={project} /> : null}
    </Sheet>
  );
}

export function NewEntryButton({
  projects,
  categories,
  project,
  kind,
  label = "New",
}: {
  projects: Projects;
  categories: Categories;
  project: string | null;
  /** Skip the chooser and open this form directly. */
  kind?: "expense" | "manual_income";
  label?: string;
}) {
  const [open, setOpen] = useState<"expense" | "manual_income" | null>(null);
  return (
    <>
      {kind ? (
        <Button variant="primary" onClick={() => setOpen(kind)}>
          <PlusIcon size={16} />
          {label}
        </Button>
      ) : (
        <Popover title="New" align="end" variant="primary" label={<><PlusIcon size={16} />{label}</>}>
          <NewEntryChooser onPick={setOpen} />
        </Popover>
      )}
      <EntrySheet kind={open} onClose={() => setOpen(null)} projects={projects} categories={categories} project={project} />
    </>
  );
}

/* ---------- Mobile tab bar ---------- */

function GroupLinks({ groups, query, titled = false }: { groups: NavGroup[]; query: WorkspaceQuery; titled?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((navGroup) => (
        <div key={`${navGroup.id}-${navGroup.items[0]?.section}`} className="flex flex-col gap-2">
          {titled && navGroup.label ? <p className="bos-label">{navGroup.label}</p> : null}
          <div className="bos-card overflow-hidden">
            {navGroup.items.map((item) => (
              <a key={navKey(item)} className="bos-row" href={navHref("/admin", query, item)} aria-current={isCurrent(query, item) ? "page" : undefined}>
                <span className="bos-row__main">
                  <span className="bos-row__title">{item.label}</span>
                  <span className="bos-caption">{item.description}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileTabBar({
  query,
  projects,
  categories,
  canWrite,
  sourcesAlert,
}: {
  query: WorkspaceQuery;
  projects: Projects;
  categories: Categories;
  canWrite: boolean;
  sourcesAlert: boolean;
}) {
  const [sheet, setSheet] = useState<"money" | "brain" | "more" | "new" | null>(null);
  const [entry, setEntry] = useState<"expense" | "manual_income" | null>(null);
  const group = navGroupOf(query.section);
  const groups = (...ids: NavGroup["id"][]) => NAV_GROUPS.filter((item) => ids.includes(item.id));
  const moreActive = group === "projects" || group === "apps" || group === "plan" || group === "system" || group === "settings";

  return (
    <>
      <nav className="bos-tabbar" aria-label="Primary">
        <a className="bos-tab" href={navHref("/admin", query, NAV_GROUPS[0].items[0])} aria-current={group === "today" ? "page" : undefined}>
          <HomeIcon size={22} />
          Dashboard
        </a>
        <button type="button" className="bos-tab" aria-current={group === "money" ? "page" : undefined} onClick={() => setSheet("money")}>
          <MoneyNavIcon size={22} />
          Money
        </button>
        {canWrite ? (
          <button type="button" className="bos-tab" aria-label="New entry" onClick={() => setSheet("new")}>
            <span className="bos-tab__add">
              <PlusIcon size={22} />
            </span>
          </button>
        ) : (
          <span className="bos-tab" aria-hidden />
        )}
        <button type="button" className="bos-tab" aria-current={group === "brain" ? "page" : undefined} onClick={() => setSheet("brain")}>
          <BrainIcon size={22} />
          Brain
        </button>
        <button type="button" className="bos-tab" aria-current={moreActive ? "page" : undefined} onClick={() => setSheet("more")}>
          <MoreIcon size={22} />
          {sourcesAlert ? <span className="bos-tab__dot" aria-label="A source needs attention" /> : null}
          More
        </button>
      </nav>
      <Sheet open={sheet === "money"} onClose={() => setSheet(null)} title="Money">
        <GroupLinks groups={groups("money")} query={query} />
      </Sheet>
      <Sheet open={sheet === "brain"} onClose={() => setSheet(null)} title="Brain">
        <GroupLinks groups={groups("brain")} query={query} />
      </Sheet>
      <Sheet open={sheet === "more"} onClose={() => setSheet(null)} title="More">
        <div className="flex flex-col gap-4">
          <GroupLinks groups={groups("projects", "apps", "plan", "system")} query={query} titled />
          <GroupLinks groups={[{ id: "system", label: null, items: [SETTINGS_ITEM] }]} query={query} />
        </div>
      </Sheet>
      <Sheet open={sheet === "new"} onClose={() => setSheet(null)} title="New entry">
        <div className="bos-card overflow-hidden">
          {(
            [
              ["expense", "Expense", "A cost paid or owed", <ExpenseIcon key="e" />],
              ["manual_income", "Income", "Money received outside a store", <IncomeIcon key="i" />],
            ] as const
          ).map(([kind, label, caption, icon]) => (
            <button
              key={kind}
              type="button"
              className="bos-row"
              onClick={() => {
                setSheet(null);
                setEntry(kind);
              }}
            >
              {icon}
              <span className="bos-row__main">
                <span className="bos-row__title">{label}</span>
                <span className="bos-caption">{caption}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
      <EntrySheet kind={entry} onClose={() => setEntry(null)} projects={projects} categories={categories} project={query.project} />
    </>
  );
}
