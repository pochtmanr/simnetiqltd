/** Per-browser sidebar layout, kept in a cookie so the server renders it without a flash. */

export const SIDEBAR_COOKIE = "bos_sidebar";

export type SidebarPrefs = {
  /** Icon-only rail on wide screens. */
  collapsed: boolean;
  /** Group ids whose items are folded away. */
  folded: string[];
  /** Nav keys (see `navKey`) the user chose to hide. */
  hidden: string[];
};

export const DEFAULT_SIDEBAR_PREFS: SidebarPrefs = { collapsed: false, folded: [], hidden: [] };

function keys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const valid = value.filter((key): key is string => typeof key === "string" && /^[a-z0-9:_-]{1,64}$/.test(key));
  return [...new Set(valid)].slice(0, 64);
}

export function parseSidebarPrefs(raw: string | undefined): SidebarPrefs {
  if (!raw) return DEFAULT_SIDEBAR_PREFS;
  try {
    const value: unknown = JSON.parse(raw.startsWith("%7B") ? decodeURIComponent(raw) : raw);
    if (!value || typeof value !== "object") return DEFAULT_SIDEBAR_PREFS;
    const record = value as Record<string, unknown>;
    return { collapsed: record.collapsed === true, folded: keys(record.folded), hidden: keys(record.hidden) };
  } catch {
    return DEFAULT_SIDEBAR_PREFS;
  }
}

export function serializeSidebarPrefs(prefs: SidebarPrefs): string {
  return encodeURIComponent(JSON.stringify(prefs));
}
