"use client";

import { useSyncExternalStore } from "react";
import { THEME_INIT_SCRIPT } from "@/components/theme-provider";

// React 19 emits a console warning when an inline <script> with
// dangerouslySetInnerHTML is reconciled on the client (it can't execute, so
// the warning flags it as a likely bug). Our script's only job is to set
// data-theme + color-scheme + meta theme-color BEFORE first paint, which
// only matters on the initial document load. On client navigation (e.g.
// /en → /he), the theme is already applied to <html> and ThemeProvider
// keeps it in sync — re-running the script would be a no-op.
//
// useSyncExternalStore with divergent server/client snapshots is the
// React-blessed way to render an element only during SSR. The script
// element ships in the initial HTML (and runs synchronously before paint),
// then on hydration the component flips to null and React removes it from
// its tree. Subsequent client renders never produce a <script> child, so
// the warning never fires.

const subscribe = () => () => {};
const getServerSnapshot = () => true;
const getClientSnapshot = () => false;

export function ThemeInitScript() {
  const isServer = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!isServer) return null;
  return (
    <script
      // The element rendered by SSR has identical content on every render,
      // so suppressHydrationWarning silences the dom-mismatch noise without
      // affecting actual reconciliation.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
