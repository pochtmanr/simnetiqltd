"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { businessGet, businessPost } from "@/components/business-os/business-post";
import { DownloadIcon, FolderIcon, NoteIcon, UploadIcon } from "@/components/business-os/ui/icons";
import { Popover, Sheet, useSheetClose, useToast } from "@/components/business-os/ui/overlay";
import { Button, Checkbox, Notice } from "@/components/business-os/ui/primitives";
import { batchFiles, countInFolders, detectStripRoot, exportFileName, isNotePath, planImport, skipReason, type Skip, type VaultFile } from "@/lib/business-os/brain/vault";
import { folderFromPath, titleFromPath } from "@/lib/business-os/brain/wikilinks";

/** A picked file: its vault path, and how to read its text if it turns out to be a note. */
type Picked = { path: string; read: () => Promise<string> };

type Step =
  | { kind: "review"; notes: VaultFile[]; leftOut: number; duplicates: Skip[]; stripRoot: boolean }
  | { kind: "progress"; done: number; total: number }
  | { kind: "result"; created: number; updated: number; skipped: Skip[] };

const PREVIEW = 8;
const plural = (count: number, one: string, many = `${one}s`) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

function fromFile(file: File, path = file.webkitRelativePath || file.name): Picked {
  return { path, read: () => file.text() };
}

/** Every file entry in a zip; only notes are decompressed. */
async function fromZip(file: File): Promise<Picked[]> {
  const others: string[] = [];
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (entry) => {
      if (entry.name.endsWith("/")) return false;
      if (isNotePath(entry.name)) return true;
      others.push(entry.name);
      return false;
    },
  });
  const notes = Object.entries(entries).map(([path, bytes]) => ({ path, read: async () => strFromU8(bytes) }));
  return [...notes, ...others.map((path) => ({ path, read: async () => "" }))];
}

const isZip = (file: File) => /\.zip$/i.test(file.name);

/** Walks a dropped folder, keeping paths relative to the drop. Obsidian's settings and trash are not entered. */
async function fromEntry(entry: FileSystemEntry): Promise<Picked[]> {
  const path = entry.fullPath.replace(/^\//, "");
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
    return isZip(file) ? fromZip(file) : [fromFile(file, path)];
  }
  if (/^(\.obsidian|\.trash)$/.test(entry.name)) return [];
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  for (;;) {
    const page = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (page.length === 0) break;
    children.push(...page);
  }
  return (await Promise.all(children.map(fromEntry))).flat();
}

