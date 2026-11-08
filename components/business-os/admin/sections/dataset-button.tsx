"use client";

import { useState, type ReactNode } from "react";
import { GenericTable } from "@/components/business-os/admin/tables";
import { Sheet } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink, KeyValues } from "@/components/business-os/ui/primitives";

/**
 * Opens a dataset sheet: descriptor notes, snapshot metadata, and the imported
 * rows as a generic table. Notes arrive as markdown rendered on the server.
 */
export function DatasetButton({
  title,
  notes,
  href,
  meta,
  columns,
  rows,
  total,
}: {
  title: string;
  notes: ReactNode;
  href: string | null;
  meta: [string, string][];
  columns: string[];
  rows: Record<string, string>[];
  total: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        View
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex flex-col gap-6">
          {notes}
          {href ? (
            <ButtonLink href={href} size="sm" className="self-start">
              Open page
            </ButtonLink>
          ) : null}
          <KeyValues rows={meta} />
          <div className="flex flex-col gap-2">
            <p className="bos-label">
              Rows {total > rows.length ? `(first ${rows.length} of ${total})` : `(${total})`}
            </p>
            <div className="bos-card overflow-hidden">
              <GenericTable label={title} columns={columns} rows={rows} />
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
