"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { businessGet, businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { DataTable, type TableColumn } from "@/components/business-os/ui/data-table";
import { DocumentIcon, FolderIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon, UploadIcon } from "@/components/business-os/ui/icons";
import { Sheet, useToast } from "@/components/business-os/ui/overlay";
import { Button, Card, CardHead, EmptyState, Field, Input, KeyValues, Notice, Select, StatusPill } from "@/components/business-os/ui/primitives";
import { ACCEPTED_EXTENSIONS, MAX_FILE_BYTES, formatBytes, kindOf, mimeFromName, normalizeFolder, parseTags } from "@/lib/business-os/files/kinds";
import { safeNoteTitle } from "@/lib/business-os/brain/prepare";
import { formatDate, humanize } from "@/lib/business-os/workspace/format";
import type { DocumentRow } from "@/lib/business-os/workspace/load";

type Projects = { slug: string; name: string }[];
type UploadState = { key: string; name: string; status: "hashing" | "uploading" | "verifying" | "done" | "failed"; progress: number; error?: string };
type SearchHit = { id: string; snippet: string | null };

const PARALLEL_UPLOADS = 3;

const UPLOAD_ERRORS: Record<string, string> = {
  mime_invalid: "This file type is not supported, or the file is not what its extension says.",
  document_too_large: "Files can be up to 50 MB.",
  checksum_invalid: "The upload arrived damaged. Try again.",
  folder_invalid: "Folder names use letters, numbers, spaces, dots, dashes and underscores.",
  tag_invalid: "Tags use lowercase letters, numbers and dashes, up to 12 per file.",
  document_linked: "This file is attached to a record. Detach it before deleting.",
  upload_incomplete: "The upload did not finish. Try again.",
};

