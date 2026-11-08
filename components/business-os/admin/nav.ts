/** Admin information architecture. Section ids are the URL `section` values and stay stable. */

import { PROJECT_STACKS } from "@/lib/business-os/projects/stack";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";

export type NavItem = {
  section: string;
  label: string;
  description: string;
  /** Which filter row applies: the full period row, project and filters only, the period alone, or none. */
  periodic: boolean | "scope" | "period";
  /** Set on the per-project pages, which all share section `project`. */
  project?: string;
};

export type NavGroup = {
  id: "today" | "projects" | "money" | "apps" | "brain" | "plan" | "system";
  /** Null for a group that is a single destination and needs no heading. */
  label: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "today",
    label: null,
    items: [{ section: "home", label: "Dashboard", description: "Your products and where they live, what needs you today, and how the month is going.", periodic: false }],
  },
  {
    id: "projects",
    label: "Projects",
    items: PROJECT_STACKS.map((stack) => ({ section: "project", project: stack.slug, label: stack.name, description: stack.tagline, periodic: false })),
  },
  {
    id: "money",
    label: "Money",
    items: [
      { section: "overview", label: "Overview", description: "How the business is doing this period.", periodic: true },
      { section: "sales", label: "Sales", description: "Every sale, refund and fee behind the figures.", periodic: true },
      { section: "expenses", label: "Expenses", description: "Record, post and allocate costs.", periodic: "scope" },
      { section: "accounts", label: "Cash", description: "Bank balances, payouts and unmatched settlements.", periodic: true },
      { section: "bank", label: "Bank", description: "Revolut Business balances and transactions, categorised for statements.", periodic: "period" },
      { section: "reports", label: "Statements", description: "Profit and loss by currency, allocation and export.", periodic: true },
    ],
  },
  {
    id: "apps",
    label: "Apps",
    items: [
      { section: "subscriptions", label: "Subscriptions", description: "Recurring revenue and daily operations.", periodic: false },
      { section: "appstore", label: "App Store", description: "Units, proceeds and countries from App Store Connect.", periodic: false },
      { section: "traffic", label: "Audience", description: "Visitors and search, per provider.", periodic: false },
    ],
  },
  {
    id: "brain",
    label: "Brain",
    items: [
      { section: "notes", label: "Notes", description: "Your company notebook: write, link and find notes. Imports and exports Obsidian vaults.", periodic: false },
      { section: "documents", label: "Files", description: "The data folder: invoices, contracts, receipts and exports.", periodic: false },
      { section: "ask", label: "Ask", description: "Ask Claude about your notes, files and figures.", periodic: false },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      { section: "timeline", label: "Calendar", description: "Events, renewals, deadlines and reminders in one view.", periodic: false },
      { section: "records", label: "Registrations", description: "Company, tax and service registrations.", periodic: false },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { section: "integrations", label: "Sources", description: "Connections, datasets, sync runs and quarantine.", periodic: false },
      { section: "projects", label: "Projects", description: "Products and their reporting status.", periodic: false },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { section: "settings", label: "Account", description: "Your sign-in, security and app settings.", periodic: false };

export function navItem(section: string, project: string | null = null): NavItem {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.section === section && (section !== "project" || entry.project === project));
    if (item) return item;
  }
  return section === "settings" ? SETTINGS_ITEM : NAV_GROUPS[0].items[0];
}

export function navGroupOf(section: string): NavGroup["id"] | "settings" {
  if (section === "settings") return "settings";
  return NAV_GROUPS.find((group) => group.items.some((item) => item.section === section))?.id ?? "today";
}

/** Stable React key: the project pages share one section id. */
export function navKey(item: NavItem): string {
  return item.project ? `${item.section}:${item.project}` : item.section;
}

export function isCurrent(query: WorkspaceQuery, item: NavItem): boolean {
  return query.section === item.section && (item.section !== "project" || query.project === item.project);
}

/**
 * A project page sets `project` itself, so leaving one drops it rather than
 * carrying it into the next section as a filter. Elsewhere the filter stays.
 */
export function navHref(base: "/admin", query: WorkspaceQuery, item: NavItem): string {
  if (item.project) return workspaceHref(base, query, { section: item.section, project: item.project, metric: null });
  return workspaceHref(base, query, { section: item.section, metric: null, ...(query.section === "project" ? { project: null } : {}) });
}
