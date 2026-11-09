import { Later, Projects, Settings } from "@/components/business-os/admin/sections/company";
import { Bank } from "@/components/business-os/admin/sections/bank";
import { Calendar } from "@/components/business-os/admin/calendar/calendar";
import { Audience, Subscriptions } from "@/components/business-os/admin/sections/insights";
import { Notes } from "@/components/business-os/admin/brain/notes";
import { Files } from "@/components/business-os/admin/sections/files";
import { Expenses, Sales } from "@/components/business-os/admin/sections/ledger";
import { CashAndPayouts, Statements } from "@/components/business-os/admin/sections/money";
import { Overview } from "@/components/business-os/admin/sections/overview";
import { Sources } from "@/components/business-os/admin/sections/sources";
import { ProjectPage, Today } from "@/components/business-os/admin/sections/today";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { DOCUMENT_LIMIT, type WorkspaceData } from "@/lib/business-os/workspace/load";

export function AdminSection({
  query,
  data,
  profile,
  canWrite,
  brokerEnabled,
  telegramConfigured,
}: {
  query: WorkspaceQuery;
  data: WorkspaceData;
  profile: IdentityProfile;
  canWrite: boolean;
  brokerEnabled: boolean;
  telegramConfigured: boolean;
}) {
  switch (query.section) {
    case "sales":
      return <Sales query={query} data={data} />;
    case "expenses":
      return <Expenses query={query} data={data} canWrite={canWrite} />;
    case "subscriptions":
      return <Subscriptions data={data} />;
    case "accounts":
      return <CashAndPayouts query={query} data={data} />;
    case "bank":
      return <Bank query={query} data={data.bank} canWrite={canWrite} isOwner={profile.role === "owner"} notice={data.bankNotice ?? null} />;
    case "reports":
      return <Statements query={query} data={data} />;
    case "traffic":
      return <Audience data={data} />;
    case "integrations":
      return <Sources query={query} data={data} profile={profile} telegramConfigured={telegramConfigured} />;
    case "projects":
      return <Projects data={data} />;
    case "home":
      return <Today query={query} data={data} />;
    case "project":
      return <ProjectPage query={query} data={data} />;
    case "documents":
      return (
        <Files
          rows={data.documents && "rows" in data.documents ? data.documents.rows : []}
          error={!data.documents ? "not_loaded" : "error" in data.documents ? data.documents.error : null}
          projects={data.projects}
          canWrite={canWrite}
          limit={DOCUMENT_LIMIT}
        />
      );
    case "notes":
      return (
        <Notes
          rows={data.notes && "rows" in data.notes ? data.notes.rows : []}
          links={data.notes && "rows" in data.notes ? data.notes.links : []}
          error={!data.notes ? "not_loaded" : "error" in data.notes ? data.notes.error : null}
          canWrite={canWrite}
        />
      );
    case "timeline":
      return <Calendar query={query} data={data} canWrite={canWrite} />;
    case "records":
    case "ask":
    case "appstore":
      return <Later section={query.section} />;
    case "settings":
      return <Settings profile={profile} brokerEnabled={brokerEnabled} telegramConfigured={telegramConfigured} />;
    default:
      return <Overview query={query} data={data} />;
  }
}
