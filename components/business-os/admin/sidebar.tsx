"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { NAV_GROUPS, SETTINGS_ITEM, isCurrent, navHref, navKey, type NavGroup, type NavItem } from "@/components/business-os/admin/nav";
import { sectionIcon } from "@/components/business-os/admin/nav-icons";
import { SIDEBAR_COOKIE, serializeSidebarPrefs, type SidebarPrefs } from "@/components/business-os/admin/sidebar-prefs";
import { businessPost } from "@/components/business-os/business-post";
import { ChevronDownIcon, EyeIcon, EyeOffIcon, LogoutIcon, MoonIcon, SettingsIcon, SidebarIcon, SortIcon, SunIcon } from "@/components/business-os/ui/icons";
import { Logo } from "@/components/logo";
import { hasProjectLogo, ProjectLogo } from "@/components/project-logo";
import { useTheme, type ThemeChoice } from "@/components/theme-provider";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";

const BASE = "/admin" as const;

function savePrefs(prefs: SidebarPrefs) {
  document.cookie = `${SIDEBAR_COOKIE}=${serializeSidebarPrefs(prefs)}; path=/admin; max-age=31536000; samesite=lax`;
}

function toggled(list: string[], key: string, on: boolean): string[] {
  return on ? [...new Set([...list, key])] : list.filter((entry) => entry !== key);
}

