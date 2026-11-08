"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { businessGet, businessPost } from "@/components/business-os/business-post";
import { explain, NOTE_ERRORS, type SaveResult } from "@/components/business-os/admin/brain/note-shared";
import { DocumentIcon, DownloadIcon, MoreIcon, PlusIcon, TrashIcon } from "@/components/business-os/ui/icons";
import { Markdown } from "@/components/business-os/ui/markdown";
import { Popover, useIsMobile, useSheetClose, useToast } from "@/components/business-os/ui/overlay";
import { Button, Card, Notice } from "@/components/business-os/ui/primitives";
import {
  completeLink,
  insertMarkdownLink,
  insertText,
  linkQuery,
  outline,
  readingMinutes,
  toggleLinePrefix,
  toggleTaskAtLine,
  wordCount,
  wrapSelection,
  type Edit,
} from "@/lib/business-os/brain/editing";
import { noteKey, titleProblem, wikilinksToMarkdown } from "@/lib/business-os/brain/wikilinks";
import { relativeTime } from "@/lib/business-os/workspace/format";
import type { NoteMeta } from "@/lib/business-os/workspace/load";

type Loaded = { id: string; title: string; folder: string; body: string; documentId: string | null };
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type Mode = "edit" | "split" | "preview";

const AUTOSAVE_MS = 900;
const PLACEHOLDER = "Start writing…\n\n# Heading   **bold**   - list   - [ ] task\n[[Note title]] links a note · #tag adds a tag";

type Tool = { label: ReactNode; name: string; keys?: string; run: (text: string, start: number, end: number) => Edit };

const TOOLS: Tool[] = [
  { label: "H1", name: "Heading 1", run: (t, s, e) => toggleLinePrefix(t, s, e, "# ") },
  { label: "H2", name: "Heading 2", run: (t, s, e) => toggleLinePrefix(t, s, e, "## ") },
  { label: <b>B</b>, name: "Bold", keys: "B", run: (t, s, e) => wrapSelection(t, s, e, "**", "**", "bold text") },
  { label: <i>I</i>, name: "Italic", keys: "I", run: (t, s, e) => wrapSelection(t, s, e, "_", "_", "italic text") },
  { label: "•", name: "Bulleted list", run: (t, s, e) => toggleLinePrefix(t, s, e, "- ") },
  { label: "1.", name: "Numbered list", run: (t, s, e) => toggleLinePrefix(t, s, e, "1. ") },
  { label: "☐", name: "Checklist", run: (t, s, e) => toggleLinePrefix(t, s, e, "- [ ] ") },
  { label: "❝", name: "Quote", run: (t, s, e) => toggleLinePrefix(t, s, e, "> ") },
  { label: "</>", name: "Inline code", run: (t, s, e) => wrapSelection(t, s, e, "`", "`", "code") },
  { label: "Link", name: "Link", keys: "K", run: insertMarkdownLink },
  { label: "[[ ]]", name: "Note link", keys: "Shift K", run: (t, s, e) => wrapSelection(t, s, e, "[[", "]]", "") },
  // A blank line before keeps `---` from turning the previous line into a heading.
  { label: "—", name: "Divider", run: (t, s, e) => insertText(t, s, e, `${s > 0 ? "\n" : ""}---\n`, true) },
];

const MIRROR_STYLES = [
  "box-sizing", "width", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "word-spacing", "tab-size",
];

