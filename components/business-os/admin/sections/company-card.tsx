"use client";

import { useState } from "react";
import { CopyControl } from "@/components/business-os/ui/copy-control";
import { Card, CardHead, Button } from "@/components/business-os/ui/primitives";
import { companyCopyFields, type CompanyCopyField } from "@/lib/business-os/company/profile";

function groupFields(fields: CompanyCopyField[]): [string, CompanyCopyField[]][] {
  const map = new Map<string, CompanyCopyField[]>();
  for (const field of fields) {
    const list = map.get(field.group) ?? [];
    list.push(field);
    map.set(field.group, list);
  }
  return [...map.entries()];
}

const COMPANY_FIELD_GROUPS = groupFields(companyCopyFields());

function FieldRow({ field }: { field: CompanyCopyField }) {
  return (
    <div className="bos-company-row">
      <span className="min-w-0 flex-1">
        <span className="bos-caption block">{field.label}</span>
        <span className="select-text break-all text-sm font-medium">{field.value}</span>
      </span>
      <CopyControl value={field.value} label={`Copy ${field.label}`} />
    </div>
  );
}

/** Doppler-style company facts with per-field copy, for form fill-ins. */
export function CompanyInfoCard() {
  const [open, setOpen] = useState(true);

  return (
    <Card className="bos-company-card" tone="accent">
      <CardHead
        title="Company info"
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            {open ? "Hide" : "Show"}
          </Button>
        }
      />
      {open ? (
        <div className="bos-company-body">
          <p className="bos-caption mb-3">Copy fields for SaaS and government forms. No bank details here.</p>
          {COMPANY_FIELD_GROUPS.map(([group, rows]) => (
            <section key={group} className="bos-company-group">
              <p className="bos-label">{group}</p>
              <div className="bos-company-list">
                {rows.map((field) => (
                  <FieldRow key={field.id} field={field} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function ConnectorsStub() {
  return (
    <Card>
      <CardHead title="Connectors" />
      <div className="px-4 pb-4">
        <p className="text-sm font-medium">Google Drive</p>
        <p className="bos-caption mt-1">Coming later. Your files stay on Simnetiq storage for now.</p>
      </div>
    </Card>
  );
}