/** Vault menu: Obsidian folder, .zip or Markdown import through a review dialog, drag and drop, and .zip export. */
/** `onImported` runs after an import finishes, so an open note can reload the imported text. */
export function VaultMenu({ onImported }: { onImported?: () => void } = {}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [dragging, setDragging] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  async function review(load: () => Promise<Picked[]>) {
    setBusy("Reading files…");
    try {
      const picked = await load();
      const plan = planImport(picked);
      if (plan.notes.length === 0) {
        toast("No Markdown notes found in that selection.", "bad");
        return;
      }
      const notes = await Promise.all(plan.notes.map(async (item) => ({ path: item.path, body: await item.read() })));
      setStep({ kind: "review", notes, leftOut: plan.leftOut, duplicates: plan.duplicates, stripRoot: detectStripRoot(notes.map((note) => note.path)) });
    } catch {
      toast("Those files couldn’t be read. If it’s a .zip, check that it opens on your computer.", "bad");
    } finally {
      setBusy(null);
    }
  }

  async function runImport(notes: VaultFile[], stripRoot: boolean, duplicates: Skip[]) {
    let created = 0;
    let updated = 0;
    let done = 0;
    const skipped: Skip[] = [...duplicates];
    setStep({ kind: "progress", done, total: notes.length });
    for (const batch of batchFiles(notes)) {
      const response = await businessPost("/api/business-os/notes/import", { files: batch, stripRoot }).catch(() => null);
      const result = response?.payload.result as { created?: number; updated?: number; skipped?: Skip[] } | undefined;
      if (!response?.ok || !result) skipped.push(...batch.map((file) => ({ path: file.path, reason: "upload_failed" })));
      else {
        created += result.created ?? 0;
        updated += result.updated ?? 0;
        skipped.push(...(result.skipped ?? []));
      }
      done += batch.length;
      setStep({ kind: "progress", done, total: notes.length });
    }
    setStep({ kind: "result", created, updated, skipped });
  }

  function finish() {
    setStep(null);
    onImported?.();
    router.refresh();
  }

  function onPicked(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    void review(async () => (picked.length === 1 && isZip(picked[0]) ? fromZip(picked[0]) : picked.map((file) => fromFile(file))));
  }

  // Drag and drop anywhere on the page while the menu is mounted (writers on the notes page only).
  const stepOpen = step !== null;
  useEffect(() => {
    if (stepOpen) return;
    let depth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    function onEnter(event: DragEvent) {
      if (!hasFiles(event)) return;
      depth += 1;
      setDragging(true);
    }
    function onOver(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }
    function onLeave(event: DragEvent) {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }
    function onDrop(event: DragEvent) {
      if (!hasFiles(event) || !event.dataTransfer) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      // Entries must be taken synchronously; the DataTransfer is emptied once this handler returns.
      const entries = Array.from(event.dataTransfer.items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter((entry): entry is FileSystemEntry => Boolean(entry));
      const files = Array.from(event.dataTransfer.files);
      void review(async () => {
        if (entries.length > 0) return (await Promise.all(entries.map(fromEntry))).flat();
        return (await Promise.all(files.map((file) => (isZip(file) ? fromZip(file) : [fromFile(file)])))).flat();
      });
    }
    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
      setDragging(false);
    };
    // review is recreated each render but only reads stable setters and toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepOpen]);

  async function exportVault() {
    setBusy("Preparing export…");
    try {
      const archive: Record<string, Uint8Array> = {};
      let count = 0;
      let offset: number | null = 0;
      while (offset !== null) {
        const response = await businessGet(`/api/business-os/notes/export?offset=${offset}`);
        const payload = (await response.json().catch(() => ({}))) as { result?: { notes: { title: string; folder: string; body: string }[]; next: number | null } };
        if (!response.ok || !payload.result) throw new Error("export_failed");
        for (const note of payload.result.notes) archive[`Business OS/${note.folder ? `${note.folder}/` : ""}${note.title}.md`] = strToU8(note.body);
        count += payload.result.notes.length;
        setBusy(`Preparing export… ${plural(count, "note")}`);
        offset = payload.result.next;
      }
      if (count === 0) {
        toast("There are no notes to export yet.");
        return;
      }
      const blob = new Blob([zipSync(archive) as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exportFileName(new Date());
      anchor.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${plural(count, "note")}`);
    } catch {
      toast("The export failed. Try again.", "bad");
    } finally {
      setBusy(null);
    }
  }

  const importing = step?.kind === "progress";
  return (
    <>
      <Popover title="Vault" align="end" variant="ghost" size="sm" label={<>Vault</>}>
        <div className="bos-vault-menu flex flex-col" role="menu">
          <VaultItem icon={<FolderIcon size={16} />} label="Import Obsidian folder" hint="Pick your vault folder. Attachments and settings are left out." onSelect={() => folderInput.current?.click()} />
          <VaultItem icon={<UploadIcon size={16} />} label="Import .zip" hint="A zipped vault or folder of Markdown notes." onSelect={() => zipInput.current?.click()} />
          <VaultItem icon={<NoteIcon size={16} />} label="Import Markdown files" hint="Pick one or more .md files." onSelect={() => filesInput.current?.click()} />
          <div className="bos-menu-sep" />
          <VaultItem icon={<DownloadIcon size={16} />} label="Export all notes (.zip)" hint="Every note as a Markdown file, in its folder." onSelect={() => void exportVault()} />
        </div>
      </Popover>
      <input ref={folderInput} type="file" hidden multiple onChange={onPicked} {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />
      <input ref={zipInput} type="file" hidden accept=".zip,application/zip" onChange={onPicked} />
      <input ref={filesInput} type="file" hidden multiple accept=".md,.markdown,text/markdown" onChange={onPicked} />
      {busy ? (
        <div className="basis-full">
          <Notice>{busy}</Notice>
        </div>
      ) : null}
      {dragging ? (
        <div className="bos-vault-drop" aria-hidden>
          <div className="bos-vault-drop__box">
            <UploadIcon size={28} />
            <strong>Drop Markdown files, a folder or a .zip to import</strong>
            <span className="bos-caption">You’ll see what will be imported before anything changes.</span>
          </div>
        </div>
      ) : null}
      <Sheet
        open={stepOpen}
        onClose={() => {
          if (importing) return;
          if (step?.kind === "result") finish();
          else setStep(null);
        }}
        title={step?.kind === "result" ? "Import finished" : step?.kind === "progress" ? "Importing notes" : "Import notes"}
        footer={
          step?.kind === "review" ? (
            <>
              <Button onClick={() => setStep(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => void runImport(step.notes, step.stripRoot, step.duplicates)}>
                Import {plural(step.notes.length, "note")}
              </Button>
            </>
          ) : step?.kind === "result" ? (
            <Button variant="primary" onClick={finish}>
              Done
            </Button>
          ) : null
        }
      >
        {step?.kind === "review" ? <Review step={step} onStripRoot={(stripRoot) => setStep({ ...step, stripRoot })} /> : null}
        {step?.kind === "progress" ? <Progress done={step.done} total={step.total} /> : null}
        {step?.kind === "result" ? <Result step={step} /> : null}
      </Sheet>
    </>
  );
}

function VaultItem({ icon, label, hint, onSelect }: { icon: ReactNode; label: string; hint: string; onSelect: () => void }) {
  const close = useSheetClose();
  return (
    <button
      type="button"
      role="menuitem"
      className="bos-menu-item bos-vault-item"
      onClick={() => {
        close();
        onSelect();
      }}
    >
      {icon}
      <span className="bos-vault-item__text">
        <span>{label}</span>
        <span className="bos-caption">{hint}</span>
      </span>
    </button>
  );
}

function Review({ step, onStripRoot }: { step: Extract<Step, { kind: "review" }>; onStripRoot: (value: boolean) => void }) {
  const paths = step.notes.map((note) => note.path);
  const inFolders = countInFolders(paths, step.stripRoot);
  const nested = paths.some((path) => path.includes("/"));
  const example = paths.find((path) => path.split("/").length >= 3);
  const exampleText = example ? `“${example}” → folder “${folderFromPath(example, true)}”` : "“My Vault/Clients/Acme.md” → folder “Clients”";
  return (
    <div className="bos-vault">
      <ul className="bos-vault-stats">
        <li>
          <strong>{plural(step.notes.length, "note")}</strong> found
        </li>
        {inFolders > 0 ? (
          <li>
            <strong>{inFolders.toLocaleString()}</strong> will go into folders
          </li>
        ) : null}
        {step.leftOut > 0 ? (
          <li>
            <strong>{plural(step.leftOut, "file")}</strong> left out (attachments, settings and other non-Markdown files)
          </li>
        ) : null}
        {step.duplicates.length > 0 ? (
          <li>
            <strong>{plural(step.duplicates.length, "file")}</strong> skipped because another file has the same title
          </li>
        ) : null}
      </ul>
      <p className="bos-body">
        Notes are matched by title. If a note with the same title already exists here, its text, folder and tags are replaced by the imported version. Links between notes and #tags are rebuilt automatically. Images and other attachments are not imported.
      </p>
      {nested ? <Checkbox label={`Drop the top folder name (e.g. ${exampleText})`} checked={step.stripRoot} onChange={(event) => onStripRoot(event.target.checked)} /> : null}
      <div>
        <h3 className="bos-vault-heading">Preview</h3>
        <ul className="bos-vault-list">
          {step.notes.slice(0, PREVIEW).map((note) => {
            const folder = folderFromPath(note.path, step.stripRoot);
            return (
              <li key={note.path}>
                <span className="bos-vault-list__path">{note.path}</span>
                <span className="bos-vault-list__to">
                  → {titleFromPath(note.path)}
                  {folder ? <span className="bos-caption"> in {folder}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
        {step.notes.length > PREVIEW ? <p className="bos-caption">and {plural(step.notes.length - PREVIEW, "more note")}</p> : null}
      </div>
    </div>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bos-vault">
      <p className="bos-body" aria-live="polite">
        Importing {done.toLocaleString()} of {total.toLocaleString()}…
      </p>
      <div className="bos-vault-bar" role="progressbar" aria-label="Import progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} of ${total} notes`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="bos-caption">Keep this page open until the import finishes.</p>
    </div>
  );
}

function Result({ step }: { step: Extract<Step, { kind: "result" }> }) {
  return (
    <div className="bos-vault">
      <dl className="bos-vault-result">
        <div>
          <dt>New</dt>
          <dd>{step.created.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{step.updated.toLocaleString()}</dd>
        </div>
        <div data-tone={step.skipped.length ? "bad" : undefined}>
          <dt>Skipped</dt>
          <dd>{step.skipped.length.toLocaleString()}</dd>
        </div>
      </dl>
      {step.skipped.length > 0 ? (
        <details className="bos-vault-skipped">
          <summary>See why {plural(step.skipped.length, "file was", "files were")} skipped</summary>
          <ul className="bos-vault-list">
            {step.skipped.map((item, index) => (
              <li key={`${item.path}-${index}`}>
                <span className="bos-vault-list__path">{item.path || "(no name)"}</span>
                <span className="bos-caption">{skipReason(item.reason)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="bos-body">Everything was imported.</p>
      )}
    </div>
  );
}