/** Pixel offset of the caret at `position` from the textarea's top, measured with an off-screen copy of its text. */
function caretTop(area: HTMLTextAreaElement, position: number): number {
  const style = getComputedStyle(area);
  const mirror = document.createElement("div");
  for (const name of MIRROR_STYLES) mirror.style.setProperty(name, style.getPropertyValue(name));
  Object.assign(mirror.style, { position: "absolute", top: "0", left: "-9999px", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word" });
  mirror.textContent = area.value.slice(0, position);
  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.append(marker);
  document.body.append(mirror);
  const top = marker.offsetTop;
  mirror.remove();
  return top;
}

function lineOffset(text: string, line: number): number {
  let offset = 0;
  for (let index = 1; index < line; index += 1) {
    const next = text.indexOf("\n", offset);
    if (next === -1) return text.length;
    offset = next + 1;
  }
  return offset;
}

function MenuAction({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  const close = useSheetClose();
  return (
    <button
      type="button"
      role="menuitem"
      className="bos-menu-item"
      data-danger={danger ? "" : undefined}
      onClick={() => {
        onClick();
        close();
      }}
    >
      {children}
    </button>
  );
}

function NoteActions({ canWrite, onDuplicate, onDownload, onCopyLink, onDelete }: { canWrite: boolean; onDuplicate?: () => void; onDownload: () => void; onCopyLink: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const close = useSheetClose();
  if (confirm) {
    return (
      <div className="bos-note-confirm">
        <p className="text-sm">Delete this note? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              close();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div role="menu" className="flex flex-col">
      {canWrite && onDuplicate ? (
        <MenuAction onClick={onDuplicate}>
          <PlusIcon size={16} />
          Duplicate
        </MenuAction>
      ) : null}
      <MenuAction onClick={onDownload}>
        <DownloadIcon size={16} />
        Download .md
      </MenuAction>
      <MenuAction onClick={onCopyLink}>
        <DocumentIcon size={16} />
        Copy link
      </MenuAction>
      {canWrite ? (
        <>
          <div className="bos-menu-sep" />
          <button type="button" role="menuitem" className="bos-menu-item" data-danger="" onClick={() => setConfirm(true)}>
            <TrashIcon size={16} />
            Delete note
          </button>
        </>
      ) : null}
    </div>
  );
}

function SideCard({ label, caption, children }: { label: ReactNode; caption?: ReactNode; children?: ReactNode }) {
  return (
    <Card pad className="flex flex-col gap-2">
      <p className="bos-label">{label}</p>
      {caption ? <p className="bos-caption">{caption}</p> : null}
      {children}
    </Card>
  );
}

export function NoteEditor({
  meta,
  canWrite,
  backlinks,
  outgoing,
  resolve,
  onOpenTitle,
  onOpen,
  onBack,
  onSaved,
  onDelete,
  allNotes,
  onCreate,
  onTag,
}: {
  meta: NoteMeta;
  canWrite: boolean;
  backlinks: NoteMeta[];
  outgoing: string[];
  resolve: (title: string) => NoteMeta | null;
  onOpenTitle: (title: string) => void;
  onOpen: (id: string) => void;
  onBack?: () => void;
  onSaved: (result: SaveResult, folder: string) => void;
  onDelete: () => void;
  /** Every note, for `[[` completion, the folder suggestions and the "mentions" card. */
  allNotes?: NoteMeta[];
  /** Creates a note; used by Duplicate. */
  onCreate?: (note: { title?: string; body?: string; folder?: string }) => void;
  /** Called when a tag chip is clicked, to filter the list by that tag. */
  onTag?: (tag: string) => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState(meta.title);
  const [folder, setFolder] = useState(meta.folder);
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [state, setState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [popTop, setPopTop] = useState(0);
  const [mentionIds, setMentionIds] = useState<string[] | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const folderListId = useId();
  const mobile = useIsMobile();
  const toast = useToast();
  const inFlight = useRef(false);
  // The title last saved. Autosave keeps it, so a half-typed title never renames the note.
  const committedTitle = useRef(meta.title);
  const pending = useRef(false);
  // A title commit asked for while another save was running; carried into the follow-up save.
  const pendingCommit = useRef(false);
  // What the server last accepted, so "unsaved" never depends on the status label alone.
  const lastSaved = useRef({ folder: meta.folder, body: "" });
  const running = useRef<Promise<unknown> | null>(null);
  const saveAgain = useRef<(commitTitle: boolean) => void>(() => {});
  const latest = useRef({ title, folder, body });
  const savedRef = useRef(onSaved);
  useEffect(() => {
    latest.current = { title, folder, body };
  }, [title, folder, body]);
  useEffect(() => {
    savedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await businessGet(`/api/business-os/notes/get?id=${meta.id}`).catch(() => null);
      const payload = response ? ((await response.json().catch(() => ({}))) as { result?: Loaded; error?: string }) : {};
      if (cancelled) return;
      if (!response?.ok || !payload.result) {
        setLoadError(payload.error === "note_missing" ? NOTE_ERRORS.note_missing : "This note could not be loaded.");
        return;
      }
      setLoaded(payload.result);
      committedTitle.current = payload.result.title;
      lastSaved.current = { folder: payload.result.folder, body: payload.result.body };
      setTitle(payload.result.title);
      setFolder(payload.result.folder);
      setBody(payload.result.body);
      setMode(payload.result.body.trim() ? "preview" : "edit");
    })();
    return () => {
      cancelled = true;
    };
  }, [meta.id]);

  // Notes whose text uses this title. Search only sees words, so these are candidates, not proof.
  const searchMentions = Boolean(allNotes) && meta.title.trim().length >= 3;
  useEffect(() => {
    if (!searchMentions) return;
    const controller = new AbortController();
    (async () => {
      const response = await businessGet(`/api/business-os/notes/search?q=${encodeURIComponent(meta.title.trim())}`, { signal: controller.signal }).catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { result?: { id: string }[] };
      if (!controller.signal.aborted && Array.isArray(payload.result)) setMentionIds(payload.result.map((hit) => hit.id));
    })();
    return () => controller.abort();
  }, [searchMentions, meta.id, meta.title]);

  const save = useCallback(async (commitTitle = false) => {
    if (!canWrite) return;
    if (inFlight.current) {
      pending.current = true;
      if (commitTitle) pendingCommit.current = true;
      return;
    }
    const snapshot = { ...latest.current, title: commitTitle ? latest.current.title : committedTitle.current };
    const problem = titleProblem(snapshot.title);
    if (problem) {
      setState("error");
      setSaveError(problem);
      return;
    }
    inFlight.current = true;
    setState("saving");
    const request = businessPost("/api/business-os/notes/save", { id: meta.id, title: snapshot.title, folder: snapshot.folder, body: snapshot.body });
    running.current = request;
    const response = await request;
    inFlight.current = false;
    running.current = null;
    const result = response.payload.result as SaveResult | undefined;
    if (!response.ok || !result) {
      pending.current = false;
      pendingCommit.current = false;
      setState("error");
      setSaveError(explain(response.payload));
      return;
    }
    lastSaved.current = { folder: snapshot.folder, body: snapshot.body };
    committedTitle.current = result.title;
    // A body save must not hide an earlier rejected rename that is still in the title field.
    if (commitTitle || latest.current.title.trim() === result.title) setSaveError(null);
    savedRef.current(result, snapshot.folder);
    if (pending.current) {
      // Edits (or a rename) arrived while saving: save them now rather than waiting for another keystroke.
      const commit = pendingCommit.current;
      pending.current = false;
      pendingCommit.current = false;
      saveAgain.current(commit);
      return;
    }
    const current = latest.current;
    setState(current.body === snapshot.body && current.folder === snapshot.folder ? "saved" : "dirty");
  }, [canWrite, meta.id]);

  useEffect(() => {
    saveAgain.current = (commitTitle) => void save(commitTitle);
  }, [save]);

  // Leaving the note (another note, a link, another section) cancels the autosave timer:
  // send whatever is still unsaved once more, after any save already on the wire.
  useEffect(() => {
    return () => {
      if (!canWrite) return;
      const { body: text, folder: place } = latest.current;
      if (text === lastSaved.current.body && place === lastSaved.current.folder) return;
      const flush = () =>
        businessPost("/api/business-os/notes/save", { id: meta.id, title: committedTitle.current, folder: place, body: text }).then((response) => {
          const result = response.payload.result as SaveResult | undefined;
          if (response.ok && result) savedRef.current(result, place);
        });
      void (running.current ?? Promise.resolve()).then(flush, flush);
    };
  }, [canWrite, meta.id]);

  // Autosave the body shortly after typing stops; title and folder save when the field loses focus.
  useEffect(() => {
    if (state !== "dirty") return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [state, body, save]);

  // Save on Cmd/Ctrl+S, and flush unsaved text if the tab is closed.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save(true);
      }
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      const { body: text, folder: place } = latest.current;
      if (state === "saving" || text !== lastSaved.current.body || place !== lastSaved.current.folder) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, state]);

  const view: Mode = !canWrite ? "preview" : mode === "split" && mobile ? "edit" : mode;
  const editing = view !== "preview";

  // Grow the textarea with its text, keeping the page where it was.
  useLayoutEffect(() => {
    const element = area.current;
    if (!element) return;
    const y = window.scrollY;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    if (window.scrollY !== y) window.scrollTo(0, y);
  }, [body, view, loaded]);

  const preview = useMemo(() => wikilinksToMarkdown(body), [body]);
  const headings = useMemo(() => outline(body), [body]);
  const words = useMemo(() => wordCount(body), [body]);
  const unresolved = outgoing.filter((key) => !resolve(key));
  const folders = useMemo(() => [...new Set((allNotes ?? []).map((note) => note.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [allNotes]);
  const backlinkIds = new Set(backlinks.map((note) => note.id));
  const mentions = mentionIds && allNotes ? mentionIds.flatMap((id) => (id === meta.id || backlinkIds.has(id) ? [] : allNotes.filter((note) => note.id === id))) : null;

  const query = editing && focused ? linkQuery(body, caret) : null;
  const open = query && query.from !== dismissedAt ? query : null;
  const options = useMemo(() => {
    if (!open) return [];
    const q = open.query.trim().toLowerCase();
    const others = (allNotes ?? []).filter((note) => note.id !== meta.id);
    const starts = others.filter((note) => note.title.toLowerCase().startsWith(q));
    const contains = q ? others.filter((note) => !note.title.toLowerCase().startsWith(q) && note.title.toLowerCase().includes(q)) : [];
    const list: { title: string; label: string }[] = [...starts, ...contains].slice(0, 8).map((note) => ({ title: note.title, label: note.title }));
    const typed = open.query.trim();
    if (typed && !titleProblem(typed) && !others.some((note) => note.key === noteKey(typed))) list.push({ title: typed, label: `Link to “${typed}”` });
    return list;
  }, [open, allNotes, meta.id]);
  const showList = open !== null && options.length > 0;
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));

  function track(element: HTMLTextAreaElement) {
    const position = element.selectionStart;
    setCaret(position);
    const next = linkQuery(element.value, position);
    if (!next || next.from !== open?.from) setActive(0);
    if (next) setPopTop(caretTop(element, position));
  }

  function apply(edit: Edit) {
    setBody(edit.text);
    setState("dirty");
    setDismissedAt(null);
    requestAnimationFrame(() => {
      const element = area.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(edit.start, edit.end);
      track(element);
    });
  }

  function runTool(tool: Tool) {
    const element = area.current;
    if (!element) return;
    apply(tool.run(body, element.selectionStart, element.selectionEnd));
  }

  function pick(index: number) {
    const option = options[index];
    if (!open || !option) return;
    apply(completeLink(body, open.from, caret, option.title));
  }

  function onEditorKey(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (showList) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((activeIndex + step + options.length) % options.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        pick(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDismissedAt(open.from);
        return;
      }
    }
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const tool = key === "b" ? TOOLS[2] : key === "i" ? TOOLS[3] : key === "k" ? (event.shiftKey ? TOOLS[10] : TOOLS[9]) : null;
    if (!tool) return;
    event.preventDefault();
    runTool(tool);
  }

  function toggleTask(line: number) {
    if (!canWrite) return;
    const next = toggleTaskAtLine(body, line);
    if (next === body) return;
    setBody(next);
    setState("dirty");
  }

  function goToHeading(line: number) {
    if (view !== "edit") {
      previewRef.current?.querySelector(`[data-line="${line}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const element = area.current;
    if (!element) return;
    const offset = lineOffset(body, line);
    element.focus({ preventScroll: true });
    element.setSelectionRange(offset, offset);
    setCaret(offset);
    const y = element.getBoundingClientRect().top + caretTop(element, offset);
    window.scrollBy({ top: y - 120, behavior: "smooth" });
  }

  function download() {
    const url = URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.trim() || "Note"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function copyLink() {
    const url = `${window.location.origin}/admin?section=notes&note=${meta.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast("Link copied"),
      () => toast("The link could not be copied.", "bad"),
    );
  }

  async function openFile() {
    if (!loaded?.documentId) return;
    const popup = window.open("", "_blank");
    const response = await businessPost("/api/business-os/documents/file", { documentId: loaded.documentId, preview: true });
    const url = typeof response.payload.url === "string" ? response.payload.url : null;
    if (!url) {
      popup?.close();
      setSaveError("The linked file could not be opened.");
      return;
    }
    if (popup) popup.location.href = url;
    else window.location.assign(url);
  }

  if (loadError) return <Notice tone="bad">{loadError}</Notice>;
  if (!loaded) return <Card pad><p className="bos-caption">Opening…</p></Card>;

  const status = state === "saving" ? "Saving…" : state === "dirty" ? "Unsaved" : state === "saved" ? "Saved" : state === "error" ? "Not saved" : `Edited ${relativeTime(meta.updatedAt)}`;
  const counts = words > 0 ? ` · ${words} ${words === 1 ? "word" : "words"} · ${readingMinutes(words)} min read` : "";
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

  const renderedPreview = body.trim() ? (
    <Markdown onNoteLink={onOpenTitle} resolved={(target) => resolve(target) !== null} onToggleTask={canWrite ? toggleTask : undefined} headingLines>
      {preview}
    </Markdown>
  ) : (
    <p className="bos-caption">This note is empty.</p>
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
      <Card pad className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← Notes
            </Button>
          ) : null}
          {canWrite ? (
            <div className="bos-seg" role="tablist" aria-label="Mode">
              <button type="button" role="tab" className="bos-seg__item" aria-selected={view === "edit"} onClick={() => setMode("edit")}>
                Edit
              </button>
              {mobile ? null : (
                <button type="button" role="tab" className="bos-seg__item" aria-selected={view === "split"} onClick={() => setMode("split")}>
                  Split
                </button>
              )}
              <button type="button" role="tab" className="bos-seg__item" aria-selected={view === "preview"} onClick={() => setMode("preview")}>
                Preview
              </button>
            </div>
          ) : null}
          <span className="flex-1" />
          <span className="bos-caption" role="status">
            {status}
            {counts}
          </span>
          <Popover label={<MoreIcon />} title="Note actions" ariaLabel="Note actions" variant="ghost" size="sm" iconOnly align="end">
            <NoteActions
              canWrite={canWrite}
              onDuplicate={onCreate ? () => onCreate({ title: `${title.trim()} copy`, body, folder }) : undefined}
              onDownload={download}
              onCopyLink={copyLink}
              onDelete={onDelete}
            />
          </Popover>
        </div>
        {saveError ? <Notice tone="bad">{saveError}</Notice> : null}
        <input
          className="bos-note-title"
          aria-label="Title"
          value={title}
          readOnly={!canWrite}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title.trim() !== committedTitle.current) void save(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") (event.target as HTMLInputElement).blur();
          }}
        />
        <div className="bos-note-folder">
          <label className="bos-caption flex items-center gap-2">
            Folder
            <input
              className="bos-input"
              data-size="sm"
              value={folder}
              readOnly={!canWrite}
              placeholder="Top level"
              maxLength={200}
              list={canWrite ? folderListId : undefined}
              onChange={(event) => {
                setFolder(event.target.value);
                setState("dirty");
              }}
              onBlur={() => {
                if (state === "dirty") void save();
              }}
            />
          </label>
          {canWrite ? <span className="bos-caption">Group related notes, e.g. Clients or Meetings/2026</span> : null}
          {canWrite ? (
            <datalist id={folderListId}>
              {folders.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          ) : null}
        </div>
        {editing ? (
          <div className="bos-note-toolbar" role="toolbar" aria-label="Formatting">
            {TOOLS.map((tool) => {
              const hint = tool.keys ? `${tool.name} (${mod}${tool.keys.replace(" ", "+")})` : tool.name;
              return (
                <button
                  key={tool.name}
                  type="button"
                  className="bos-note-tool"
                  aria-label={tool.name}
                  title={hint}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runTool(tool)}
                >
                  {tool.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="bos-note-body" data-view={view}>
          {editing ? (
            <div className="bos-note-write">
              <textarea
                ref={area}
                className="bos-note-editor"
                aria-label="Note text"
                value={body}
                spellCheck
                placeholder={PLACEHOLDER}
                role="combobox"
                aria-expanded={showList}
                aria-controls={showList ? listId : undefined}
                aria-autocomplete="list"
                aria-activedescendant={showList ? `${listId}-${activeIndex}` : undefined}
                onChange={(event) => {
                  setBody(event.target.value);
                  setState("dirty");
                  setDismissedAt((value) => (value !== null && linkQuery(event.target.value, event.target.selectionStart)?.from === value ? value : null));
                  track(event.target);
                }}
                onSelect={(event) => track(event.currentTarget)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={onEditorKey}
              />
              {showList ? (
                <ul id={listId} role="listbox" aria-label="Link to a note" className="bos-note-suggest" style={{ top: popTop + 26 }}>
                  {options.map((option, index) => (
                    <li
                      key={option.label}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className="bos-note-suggest__item"
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(index)}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {view !== "edit" ? (
            <div ref={previewRef} className="bos-note-preview">
              {renderedPreview}
            </div>
          ) : null}
        </div>
      </Card>

      <aside className="flex flex-col gap-4">
        {headings.length >= 2 ? (
          <SideCard label="Outline">
            <ul className="flex flex-col gap-1">
              {headings.map((heading) => (
                <li key={heading.line} style={{ paddingInlineStart: `${(Math.min(heading.level, 4) - 1) * 12}px` }}>
                  <button type="button" className="bos-note-outline text-sm" onClick={() => goToHeading(heading.line)}>
                    {heading.text}
                  </button>
                </li>
              ))}
            </ul>
          </SideCard>
        ) : null}
        <SideCard label={`Linked from · ${backlinks.length}`} caption={backlinks.length === 0 ? "No other note links here yet." : null}>
          {backlinks.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {backlinks.map((note) => (
                <li key={note.id}>
                  <button type="button" className="bos-wikilink text-sm" onClick={() => onOpen(note.id)}>
                    {note.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </SideCard>
        {searchMentions && mentions ? (
          <SideCard
            label={`Mentions this title · ${mentions.length}`}
            caption={mentions.length === 0 ? "No other note uses the words in this title." : "These notes use the words in this title but do not link here yet."}
          >
            {mentions.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {mentions.map((note) => (
                  <li key={note.id}>
                    <button type="button" className="bos-wikilink text-sm" onClick={() => onOpen(note.id)}>
                      {note.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </SideCard>
        ) : null}
        {unresolved.length > 0 ? (
          <SideCard label={`Not written yet · ${unresolved.length}`} caption={canWrite ? "Click to create the note." : "These links point to notes that do not exist yet."}>
            <ul className="flex flex-col gap-1">
              {unresolved.map((key) => (
                <li key={key}>
                  <button type="button" className="bos-wikilink text-sm" data-unresolved="" onClick={() => onOpenTitle(key)} disabled={!canWrite}>
                    {key}
                  </button>
                </li>
              ))}
            </ul>
          </SideCard>
        ) : null}
        <SideCard label="Tags" caption={meta.tags.length === 0 ? (canWrite ? "Type #tag anywhere in the text to add one." : "No tags.") : null}>
          {meta.tags.length > 0 ? (
            <div className="bos-chips flex flex-wrap gap-1">
              {meta.tags.map((tag) =>
                onTag ? (
                  <button key={tag} type="button" className="bos-chip bos-note-tag" title={`Show notes tagged #${tag}`} onClick={() => onTag(tag)}>
                    #{tag}
                  </button>
                ) : (
                  <span key={tag} className="bos-chip" style={{ paddingInlineEnd: "10px" }}>
                    #{tag}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </SideCard>
        {loaded.documentId ? (
          <SideCard label="Linked file">
            <Button size="sm" onClick={() => void openFile()}>
              <DocumentIcon size={16} />
              Open file
            </Button>
          </SideCard>
        ) : null}
      </aside>
    </div>
  );
}
