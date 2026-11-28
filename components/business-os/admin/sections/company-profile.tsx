"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { Sheet, useToast } from "@/components/business-os/ui/overlay";
import { Button, Card, CardHead, Field, Input, KeyValues, Notice, Select } from "@/components/business-os/ui/primitives";
import type { CompanyProfileRow } from "@/lib/business-os/company/profile";
import { formatDate } from "@/lib/business-os/workspace/format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STAGGER: Record<number, string> = {
  1: "Quarters ending March, June, September, December",
  2: "Quarters ending April, July, October, January",
  3: "Quarters ending May, August, November, February",
};

/** The company's legal details. Filing dates and the agent's company tool read from here. */
export function CompanyProfileCard({ profile, canWrite }: { profile: CompanyProfileRow | null; canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!profile) return null;
  const missing = "Not entered";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries(
      ["legalName", "companyNumber", "address", "directorName", "incorporatedOn", "yearEndMonth", "yearEndDay", "vatNumber", "vatStagger", "utr"].map((key) => [key, String(data.get(key) ?? "")]),
    );
    setBusy(true);
    setProblem(null);
    const saved = await businessPost("/api/business-os/company/profile", body, { confirm: "Change the company profile" });
    setBusy(false);
    if (!saved.ok) {
      setProblem(saved.payload.error === "invalid_body" ? "Check the dates, the year end and the VAT number, then save again." : explainFinanceError(saved.payload));
      return;
    }
    setOpen(false);
    toast("Company profile saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHead
        title="Company profile"
        meta="Used for filing dates here and by the agent over MCP."
        actions={
          canWrite ? (
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
              Edit
            </Button>
          ) : null
        }
      />
      <div className="px-4 pb-4">
        <KeyValues
          rows={[
            ["Legal name", profile.legalName],
            ["Company number", profile.companyNumber ?? missing],
            ["Director", profile.directorName ?? missing],
            ["Incorporated", profile.incorporatedOn ? formatDate(profile.incorporatedOn) : missing],
            ["Year end", profile.yearEndMonth && profile.yearEndDay ? `${profile.yearEndDay} ${MONTHS[profile.yearEndMonth - 1]}` : missing],
            ["VAT number", profile.vatNumber ?? missing],
            ["VAT quarters", profile.vatStagger ? STAGGER[profile.vatStagger] : missing],
            ["Corporation Tax UTR", profile.utr ?? missing],
            ["Registered office", profile.address ?? missing],
          ]}
        />
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Company profile">
        <form className="bos-form" onSubmit={save}>
          {problem ? <Notice tone="bad">{problem}</Notice> : null}
          <Field label="Legal name" htmlFor="cp-name">
            <Input id="cp-name" name="legalName" defaultValue={profile.legalName} required maxLength={200} />
          </Field>
          <div className="bos-form__grid">
            <Field label="Company number" htmlFor="cp-number">
              <Input id="cp-number" name="companyNumber" defaultValue={profile.companyNumber ?? ""} maxLength={20} />
            </Field>
            <Field label="Director" htmlFor="cp-director">
              <Input id="cp-director" name="directorName" defaultValue={profile.directorName ?? ""} maxLength={200} />
            </Field>
          </div>
          <Field label="Registered office" htmlFor="cp-address">
            <Input id="cp-address" name="address" defaultValue={profile.address ?? ""} maxLength={300} />
          </Field>
          <div className="bos-form__grid">
            <Field label="Incorporated on" htmlFor="cp-inc">
              <Input id="cp-inc" name="incorporatedOn" type="date" defaultValue={profile.incorporatedOn ?? ""} />
            </Field>
            <Field label="Year end" htmlFor="cp-ye-day" hint="The accounting reference date.">
              <span className="flex gap-2">
                <Input id="cp-ye-day" name="yearEndDay" type="number" min={1} max={31} defaultValue={profile.yearEndDay ?? ""} aria-label="Year end day" className="w-20" />
                <Select name="yearEndMonth" defaultValue={profile.yearEndMonth ?? ""} aria-label="Year end month">
                  <option value="">Month</option>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </Select>
              </span>
            </Field>
          </div>
          <div className="bos-form__grid">
            <Field label="VAT number" htmlFor="cp-vat" hint="As on the VAT certificate, for example GB123456789.">
              <Input id="cp-vat" name="vatNumber" defaultValue={profile.vatNumber ?? ""} maxLength={20} />
            </Field>
            <Field label="VAT quarters" htmlFor="cp-stagger" hint="The return periods shown on the VAT certificate.">
              <Select id="cp-stagger" name="vatStagger" defaultValue={profile.vatStagger ?? ""}>
                <option value="">Not entered</option>
                {[1, 2, 3].map((value) => (
                  <option key={value} value={value}>
                    {STAGGER[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Corporation Tax UTR" htmlFor="cp-utr" hint="The 10-digit reference on HMRC's letter.">
            <Input id="cp-utr" name="utr" defaultValue={profile.utr ?? ""} maxLength={20} inputMode="numeric" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Sheet>
    </Card>
  );
}
