import { CopyControl } from "@/components/business-os/ui/copy-control";
import { DeadlineRow } from "@/components/business-os/admin/sections/deadline-row";
import { ButtonLink, Card, CardHead } from "@/components/business-os/ui/primitives";
import { checklistProgress, checklistRows, CHECKLIST_FOLDER } from "@/lib/business-os/company/checklist";
import { upcomingDeadlines } from "@/lib/business-os/company/deadlines";
import { companyDatesFrom, COMPANY_PROFILE, companyFullAddress } from "@/lib/business-os/company/profile";
import { londonDate } from "@/lib/business-os/finance/london";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bos-fact">
      <span className="min-w-0 flex-1">
        <span className="bos-caption block">{label}</span>
        <span className="select-text text-sm font-medium">{value}</span>
      </span>
      <CopyControl value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  );
}

/** The company's essentials at the top of the Dashboard: copyable facts, document progress and what is due next. */
export function CompanyStrip({ query, checklist }: { query: WorkspaceQuery; checklist: WorkspaceData["checklist"] }) {
  const today = londonDate(new Date());
  const filesHref = `${workspaceHref("/admin", query, { section: "documents", metric: null })}&folder=${encodeURIComponent(CHECKLIST_FOLDER)}`;
  const checklistHref = workspaceHref("/admin", query, { section: "records", metric: null });
  const progress = checklist && "filesByTag" in checklist ? checklistProgress(checklistRows(checklist.filesByTag, today)) : null;
  const saved = checklist && "filesByTag" in checklist ? checklist.profile : null;
  const deadlines = upcomingDeadlines(companyDatesFrom(saved), today, 3);

  return (
    <Card>
      <CardHead
        title={COMPANY_PROFILE.legalName}
        meta="Company details for forms, and what the company must file next."
        actions={
          <ButtonLink variant="ghost" size="sm" href={filesHref}>
            Company documents
          </ButtonLink>
        }
      />
      <div className="bos-company-strip">
        <div className="bos-facts">
          <Fact label="Company number" value={saved?.companyNumber ?? COMPANY_PROFILE.companyNumber} />
          <Fact label="Legal name" value={saved?.legalName || COMPANY_PROFILE.legalName} />
          {saved?.vatNumber ? <Fact label="VAT number" value={saved.vatNumber} /> : null}
          <Fact label="Registered office" value={saved?.address ?? companyFullAddress()} />
          <Fact label="Email" value={COMPANY_PROFILE.emails[0]} />
        </div>
        <div className="min-w-0">
          <a className="bos-checklist-meter" href={checklistHref}>
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">Company documents</span>
              <span className="bos-caption">
                {progress ? `${progress.onFile} of ${progress.required} on file` : "Checklist unavailable"}
              </span>
            </span>
            <span className="bos-vault-bar" aria-hidden>
              <span style={{ width: progress && progress.required > 0 ? `${(progress.onFile / progress.required) * 100}%` : "0%" }} />
            </span>
            <span className="bos-caption">
              {progress ? (progress.missing > 0 ? `${progress.missing} required still missing. Open the checklist.` : "Every required document is on file.") : "Open the checklist."}
            </span>
          </a>
          <ul className="bos-rows">
            {deadlines.map((item) => (
              <DeadlineRow key={item.id} item={item} today={today} />
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