function explain(payload: Record<string, unknown>): string {
  return (typeof payload.error === "string" && UPLOAD_ERRORS[payload.error]) || explainFinanceError(payload);
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** PUT with progress events; fetch cannot report upload progress. */
function putWithProgress(url: string, apikey: string | undefined, file: File, mime: string, onProgress: (fraction: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", mime);
    if (apikey) xhr.setRequestHeader("apikey", apikey);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

function parentOf(folder: string): string {
  const cut = folder.lastIndexOf("/");
  return cut < 0 ? "" : folder.slice(0, cut);
}

function leafOf(folder: string): string {
  return folder.slice(folder.lastIndexOf("/") + 1);
}

/** Every folder that holds a file, plus all of their ancestors, plus folders made this session. */
function allFolders(rows: DocumentRow[], extra: string[]): string[] {
  const set = new Set<string>();
  for (const folder of [...rows.map((row) => row.folder), ...extra]) {
    let current = folder;
    while (current) {
      set.add(current);
      current = parentOf(current);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function FileGlyph({ mime }: { mime: string | null }) {
  return kindOf(mime) === "image" ? <ImageIcon size={16} /> : <DocumentIcon size={16} />;
}

/** Renders a search snippet, highlighting the terms the database wrapped in << >>. */
function Snippet({ text }: { text: string }) {
  const parts = text.split(/(<<.*?>>)/g);
  return (
    <span className="bos-caption bos-snippet">
      {parts.map((part, index) => (part.startsWith("<<") && part.endsWith(">>") ? <mark key={index}>{part.slice(2, -2)}</mark> : <span key={index}>{part}</span>))}
    </span>
  );
}

export function Files({ rows, error, projects, canWrite, limit }: { rows: DocumentRow[]; error: string | null; projects: Projects; canWrite: boolean; limit: number }) {
  const router = useRouter();
  const toast = useToast();
  const [folder, setFolder] = useState("");
  const [madeFolders, setMadeFolders] = useState<string[]>([]);
  const [queue, setQueue] = useState<UploadState[]>([]);
  const [over, setOver] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => allFolders(rows, madeFolders), [rows, madeFolders]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      let current = row.folder;
      map.set("", (map.get("") ?? 0) + 1);
      while (current) {
        map.set(current, (map.get(current) ?? 0) + 1);
        current = parentOf(current);
      }
    }
    return map;
  }, [rows]);
  const children = folders.filter((item) => parentOf(item) === folder);
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const searching = hits !== null;
  const visible = searching ? hits.flatMap((hit) => byId.get(hit.id) ?? []) : rows.filter((row) => row.folder === folder);
  const snippets = useMemo(() => new Map((hits ?? []).map((hit) => [hit.id, hit.snippet])), [hits]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits(null);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await businessGet(`/api/business-os/documents/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const payload = (await response.json().catch(() => ({}))) as { result?: { id: string; snippet: string | null }[]; error?: string };
        if (!response.ok || !Array.isArray(payload.result)) {
          setSearchError("Search is unavailable.");
          return;
        }
        setSearchError(null);
        setHits(payload.result.map((hit) => ({ id: hit.id, snippet: hit.snippet && /<<.*>>/.test(hit.snippet) ? hit.snippet : null })));
      } catch {
        if (!controller.signal.aborted) setSearchError("Search is unavailable.");
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function patch(key: string, next: Partial<UploadState>) {
    setQueue((list) => list.map((item) => (item.key === key ? { ...item, ...next } : item)));
  }

  async function uploadOne(file: File, key: string, target: string): Promise<boolean> {
    const mime = mimeFromName(file.name);
    if (!mime) {
      patch(key, { status: "failed", error: UPLOAD_ERRORS.mime_invalid });
      return false;
    }
    if (file.size < 1 || file.size > MAX_FILE_BYTES) {
      patch(key, { status: "failed", error: file.size < 1 ? "The file is empty." : UPLOAD_ERRORS.document_too_large });
      return false;
    }
    const sha256 = await sha256Hex(file);
    patch(key, { status: "uploading" });
    const started = await businessPost("/api/business-os/documents/upload-url", { fileName: file.name, size: file.size, sha256, folder: target });
    const result = started.payload.result as { documentId?: string; uploadUrl?: string; apikey?: string } | undefined;
    if (!started.ok || !result?.documentId || !result.uploadUrl) {
      patch(key, { status: "failed", error: explain(started.payload) });
      return false;
    }
    const sent = await putWithProgress(result.uploadUrl, result.apikey, file, mime, (progress) => patch(key, { progress }));
    if (!sent) {
      await businessPost("/api/business-os/documents/delete", { documentId: result.documentId });
      patch(key, { status: "failed", error: UPLOAD_ERRORS.upload_incomplete });
      return false;
    }
    patch(key, { status: "verifying", progress: 1 });
    const done = await businessPost("/api/business-os/documents/complete", { documentId: result.documentId, fileName: file.name, sha256 });
    if (!done.ok) {
      patch(key, { status: "failed", error: explain(done.payload) });
      return false;
    }
    patch(key, { status: "done" });
    return true;
  }

  async function upload(files: File[]) {
    if (!canWrite || files.length === 0) return;
    const target = folder;
    const batch = files.map((file, index) => ({ file, key: `${Date.now()}-${index}-${file.name}` }));
    setQueue((list) => [...list.filter((item) => item.status !== "done"), ...batch.map(({ file, key }) => ({ key, name: file.name, status: "hashing" as const, progress: 0 }))]);
    let next = 0;
    let stored = 0;
    async function worker() {
      while (next < batch.length) {
        const item = batch[next++];
        try {
          if (await uploadOne(item.file, item.key, target)) stored += 1;
        } catch {
          patch(item.key, { status: "failed", error: "The upload failed." });
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, batch.length) }, worker));
    if (stored > 0) {
      toast(stored === 1 ? "1 file uploaded" : `${stored} files uploaded`);
      router.refresh();
    }
    if (stored < batch.length) toast(`${batch.length - stored} of ${batch.length} uploads failed`, "bad");
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    void upload(Array.from(event.dataTransfer.files));
  }

  const columns: TableColumn<DocumentRow>[] = [
    {
      id: "title",
      header: "Name",
      sortValue: (row) => row.title.toLowerCase(),
      cell: (row) => (
        <span className="inline-flex min-w-0 items-start gap-2">
          <span className="mt-0.5 text-[var(--color-text-dim)]">
            <FileGlyph mime={row.mimeType} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.title}</span>
            {searching && snippets.get(row.id) ? <Snippet text={snippets.get(row.id) ?? ""} /> : null}
            {searching && row.folder ? <span className="bos-caption">{row.folder}</span> : null}
          </span>
        </span>
      ),
    },
    { id: "type", header: "Type", wide: true, sortValue: (row) => row.mimeType ?? "", cell: (row) => <span className="bos-caption">{humanize(kindOf(row.mimeType) ?? "file")}</span> },
    { id: "size", header: "Size", align: "end", wide: true, sortValue: (row) => row.byteSize ?? 0, cell: (row) => <span className="bos-caption bos-num">{formatBytes(row.byteSize)}</span> },
    {
      id: "added",
      header: "Added",
      align: "end",
      sortValue: (row) => row.createdAt,
      cell: (row) => (row.uploadStatus === "stored" || row.origin === "source" ? <span className="bos-caption">{formatDate(row.createdAt)}</span> : <StatusPill status="pending" label="Incomplete" />),
    },
  ];

  if (error) {
    return <Notice tone="bad">Files are unavailable right now.</Notice>;
  }

  const crumbs = folder ? folder.split("/") : [];

  return (
    <div className="bos-files">
      <nav className="bos-files__tree" aria-label="Folders">
        <button type="button" className="bos-folder" aria-current={folder === "" && !searching ? "true" : undefined} onClick={() => setFolder("")}>
          <FolderIcon size={16} />
          <span className="bos-folder__name">All files</span>
          <span className="bos-folder__count">{counts.get("") ?? 0}</span>
        </button>
        {folders.map((item) => (
          <button
            key={item}
            type="button"
            className="bos-folder"
            style={{ paddingInlineStart: `${10 + 14 * item.split("/").length}px` }}
            aria-current={folder === item && !searching ? "true" : undefined}
            onClick={() => {
              setQuery("");
              setFolder(item);
            }}
          >
            <FolderIcon size={16} />
            <span className="bos-folder__name">{leafOf(item)}</span>
            <span className="bos-folder__count">{counts.get(item) ?? 0}</span>
          </button>
        ))}
      </nav>

      <div
        className="bos-drop flex min-w-0 flex-col gap-4"
        data-over={over ? "" : undefined}
        onDragOver={(event) => {
          if (!canWrite) return;
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
        }}
        onDrop={onDrop}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[var(--color-text-dim)]">
              <SearchIcon size={16} />
            </span>
            <Input type="search" aria-label="Search files" placeholder="Search names, folders, vendors and text" value={query} onChange={(event) => setQuery(event.target.value)} className="ps-9" />
          </div>
          {canWrite ? (
            <>
              <Button onClick={() => setNewFolderOpen(true)}>
                <PlusIcon size={16} />
                Folder
              </Button>
              <Button variant="primary" onClick={() => input.current?.click()}>
                <UploadIcon size={16} />
                Upload
              </Button>
              <input
                ref={input}
                type="file"
                multiple
                hidden
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={(event) => {
                  void upload(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </>
          ) : null}
        </div>

        {searchError ? <Notice tone="warn">{searchError}</Notice> : null}

        {!searching ? (
          <div className="bos-crumbs" aria-label="Current folder">
            <button type="button" aria-current={folder === "" ? "true" : undefined} onClick={() => setFolder("")}>
              All files
            </button>
            {crumbs.map((part, index) => {
              const path = crumbs.slice(0, index + 1).join("/");
              return (
                <span key={path} className="inline-flex items-center gap-1">
                  <span className="bos-caption">/</span>
                  <button type="button" aria-current={path === folder ? "true" : undefined} onClick={() => setFolder(path)}>
                    {part}
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        {queue.length > 0 ? (
          <Card>
            <CardHead
              title="Uploads"
              actions={
                queue.every((item) => item.status === "done" || item.status === "failed") ? (
                  <button type="button" className="bos-caption bos-link" onClick={() => setQueue([])}>
                    Clear
                  </button>
                ) : null
              }
            />
            <ul className="bos-queue">
              {queue.map((item) => (
                <li key={item.key} className="bos-queue__item">
                  <span className="bos-queue__name" title={item.error ?? item.name}>
                    {item.name}
                    {item.error ? <span className="bos-caption block whitespace-normal">{item.error}</span> : null}
                  </span>
                  {item.status === "uploading" ? <span className="bos-caption bos-num">{Math.round(item.progress * 100)}%</span> : null}
                  <StatusPill
                    tone={item.status === "done" ? "ok" : item.status === "failed" ? "bad" : "info"}
                    label={item.status === "hashing" ? "Preparing" : item.status === "uploading" ? "Uploading" : item.status === "verifying" ? "Checking" : item.status === "done" ? "Stored" : "Failed"}
                  />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {!searching && children.length > 0 ? (
          <div className="bos-chips flex flex-wrap gap-2">
            {children.map((item) => (
              <button key={item} type="button" className="bos-chip" style={{ paddingInlineEnd: "10px" }} onClick={() => setFolder(item)}>
                <FolderIcon size={14} />
                {leafOf(item)}
                <span className="bos-caption">{counts.get(item) ?? 0}</span>
              </button>
            ))}
          </div>
        ) : null}

        <Card className="overflow-hidden">
          <DataTable
            label={searching ? "Search results" : "Files"}
            rows={visible}
            columns={columns}
            rowKey={(row) => row.id}
            initialSort={searching ? undefined : { id: "added", desc: true }}
            onRowClick={setSelected}
            mobileRow={(row) => ({
              title: row.title,
              caption: `${humanize(kindOf(row.mimeType) ?? "file")} · ${formatBytes(row.byteSize)} · ${formatDate(row.createdAt)}`,
              badge: row.uploadStatus === "stored" || row.origin === "source" ? undefined : <StatusPill status="pending" label="Incomplete" />,
            })}
            empty={
              searching ? (
                <EmptyState icon={<SearchIcon />} title="No matches">
                  Text inside PDFs and images becomes searchable once AI reading is switched on.
                </EmptyState>
              ) : (
                <EmptyState icon={<FolderIcon />} title={folder ? "This folder is empty" : "No files yet"}>
                  {canWrite ? "Drop files here or use Upload. PDF, images, text, Markdown, CSV, Excel and Word, up to 50 MB each." : "Nothing has been uploaded."}
                </EmptyState>
              )
            }
          />
        </Card>
        {rows.length >= limit ? <p className="bos-caption">Showing the newest {limit} files. Use search to find older ones.</p> : null}
      </div>

      <NewFolderSheet
        open={newFolderOpen}
        parent={folder}
        onClose={() => setNewFolderOpen(false)}
        onCreate={(path) => {
          setMadeFolders((list) => [...list, path]);
          setFolder(path);
          setNewFolderOpen(false);
        }}
      />
      <FileSheet
        key={selected?.id ?? "none"}
        row={selected}
        folders={folders}
        projects={projects}
        canWrite={canWrite}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function NewFolderSheet({ open, parent, onClose, onCreate }: { open: boolean; parent: string; onClose: () => void; onCreate: (path: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = normalizeFolder(parent ? `${parent}/${name}` : name);
    if (!path || !name.trim()) {
      setError(UPLOAD_ERRORS.folder_invalid);
      return;
    }
    setName("");
    setError(null);
    onCreate(path);
  }
  return (
    <Sheet open={open} onClose={onClose} title="New folder" kind="dialog">
      <form className="bos-form" onSubmit={submit}>
        <Field label="Name" htmlFor="folder-name" hint={parent ? `Inside ${parent}` : "At the top level"} error={error}>
          <Input id="folder-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus maxLength={60} />
        </Field>
        <p className="bos-caption">A folder is kept once a file is uploaded into it.</p>
        <Button type="submit" variant="primary" block>
          Create
        </Button>
      </form>
    </Sheet>
  );
}

function FileSheet({
  row,
  folders,
  projects,
  canWrite,
  onClose,
  onChanged,
}: {
  row: DocumentRow | null;
  folders: string[];
  projects: Projects;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<"save" | "delete" | "open" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editable = canWrite && row?.origin === "central";
  const stored = row?.uploadStatus === "stored";

  async function open(preview: boolean) {
    if (!row) return;
    // Open the window during the click so Safari does not block it, then point it at the signed link.
    const popup = window.open("", "_blank");
    setPending("open");
    const response = await businessPost("/api/business-os/documents/file", { documentId: row.id, preview });
    setPending(null);
    const url = typeof response.payload.url === "string" ? response.payload.url : null;
    if (!response.ok || !url) {
      popup?.close();
      setError(explain(response.payload));
      return;
    }
    if (popup) popup.location.href = url;
    else window.location.assign(url);
  }

  async function makeNote() {
    if (!row) return;
    setPending("open");
    setError(null);
    const title = safeNoteTitle(row.title);
    const body = `${row.summary ? `${row.summary}\n\n` : ""}${row.tags.map((tag) => `#${tag}`).join(" ")}\n`;
    const response = await businessPost("/api/business-os/notes/save", { title, folder: row.folder, body, documentId: row.id });
    setPending(null);
    const id = (response.payload.result as { id?: string } | undefined)?.id;
    if (!response.ok || !id) {
      setError(response.payload.error === "note_title_taken" ? `A note called "${title}" already exists.` : explain(response.payload));
      return;
    }
    window.location.assign(`/admin?section=notes&note=${id}`);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row) return;
    const form = new FormData(event.currentTarget);
    const tags = parseTags(String(form.get("tags") ?? ""));
    if (tags === null) {
      setError(UPLOAD_ERRORS.tag_invalid);
      return;
    }
    setPending("save");
    setError(null);
    const response = await businessPost("/api/business-os/documents/update", {
      documentId: row.id,
      title: String(form.get("title") ?? ""),
      folder: String(form.get("folder") ?? ""),
      tags,
      vendor: String(form.get("vendor") ?? ""),
      category: String(form.get("category") ?? ""),
      project: String(form.get("project") ?? ""),
      documentOn: String(form.get("documentOn") ?? ""),
    });
    setPending(null);
    if (!response.ok) {
      setError(explain(response.payload));
      return;
    }
    toast("File updated");
    onChanged();
  }

  async function remove() {
    if (!row) return;
    setPending("delete");
    setError(null);
    const response = await businessPost("/api/business-os/documents/delete", { documentId: row.id });
    setPending(null);
    if (!response.ok) {
      setError(explain(response.payload));
      setConfirmDelete(false);
      return;
    }
    toast("File deleted");
    onChanged();
  }

  let body: ReactNode = null;
  if (row) {
    body = (
      <div className="flex flex-col gap-5">
        {error ? <Notice tone="bad">{error}</Notice> : null}
        {row.origin === "source" ? <Notice>This file belongs to a project and is read-only here.</Notice> : null}
        {!stored && row.origin === "central" ? <Notice tone="warn">This upload never finished. Delete it and upload the file again.</Notice> : null}
        {stored ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => open(true)} disabled={pending !== null}>
              Open
            </Button>
            <Button onClick={() => open(false)} disabled={pending !== null}>
              Download
            </Button>
            {editable ? (
              <Button variant="ghost" onClick={() => void makeNote()} disabled={pending !== null}>
                Make note
              </Button>
            ) : null}
          </div>
        ) : null}
        {row.summary ? <p className="bos-body">{row.summary}</p> : null}
        <KeyValues
          rows={[
            ["Type", humanize(kindOf(row.mimeType) ?? "file")],
            ["Size", formatBytes(row.byteSize)],
            ["Added", formatDate(row.createdAt)],
          ]}
        />
        {editable ? (
          <form className="bos-form" onSubmit={save}>
            <Field label="Name" htmlFor="file-title">
              <Input id="file-title" name="title" defaultValue={row.title} required maxLength={160} />
            </Field>
            <Field label="Folder" htmlFor="file-folder" hint="Type a path such as Finance/2026 to move the file.">
              <Input id="file-folder" name="folder" defaultValue={row.folder} list="file-folders" maxLength={200} />
              <datalist id="file-folders">
                {folders.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
            <Field label="Tags" htmlFor="file-tags" hint="Comma separated.">
              <Input id="file-tags" name="tags" defaultValue={row.tags.join(", ")} />
            </Field>
            <div className="bos-form__grid">
              <Field label="Vendor" htmlFor="file-vendor">
                <Input id="file-vendor" name="vendor" defaultValue={row.vendor ?? ""} maxLength={200} />
              </Field>
              <Field label="Category" htmlFor="file-category">
                <Input id="file-category" name="category" defaultValue={row.category ?? ""} maxLength={80} />
              </Field>
              <Field label="Project" htmlFor="file-project">
                <Select id="file-project" name="project" defaultValue={row.projectSlug ?? ""}>
                  <option value="">Company-wide</option>
                  {projects.map((project) => (
                    <option key={project.slug} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Document date" htmlFor="file-date">
                <Input id="file-date" name="documentOn" type="date" defaultValue={row.documentOn ?? ""} />
              </Field>
            </div>
            <Button type="submit" variant="primary" disabled={pending !== null}>
              {pending === "save" ? "Saving…" : "Save"}
            </Button>
          </form>
        ) : (
          <KeyValues
            rows={[
              ["Folder", row.folder || "Top level"],
              ["Tags", row.tags.length ? row.tags.join(", ") : "—"],
              ["Vendor", row.vendor ?? "—"],
              ["Project", row.projectSlug ?? "Company-wide"],
            ]}
          />
        )}
        {editable ? (
          confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="bos-caption flex-1">Delete this file permanently?</span>
              <Button onClick={() => setConfirmDelete(false)} disabled={pending !== null}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} disabled={pending !== null}>
                {pending === "delete" ? "Deleting…" : "Delete"}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <TrashIcon size={16} />
              Delete file
            </Button>
          )
        ) : null}
      </div>
    );
  }

  return (
    <Sheet open={row !== null} onClose={onClose} title={row?.title ?? "File"}>
      {body}
    </Sheet>
  );
}
