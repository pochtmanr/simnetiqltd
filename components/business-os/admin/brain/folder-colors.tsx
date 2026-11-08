"use client";

import { useCallback, useSyncExternalStore } from "react";
import { FOLDER_PALETTE, folderColor, parseFolderColors, topFolder, type FolderColors } from "@/components/business-os/admin/brain/note-shared";
import { CheckIcon } from "@/components/business-os/ui/icons";
import { Popover, useSheetClose } from "@/components/business-os/ui/overlay";

/** Folder colour picks live in this browser only. */
const KEY = "bos-folder-colors";
const EMPTY: FolderColors = {};
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: FolderColors } | null = null;

function read(): FolderColors {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked: fall back to the automatic colours.
  }
  if (!cache || cache.raw !== raw) cache = { raw, value: parseFolderColors(raw) };
  return cache.value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The user's folder colour picks, and a setter; `null` returns a folder to its automatic colour. */
export function useFolderColors(): [FolderColors, (folder: string, color: string | null) => void] {
  const picked = useSyncExternalStore(subscribe, read, () => EMPTY);
  const pick = useCallback((folder: string, color: string | null) => {
    const top = topFolder(folder);
    if (!top) return;
    const next = { ...read() };
    if (color) next[top] = color;
    else delete next[top];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      return;
    }
    for (const listener of listeners) listener();
  }, []);
  return [picked, pick];
}

function Swatches({ folder, picked, onPick }: { folder: string; picked: FolderColors; onPick: (folder: string, color: string | null) => void }) {
  const close = useSheetClose();
  const current = picked[topFolder(folder)] ?? null;
  return (
    <div className="bos-swatches">
      <div className="bos-swatches__grid" role="radiogroup" aria-label={`Colour for ${topFolder(folder)}`}>
        {FOLDER_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={current === color}
            aria-label={color}
            className="bos-swatch"
            style={{ background: color }}
            onClick={() => {
              onPick(folder, color);
              close();
            }}
          >
            {current === color ? <CheckIcon size={14} /> : null}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="bos-menu-item"
        aria-pressed={current === null}
        onClick={() => {
          onPick(folder, null);
          close();
        }}
      >
        Automatic
      </button>
    </div>
  );
}

/** A folder's colour dot that opens a palette. Top-level notes have no folder, so they get a plain grey dot. */
export function FolderColorPicker({ folder, picked, onPick, disabled }: { folder: string; picked: FolderColors; onPick: (folder: string, color: string | null) => void; disabled?: boolean }) {
  const top = topFolder(folder);
  const dot = <span className="bos-folder-dot" style={{ background: folderColor(folder, picked) }} aria-hidden="true" />;
  if (!top || disabled) return dot;
  return (
    <Popover title={`${top} colour`} ariaLabel={`Change the colour of ${top}`} variant="ghost" size="sm" iconOnly buttonClassName="bos-folder-pick" label={dot}>
      <Swatches folder={folder} picked={picked} onPick={onPick} />
    </Popover>
  );
}