export function AdminSidebar({
  query,
  initialPrefs,
  attentionCount,
  sourcesAlert,
  account,
}: {
  query: WorkspaceQuery;
  initialPrefs: SidebarPrefs;
  attentionCount: number;
  sourcesAlert: boolean;
  account: { name: string; role: string };
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [editing, setEditing] = useState(false);
  const hidden = new Set(prefs.hidden);

  function update(next: Partial<SidebarPrefs>) {
    setPrefs((current) => {
      const merged = { ...current, ...next };
      savePrefs(merged);
      return merged;
    });
  }

  function badge(item: NavItem): ReactNode {
    if (item.section === "home" && attentionCount > 0) {
      return (
        <span className="bos-side-link__badge bos-count" aria-label={`${attentionCount} items need attention`}>
          {attentionCount}
        </span>
      );
    }
    if (item.section === "integrations" && sourcesAlert) {
      return (
        <span className="bos-side-link__badge bos-count" aria-label="A source needs attention">
          !
        </span>
      );
    }
    return null;
  }

  return (
    <aside className="bos-sidebar" aria-label="Workspace" data-collapsed={prefs.collapsed && !editing ? "" : undefined} data-editing={editing ? "" : undefined}>
      <div className="bos-side-head">
        <a href={navHref(BASE, query, NAV_GROUPS[0].items[0])} className="bos-side-brand" title="Business OS">
          <Logo width={22} height={22} />
          <span>Business OS</span>
        </a>
        <button
          type="button"
          className="bos-side-icon-btn bos-side-toggle"
          aria-label={prefs.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={prefs.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => update({ collapsed: !prefs.collapsed })}
        >
          <SidebarIcon size={18} />
        </button>
      </div>

      <nav aria-label="Admin" className="bos-side-scroll">
        {editing ? (
          <div className="bos-side-editbar">
            <span>Choose what the sidebar shows</span>
            <button type="button" className="bos-side-editbar__done" onClick={() => setEditing(false)}>
              Done
            </button>
          </div>
        ) : null}
        {NAV_GROUPS.map((group) => (
          <SideGroup
            key={group.id}
            group={group}
            query={query}
            editing={editing}
            hidden={hidden}
            folded={prefs.folded.includes(group.id)}
            alert={group.items.some((item) => badge(item) !== null)}
            badge={badge}
            onFold={(fold) => update({ folded: toggled(prefs.folded, group.id, fold) })}
            onHide={(keys, hide) => update({ hidden: keys.reduce((list, key) => toggled(list, key, hide), prefs.hidden) })}
          />
        ))}
      </nav>

      <AccountMenu
        account={account}
        settingsHref={navHref(BASE, query, SETTINGS_ITEM)}
        onSettings={query.section === "settings"}
        collapsed={prefs.collapsed}
        onCustomize={() => setEditing(true)}
        onToggleCollapsed={() => update({ collapsed: !prefs.collapsed })}
      />
    </aside>
  );
}

function ItemIcon({ item }: { item: NavItem }) {
  return item.project && hasProjectLogo(item.project) ? (
    <span className="bos-side-link__logo">
      <ProjectLogo project={item.project} alt="" size={18} />
    </span>
  ) : (
    sectionIcon(item.section)
  );
}

function SideGroup({
  group,
  query,
  editing,
  hidden,
  folded,
  alert,
  badge,
  onFold,
  onHide,
}: {
  group: NavGroup;
  query: WorkspaceQuery;
  editing: boolean;
  hidden: Set<string>;
  folded: boolean;
  alert: boolean;
  badge: (item: NavItem) => ReactNode;
  onFold: (fold: boolean) => void;
  onHide: (keys: string[], hide: boolean) => void;
}) {
  const keys = group.items.map(navKey);

  if (editing) {
    const allHidden = keys.every((key) => hidden.has(key));
    return (
      <div className="bos-side-group">
        {group.label ? (
          <div className="bos-side-group__head">
            <span className="bos-side-group__title">{group.label}</span>
            <button
              type="button"
              className="bos-side-icon-btn"
              aria-label={allHidden ? `Show all of ${group.label}` : `Hide all of ${group.label}`}
              title={allHidden ? "Show group" : "Hide group"}
              onClick={() => onHide(keys, !allHidden)}
            >
              {allHidden ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        ) : null}
        {group.items.map((item) => {
          const key = navKey(item);
          const off = hidden.has(key);
          return (
            <button key={key} type="button" className="bos-side-link" data-off={off ? "" : undefined} aria-pressed={!off} onClick={() => onHide([key], !off)}>
              <ItemIcon item={item} />
              <span className="bos-side-link__text">{item.label}</span>
              <span className="bos-side-link__eye" aria-hidden>
                {off ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // The page you are on stays reachable even when hidden or folded away.
  const visible = group.items.filter((item) => !hidden.has(navKey(item)) || isCurrent(query, item));
  if (visible.length === 0) return null;
  const panelId = `bos-side-${group.id}`;

  return (
    <div className="bos-side-group" data-folded={folded ? "" : undefined}>
      {group.label ? (
        <button type="button" className="bos-side-group__head bos-side-group__toggle" aria-expanded={!folded} aria-controls={panelId} onClick={() => onFold(!folded)}>
          <span className="bos-side-group__title">{group.label}</span>
          {folded && alert ? <span className="bos-side-group__dot" aria-label="Something here needs attention" /> : null}
          <ChevronDownIcon size={14} className="bos-side-group__chevron" />
        </button>
      ) : null}
      <div id={panelId} className="bos-side-group__items">
        {visible.map((item) => (
          <a
            key={navKey(item)}
            href={navHref(BASE, query, item)}
            className="bos-side-link"
            aria-current={isCurrent(query, item) ? "page" : undefined}
            title={item.label}
          >
            <ItemIcon item={item} />
            <span className="bos-side-link__text">{item.label}</span>
            {badge(item)}
          </a>
        ))}
      </div>
    </div>
  );
}

function AccountMenu({
  account,
  settingsHref,
  onSettings,
  collapsed,
  onCustomize,
  onToggleCollapsed,
}: {
  account: { name: string; role: string };
  settingsHref: string;
  onSettings: boolean;
  collapsed: boolean;
  onCustomize: () => void;
  onToggleCollapsed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const { choice, setChoice } = useTheme();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (anchor.current && !anchor.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      anchor.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    <div className="bos-side-account" ref={anchor}>
      <button
        type="button"
        className="bos-side-link bos-side-account__btn"
        data-current={onSettings ? "" : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${account.name} · ${account.role}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="bos-avatar" aria-hidden>
          {account.name.charAt(0).toUpperCase()}
        </span>
        <span className="bos-side-link__text bos-side-account__meta">
          <span className="bos-side-account__name">{account.name}</span>
          <span className="bos-side-account__role">{account.role}</span>
        </span>
        <SortIcon size={14} className="bos-side-account__chevron" />
      </button>
      {open ? (
        <div className="bos-pop bos-side-account__menu" role="menu" aria-label="Account">
          <a className="bos-menu-item" role="menuitem" href={settingsHref}>
            {sectionIcon("settings", 16)}
            Account and security
          </a>
          <div className="bos-menu-sep" />
          <div className="bos-side-account__themes" role="group" aria-label="Theme">
            {themes.map(([value, label, icon]) => (
              <button key={value} type="button" className="bos-side-icon-btn" aria-pressed={choice === value} aria-label={label} title={label} onClick={() => setChoice(value)}>
                {icon}
              </button>
            ))}
          </div>
          <div className="bos-menu-sep" />
          <button
            type="button"
            role="menuitem"
            className="bos-menu-item"
            onClick={() => {
              setOpen(false);
              onCustomize();
            }}
          >
            <EyeIcon size={16} />
            Show or hide sections
          </button>
          <button
            type="button"
            role="menuitem"
            className="bos-menu-item bos-side-account__collapse"
            onClick={() => {
              setOpen(false);
              onToggleCollapsed();
            }}
          >
            <SidebarIcon size={16} />
            {collapsed ? "Expand sidebar" : "Icons only"}
          </button>
          <div className="bos-menu-sep" />
          <button type="button" role="menuitem" className="bos-menu-item" onClick={logout}>
            <LogoutIcon size={16} />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
