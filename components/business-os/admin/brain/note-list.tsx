"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { businessGet } from "@/components/business-os/business-post";
import { AudienceIcon, CalendarIcon, ChartIcon, CheckCircleIcon, ChevronDownIcon, CloseIcon, NoteIcon, PlusIcon, ProjectIcon, SearchIcon, SortIcon, UserIcon } from "@/components/business-os/ui/icons";
import { Popover, useSheetClose } from "@/components/business-os/ui/overlay";
import { Button, Card, EmptyState } from "@/components/business-os/ui/primitives";
import { DAILY_FOLDER, NOTE_TEMPLATES, dailyBody, dayStamp } from "@/lib/business-os/brain/templates";
import { noteKey } from "@/lib/business-os/brain/wikilinks";
import { relativeTime } from "@/lib/business-os/workspace/format";
import type { NoteLink, NoteMeta } from "@/lib/business-os/workspace/load";

export type NewNote = { title?: string; body?: string; folder?: string };

type Sort = "recent" | "title";
type Hit = { id: string; snippet: string | null };

/* Sort order, remembered per browser. */
const SORT_KEY = "bos-notes-sort";
const sortListeners = new Set<() => void>();
function readSort(): Sort {
  try {
    return window.localStorage.getItem(SORT_KEY) === "title" ? "title" : "recent";
  } catch {
    return "recent";
  }
}
function writeSort(sort: Sort) {
  try {
    window.localStorage.setItem(SORT_KEY, sort);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  sortListeners.forEach((listener) => listener());
}
function subscribeSort(listener: () => void) {
  sortListeners.add(listener);
  return () => sortListeners.delete(listener);
}

const TOP_TAGS = 8;

/** Server snippets mark hits as `<<word>>`; render those as <mark>. */
function Snippet({ text }: { text: string }) {
  const parts = text.split(/<<(.*?)>>/g);
  return <>{parts.map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part))}</>;
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

const TEMPLATE_ICONS: Record<string, ReactNode> = {
  meeting: <AudienceIcon size={16} />,
  decision: <CheckCircleIcon size={16} />,
  contact: <UserIcon size={16} />,
  project: <ProjectIcon size={16} />,
  weekly: <ChartIcon size={16} />,
};

function StartItem({ icon, label, hint, onSelect }: { icon: ReactNode; label: string; hint: string; onSelect: () => void }) {
  return (
    <button type="button" role="menuitem" className="bos-menu-item bos-notes-start-item" onClick={onSelect}>
      <span className="bos-notes-start-item__icon">{icon}</span>
      <span className="bos-notes-start-item__text">
        <span className="bos-notes-start-item__label">{label}</span>
        <span className="bos-notes-start-item__hint">{hint}</span>
      </span>
    </button>
  );
}

/** Contents of the "Start a note" popover; closes it after a choice. */
function NewNoteOptions({ daily, onBlank, onDaily, onTemplate }: { daily: boolean; onBlank: () => void; onDaily: () => void; onTemplate: (id: string) => void }) {
  const close = useSheetClose();
  const pick = (action: () => void) => () => {
    close();
    action();
  };
  const today = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="bos-notes-menu" role="menu" aria-label="Start a note">
      <StartItem icon={<PlusIcon size={16} />} label="Blank note" hint="An empty page. Same as the New button." onSelect={pick(onBlank)} />
      <StartItem icon={<CalendarIcon size={16} />} label={daily ? "Open today's daily note" : "Today's daily note"} hint={`${today} · focus, notes and what got done`} onSelect={pick(onDaily)} />
      <div className="bos-menu-sep" />
      <p className="bos-menu-label">Templates</p>
      {NOTE_TEMPLATES.map((template) => (
        <StartItem key={template.id} icon={TEMPLATE_ICONS[template.id] ?? <NoteIcon size={16} />} label={template.label} hint={template.description} onSelect={pick(() => onTemplate(template.id))} />
      ))}
    </div>
  );
}

