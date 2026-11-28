"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DeadlineRow } from "@/components/business-os/admin/sections/deadline-row";
import { explainUpload, uploadDocument } from "@/components/business-os/admin/upload";
import { businessPost } from "@/components/business-os/business-post";
import { DocumentIcon, UploadIcon } from "@/components/business-os/ui/icons";
import { Sheet, useToast } from "@/components/business-os/ui/overlay";
import { Button, Card, CardHead, EmptyState, Input, Notice, StatusPill } from "@/components/business-os/ui/primitives";
import { CHECKLIST_FOLDER, checklistProgress, checklistRows, type ChecklistGroup, type ChecklistRow, type ChecklistState } from "@/lib/business-os/company/checklist";
import { upcomingDeadlines } from "@/lib/business-os/company/deadlines";
import type { CompanyChecklist, PickableFile } from "@/lib/business-os/company/load";
import { COMPANY_DATES } from "@/lib/business-os/company/profile";
import { ACCEPTED_EXTENSIONS } from "@/lib/business-os/files/kinds";
import { formatDate } from "@/lib/business-os/workspace/format";

const STATE: Record<ChecklistState, { tone: "ok" | "bad" | "muted"; label: string }> = {
  on_file: { tone: "ok", label: "On file" },
  missing: { tone: "bad", label: "Missing" },
  not_due: { tone: "muted", label: "Not due yet" },
  optional: { tone: "muted", label: "Recommended" },
};

/** The documents the company should hold, what is on file, and what it must file next. */
export function CompanyChecklistScreen({ checklist, today, canWrite, filesHref }: { checklist: CompanyChecklist | undefined; today: string; canWrite: boolean; filesHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<ChecklistRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [picking, setPicking] = useState<ChecklistRow | null>(null);

  const ready = checklist && "filesByTag" in checklist ? checklist : null;
  const rows = useMemo(() => (ready ? checklistRows(ready.filesByTag, today) : []), [ready, today]);
  const groups = useMemo(() => {
    const map = new Map<ChecklistGroup, ChecklistRow[]>();
    for (const row of rows) map.set(row.group, [...(map.get(row.group) ?? []), row]);
    return [...map.entries()];
  }, [rows]);

  if (!ready) return <Notice tone="bad">The checklist could not be loaded. Reload the page.</Notice>;
  const progress = checklistProgress(rows);
  const deadlines = upcomingDeadlines(COMPANY_DATES, today, 8);

  function choose(row: ChecklistRow) {
    target.current = row;
    input.current?.click();
  }

  async function upload(file: File | undefined) {
    const row = target.current;
    if (!file || !row) return;
    setBusy(row.tag);
    setProblem(null);
    const error = await uploadDocument(file, { folder: CHECKLIST_FOLDER, tags: [row.tag] });
    setBusy(null);
    if (error) {
      setProblem(`${row.title}: ${error}`);
      return;
    }
    toast(`${row.title} is on file`);
    router.refresh();
  }

  async function useExisting(file: PickableFile) {
    const row = picking;
    if (!row) return;
    if (file.tags.length >= 12) {
      setProblem(`“${file.title}” already has 12 tags. Remove one in Files first.`);
      setPicking(null);
      return;
    }
    setBusy(row.tag);
    setProblem(null);
    setPicking(null);
    const saved = await businessPost("/api/business-os/documents/update", { documentId: file.id, tags: [...file.tags, row.tag] });
    setBusy(null);
    if (!saved.ok) {
      setProblem(`${row.title}: ${explainUpload(saved.payload)}`);
      return;
    }
    toast(`${row.title} is on file`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <input ref={input} type="file" hidden accept={ACCEPTED_EXTENSIONS.join(",")} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />

      <Card pad>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="bos-h3">
              {progress.onFile} of {progress.required} required documents on file
            </h3>
            <a className="bos-caption bos-link" href={filesHref}>
              Open the Company folder
            </a>
          </div>
          <span className="bos-vault-bar" aria-hidden>
            <span style={{ width: progress.required > 0 ? `${(progress.onFile / progress.required) * 100}%` : "0%" }} />
          </span>
          <p className="bos-caption">
            For a UK private limited company that is VAT registered, with one director who owns all the shares and no employees. A working list, not legal advice. A document counts once a file in Files carries its tag.
          </p>
        </div>
      </Card>

      {problem ? <Notice tone="bad">{problem}</Notice> : null}

      <Card>
        <CardHead title="What to file next" meta="Computed from the incorporation date and the 30 November year end. Passed dates stay listed for 60 days, because filings are not tracked here yet." />
        <ul className="bos-rows">
          {deadlines.map((item) => (
            <DeadlineRow key={item.id} item={item} today={today} />
          ))}
        </ul>
        {COMPANY_DATES.vatStagger ? null : (
          <div className="p-4 pt-0">
            <Notice>VAT return dates are not shown yet: the VAT quarter group from the VAT certificate has not been entered.</Notice>
          </div>
        )}
      </Card>

      {groups.map(([group, items]) => (
        <Card key={group}>
          <CardHead title={group} meta={`${items.filter((row) => row.state === "on_file").length} of ${items.length} on file`} />
          <ul className="bos-rows">
            {items.map((row) => (
              <li key={row.tag} className="bos-check" data-state={row.state}>
                <div className="bos-check__main">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bos-row__title">{row.title}</span>
                    <StatusPill tone={STATE[row.state].tone} label={row.state === "not_due" && row.notBefore ? `Not due until ${formatDate(row.notBefore)}` : STATE[row.state].label} />
                  </div>
                  <p className="bos-body">{row.what}</p>
                  <p className="bos-caption">Where to get it: {row.where}</p>
                  {row.files.length > 0 ? (
                    <p className="bos-caption">
                      On file: {row.files.map((file) => file.title).join(", ")}
                    </p>
                  ) : null}
                </div>
                {canWrite ? (
                  <div className="bos-check__actions">
                    <Button size="sm" variant={row.state === "missing" ? "primary" : "secondary"} onClick={() => choose(row)} disabled={busy !== null}>
                      <UploadIcon size={16} />
                      {busy === row.tag ? "Uploading…" : row.files.length > 0 ? "Add another" : "Upload"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPicking(row)} disabled={busy !== null}>
                      Use a file from Files
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <FilePicker row={picking} files={ready.recent} onClose={() => setPicking(null)} onPick={useExisting} />
    </div>
  );
}

function FilePicker({ row, files, onClose, onPick }: { row: ChecklistRow | null; files: PickableFile[]; onClose: () => void; onPick: (file: PickableFile) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = files.filter((file) => !row || !file.tags.includes(row.tag)).filter((file) => !q || `${file.title} ${file.folder}`.toLowerCase().includes(q));
  return (
    <Sheet open={row !== null} onClose={onClose} title={row ? `Which file is the ${row.title.toLowerCase()}?` : ""}>
      <div className="flex flex-col gap-3">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name or folder" aria-label="Filter files" />
        {shown.length === 0 ? (
          <EmptyState icon={<DocumentIcon />} title={files.length === 0 ? "No files yet" : "No file matches"}>
            Upload the document from the checklist instead.
          </EmptyState>
        ) : (
          <ul className="bos-rows">
            {shown.slice(0, 100).map((file) => (
              <li key={file.id}>
                <button type="button" className="bos-row" onClick={() => onPick(file)}>
                  <span className="bos-row__main">
                    <span className="bos-row__title">{file.title}</span>
                    <span className="bos-caption">{file.folder || "All files"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
