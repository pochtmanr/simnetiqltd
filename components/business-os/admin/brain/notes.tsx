"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NoteGraph, type GraphInput } from "@/components/business-os/admin/brain/graph";
import { NoteEditor } from "@/components/business-os/admin/brain/note-editor";
import { NoteList, type NewNote } from "@/components/business-os/admin/brain/note-list";
import { explain } from "@/components/business-os/admin/brain/note-shared";
import { VaultMenu } from "@/components/business-os/admin/brain/vault";
import { businessPost } from "@/components/business-os/business-post";
import { NoteIcon } from "@/components/business-os/ui/icons";
import { useIsMobile, useToast } from "@/components/business-os/ui/overlay";
import { Button, Card, EmptyState, Notice } from "@/components/business-os/ui/primitives";
import { uniqueTitle } from "@/lib/business-os/brain/templates";
import { noteKey, titleProblem } from "@/lib/business-os/brain/wikilinks";
import type { NoteLink, NoteMeta } from "@/lib/business-os/workspace/load";

function noteParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("note");
}

function rememberNote(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("note", id);
  else url.searchParams.delete("note");
  window.history.replaceState(window.history.state, "", url);
}

export function Notes({ rows, links: initialLinks, error, canWrite }: { rows: NoteMeta[]; links: NoteLink[]; error: string | null; canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const mobile = useIsMobile();
  const [notes, setNotes] = useState(rows);
  const [links, setLinks] = useState(initialLinks);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"note" | "graph">("note");
  const [filter, setFilter] = useState("");
  // Bumped after an import so the open editor reloads text the import may have replaced.
  const [reload, setReload] = useState(0);

  // A server refresh (after an import or rename) replaces the local copies.
  const [source, setSource] = useState({ rows, initialLinks });
  if (source.rows !== rows || source.initialLinks !== initialLinks) {
    setSource({ rows, initialLinks });
    setNotes(rows);
    setLinks(initialLinks);
  }
  useEffect(() => {
    const id = noteParam();
    // Read after hydration: the server render has no URL search params.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setSelected(id);
  }, []);

  const byKey = useMemo(() => new Map(notes.map((note) => [note.key, note])), [notes]);
  const graphInput = useMemo<GraphInput>(() => ({ notes, links }), [notes, links]);

  const select = useCallback((id: string | null) => {
    setSelected(id);
    setView("note");
    rememberNote(id);
  }, []);

  /** Creates a note (title made unique, "Untitled" by default) and opens it. An existing note with an exact title match is opened instead when `openExisting` is set. */
  async function create(note: NewNote = {}, openExisting = false): Promise<string | null> {
    if (!canWrite) return null;
    const wanted = note.title?.trim() || "Untitled";
    const existing = byKey.get(noteKey(wanted));
    if (openExisting && existing) {
      select(existing.id);
      return existing.id;
    }
    const name = uniqueTitle(wanted, new Set(byKey.keys()));
    const folder = note.folder ?? "";
    const response = await businessPost("/api/business-os/notes/save", { title: name, folder, body: note.body ?? "" });
    const result = response.payload.result as { id?: string; title?: string; updatedAt?: string; tags?: string[]; links?: string[] } | undefined;
    if (!response.ok || !result?.id) {
      toast(explain(response.payload), "bad");
      return null;
    }
    const id = result.id;
    const meta: NoteMeta = { id, title: result.title ?? name, key: noteKey(result.title ?? name), folder, tags: result.tags ?? [], documentId: null, updatedAt: result.updatedAt ?? new Date().toISOString() };
    setNotes((list) => [meta, ...list]);
    if (result.links?.length) setLinks((list) => [...list, ...(result.links ?? []).map((target) => ({ from: id, toKey: noteKey(target) }))]);
    select(id);
    return id;
  }

  /** Opens a note by title, creating it when a link points at a note that does not exist yet. */
  async function openTitle(title: string) {
    const existing = byKey.get(noteKey(title));
    if (existing) select(existing.id);
    else if (canWrite && !titleProblem(title)) await create({ title: title.trim() });
  }

  function applySaved(id: string, result: { title: string; updatedAt: string; tags: string[]; links: string[] }, folder: string) {
    setNotes((list) => {
      const rest = list.filter((note) => note.id !== id);
      const before = list.find((note) => note.id === id);
      return [{ id, title: result.title, key: noteKey(result.title), folder, tags: result.tags, documentId: before?.documentId ?? null, updatedAt: result.updatedAt }, ...rest];
    });
    setLinks((list) => [...list.filter((link) => link.from !== id), ...result.links.map((target) => ({ from: id, toKey: noteKey(target) }))]);
  }

  async function remove(id: string) {
    const response = await businessPost("/api/business-os/notes/delete", { id });
    if (!response.ok) {
      toast(explain(response.payload), "bad");
      return;
    }
    setNotes((list) => list.filter((note) => note.id !== id));
    setLinks((list) => list.filter((link) => link.from !== id));
    select(null);
    toast("Note deleted");
  }

  if (error) return <Notice tone="bad">Notes are unavailable right now.</Notice>;

  const current = notes.find((note) => note.id === selected) ?? null;
  const showList = !mobile || (!selected && view === "note");
  const showMain = !mobile || selected !== null || view === "graph";

  return (
    <div className="bos-notes">
      {showList ? (
        <NoteList
          notes={notes}
          links={links}
          selected={selected}
          canWrite={canWrite}
          view={view}
          onView={setView}
          onSelect={select}
          onCreate={(note) => void create(note, false)}
          filter={filter}
          onFilter={setFilter}
          vault={<VaultMenu onImported={() => setReload((value) => value + 1)} />}
        />
      ) : null}

      {showMain ? (
        <section className="flex min-w-0 flex-col gap-4">
          {view === "graph" ? (
            <>
              {mobile ? (
                <Button variant="ghost" size="sm" onClick={() => setView("note")}>
                  ← Notes
                </Button>
              ) : null}
              <NoteGraph input={graphInput} current={selected} onOpen={(id, ghost) => (ghost ? void openTitle(ghost) : select(id))} />
              <p className="bos-caption">Drag to move, scroll or pinch to zoom, click a note to open it. Faint dots are links to notes that do not exist yet.</p>
            </>
          ) : current ? (
            <NoteEditor
              key={`${current.id}:${reload}`}
              meta={current}
              canWrite={canWrite}
              allNotes={notes}
              onCreate={(note) => void create(note)}
              onTag={(tag) => {
                setFilter(`#${tag}`);
                if (mobile) select(null);
              }}
              backlinks={links.filter((link) => link.toKey === current.key && link.from !== current.id).flatMap((link) => notes.filter((note) => note.id === link.from))}
              outgoing={links.filter((link) => link.from === current.id).map((link) => link.toKey)}
              resolve={(title) => byKey.get(noteKey(title)) ?? null}
              onOpenTitle={openTitle}
              onOpen={select}
              onBack={mobile ? () => select(null) : undefined}
              onSaved={(result, folder) => {
                applySaved(current.id, result, folder);
                if (result.relinked > 0) {
                  toast(`Updated links in ${result.relinked} ${result.relinked === 1 ? "note" : "notes"}`);
                  router.refresh();
                }
              }}
              onDelete={() => remove(current.id)}
            />
          ) : selected ? (
            <Card>
              <EmptyState icon={<NoteIcon />} title="This note is not available">
                It may have been deleted.
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={<NoteIcon />} title="Pick a note">
                {canWrite ? "Choose a note on the left, or create one. Type [[ ]] around a title to link notes." : "Choose a note on the left."}
              </EmptyState>
            </Card>
          )}
        </section>
      ) : null}
    </div>
  );
}