function SortOptions({ sort }: { sort: Sort }) {
  const close = useSheetClose();
  const options: [Sort, string][] = [
    ["recent", "Recently edited"],
    ["title", "A–Z"],
  ];
  return (
    <div role="menu" aria-label="Sort notes">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="menuitemradio"
          aria-checked={sort === value}
          className="bos-menu-item"
          onClick={() => {
            writeSort(value);
            close();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Left panel: search, filters, view switch, vault menu and the list of notes. */
export function NoteList({
  notes,
  links,
  selected,
  canWrite,
  view,
  onView,
  onSelect,
  onCreate,
  filter,
  onFilter,
  vault,
}: {
  notes: NoteMeta[];
  links: NoteLink[];
  selected: string | null;
  canWrite: boolean;
  view: "note" | "graph";
  onView: (view: "note" | "graph") => void;
  onSelect: (id: string) => void;
  onCreate: (note?: NewNote) => void;
  /** Search text; lifted so the editor can filter by a tag. */
  filter: string;
  onFilter: (filter: string) => void;
  /** The vault import/export menu, rendered in the toolbar for writers. */
  vault: ReactNode;
}) {
  const searchId = useId();
  const sort = useSyncExternalStore(subscribeSort, readSort, () => "recent" as Sort);
  const [folder, setFolder] = useState<string | null>(null);
  const [allTags, setAllTags] = useState(false);
  const [open, setOpen] = useState({ folders: false, tags: false });
  const [textHits, setTextHits] = useState<{ q: string; hits: Hit[] } | null>(null);

  const query = filter.trim().toLowerCase();
  const tagFilter = /^#\S+$/.test(query) ? query.slice(1) : null;
  const textQuery = tagFilter === null && query.length >= 3 ? query : "";
  // Hits from an older query are ignored rather than cleared.
  const hits = textHits && textHits.q === textQuery ? textHits.hits : null;

  useEffect(() => {
    if (!textQuery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await businessGet(`/api/business-os/notes/search?q=${encodeURIComponent(textQuery)}`, { signal: controller.signal }).catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { result?: Hit[] };
      if (Array.isArray(payload.result)) setTextHits({ q: textQuery, hits: payload.result });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [textQuery]);

  // "/" jumps to search unless the person is already typing somewhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      document.getElementById(searchId)?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchId]);

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) counts.set(note.folder, (counts.get(note.folder) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
  }, [notes]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) for (const tag of new Set(note.tags.map((item) => item.toLowerCase()))) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
  }, [notes]);

  const backlinks = useMemo(() => {
    const from = new Map<string, Set<string>>();
    for (const link of links) {
      const set = from.get(link.toKey) ?? new Set<string>();
      set.add(link.from);
      from.set(link.toKey, set);
    }
    return from;
  }, [links]);

  const visible = useMemo(() => {
    let list = folder === null ? notes : notes.filter((note) => note.folder === folder);
    if (tagFilter !== null) {
      list = list.filter((note) => note.tags.some((tag) => tag.toLowerCase() === tagFilter));
    } else if (query) {
      const ids = new Set((hits ?? []).map((hit) => hit.id));
      list = list.filter((note) => ids.has(note.id) || note.key.includes(query) || note.tags.some((tag) => tag.toLowerCase().includes(query)));
    }
    if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" }));
    return list;
  }, [notes, folder, tagFilter, query, hits, sort]);

  const filtered = folder !== null || query !== "";
  const folderName = (name: string) => name || "Top level";

  function clear() {
    setFolder(null);
    onFilter("");
  }

  const dailyExists = notes.some((note) => note.key === noteKey(dayStamp(new Date())));

  function openDaily() {
    const day = dayStamp(new Date());
    const existing = notes.find((note) => note.key === noteKey(day));
    if (existing) onSelect(existing.id);
    else onCreate({ title: day, folder: DAILY_FOLDER, body: dailyBody(day) });
  }

  function createFromTemplate(id: string) {
    const template = NOTE_TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    const day = dayStamp(new Date());
    onCreate({ title: template.title(day), folder: template.folder, body: template.body(day) });
  }

  const activeLabel = [
    folder !== null ? `in ${folderName(folder)}` : null,
    tagFilter !== null ? `tagged #${tagFilter}` : query ? `matching “${filter.trim()}”` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const shownTags = allTags ? tags : tags.slice(0, TOP_TAGS);

  return (
    <aside className="bos-notes__list" aria-label="Notes">
      <div className="bos-notes-bar">
        <div className="bos-notes-search">
          <SearchIcon size={16} />
          <input
            id={searchId}
            className="bos-notes-search__input"
            type="search"
            aria-label="Search notes"
            aria-keyshortcuts="/"
            placeholder="Search notes"
            autoComplete="off"
            spellCheck={false}
            value={filter}
            onChange={(event) => onFilter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && filter) {
                event.preventDefault();
                onFilter("");
              }
            }}
          />
          {filter ? (
            <button type="button" className="bos-notes-search__clear" aria-label="Clear search" onClick={() => {
              onFilter("");
              document.getElementById(searchId)?.focus();
            }}>
              <CloseIcon size={14} />
            </button>
          ) : (
            <kbd className="bos-notes-search__key" aria-hidden="true" title="Press / to search">/</kbd>
          )}
        </div>
        {canWrite ? (
          <div className="bos-notes-new">
            <button type="button" className="bos-notes-new__main" title="New blank note" onClick={() => onCreate()}>
              <PlusIcon size={16} />
              New
            </button>
            <Popover label={<ChevronDownIcon size={14} />} title="Start a note" ariaLabel="More ways to start a note" variant="primary" iconOnly align="end" buttonClassName="bos-notes-new__more">
              <NewNoteOptions daily={dailyExists} onBlank={() => onCreate()} onDaily={openDaily} onTemplate={createFromTemplate} />
            </Popover>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="bos-seg" role="tablist" aria-label="View">
          <button type="button" role="tab" className="bos-seg__item" aria-selected={view === "note"} onClick={() => onView("note")}>
            Notes
          </button>
          <button type="button" role="tab" className="bos-seg__item" aria-selected={view === "graph"} onClick={() => onView("graph")}>
            Graph
          </button>
        </div>
        <span className="flex-1" />
        {notes.length > 1 ? (
          <Popover label={<><SortIcon size={14} />{sort === "title" ? "A–Z" : "Recent"}</>} title="Sort notes" ariaLabel={`Sort notes: ${sort === "title" ? "A–Z" : "recently edited"}`} variant="ghost" size="sm" align="end">
            <SortOptions sort={sort} />
          </Popover>
        ) : null}
        {canWrite ? vault : null}
      </div>

      {notes.length > 0 && (folders.length > 1 || tags.length > 0) ? (
        <div className="bos-notes-filters">
          {folders.length > 1 ? (
            <details open={open.folders} onToggle={(event) => setOpen((value) => ({ ...value, folders: event.currentTarget.open }))}>
              <summary>Folders</summary>
              <div className="bos-chips">
                {folders.map(([name, count]) => (
                  <button key={name || "_top"} type="button" className="bos-chip bos-notes-chip" aria-pressed={folder === name} onClick={() => setFolder(folder === name ? null : name)}>
                    {folderName(name)} <span className="bos-notes-chip__count">{count}</span>
                  </button>
                ))}
              </div>
            </details>
          ) : null}
          {tags.length > 0 ? (
            <details open={open.tags} onToggle={(event) => setOpen((value) => ({ ...value, tags: event.currentTarget.open }))}>
              <summary>Tags</summary>
              <div className="bos-chips">
                {shownTags.map(([tag, count]) => (
                  <button key={tag} type="button" className="bos-chip bos-notes-chip" aria-pressed={tagFilter === tag} onClick={() => onFilter(tagFilter === tag ? "" : `#${tag}`)}>
                    #{tag} <span className="bos-notes-chip__count">{count}</span>
                  </button>
                ))}
                {tags.length > TOP_TAGS ? (
                  <button type="button" className="bos-notes-more" aria-expanded={allTags} onClick={() => setAllTags((value) => !value)}>
                    {allTags ? "Show fewer" : `Show all ${tags.length}`}
                  </button>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {filtered ? (
        <div className="bos-notes-active">
          <span className="bos-caption min-w-0 flex-1 truncate">Showing notes {activeLabel}</span>
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
      ) : null}

      {notes.length === 0 && canWrite ? (
        <div className="bos-notes-start">
          <button type="button" className="bos-notes-start__card" onClick={() => onCreate()}>
            <PlusIcon size={18} />
            <span>
              <strong>Write your first note</strong>
              <span className="bos-caption">A page for anything: an idea, a process, a client.</span>
            </span>
          </button>
          <button type="button" className="bos-notes-start__card" onClick={openDaily}>
            <CalendarIcon size={18} />
            <span>
              <strong>Start today&apos;s daily note</strong>
              <span className="bos-caption">A dated page for today&apos;s focus, notes and what got done.</span>
            </span>
          </button>
          <div className="bos-notes-start__card" data-static="">
            <NoteIcon size={18} />
            <span>
              <strong>Bring in an Obsidian vault</strong>
              <span className="bos-caption">Use the Vault menu above to import a folder or .zip of Markdown files. Links and tags come with them.</span>
            </span>
          </div>
        </div>
      ) : (
        <Card className="bos-notes__items">
          {notes.length === 0 ? (
            <EmptyState icon={<NoteIcon />} title="No notes yet">
              Nothing has been written yet.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No notes match"
              action={
                <Button size="sm" onClick={clear}>
                  Clear filters
                </Button>
              }
            >
              Nothing {activeLabel}.
            </EmptyState>
          ) : (
            <ul className="flex flex-col p-1">
              {visible.map((note) => {
                const snippet = hits?.find((item) => item.id === note.id)?.snippet;
                const from = backlinks.get(note.key);
                const linked = from ? from.size - (from.has(note.id) ? 1 : 0) : 0;
                return (
                  <li key={note.id}>
                    <button type="button" className="bos-note-item" aria-current={note.id === selected ? "true" : undefined} onClick={() => onSelect(note.id)}>
                      <span className="bos-notes-row__head">
                        <span className="bos-note-item__title">{note.title}</span>
                        {linked > 0 ? (
                          <span className="bos-notes-row__links" title={`Linked from ${plural(linked, "note")}`} aria-label={`Linked from ${plural(linked, "note")}`}>
                            ← {linked}
                          </span>
                        ) : null}
                      </span>
                      <span className="bos-caption truncate">
                        {note.folder ? `${note.folder} · ` : ""}
                        {relativeTime(note.updatedAt)}
                      </span>
                      {snippet ? (
                        <span className="bos-caption bos-snippet bos-notes-row__snippet">
                          <Snippet text={snippet} />
                        </span>
                      ) : null}
                      {note.tags.length > 0 ? (
                        <span className="bos-notes-row__tags">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="bos-notes-row__tag">
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 3 ? <span className="bos-caption">+{note.tags.length - 3}</span> : null}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
      <p className="bos-caption">
        {plural(notes.length, "note")} · {plural(links.length, "link")}
        {filtered ? ` · showing ${visible.length}` : ""}
      </p>
    </aside>
  );
}
