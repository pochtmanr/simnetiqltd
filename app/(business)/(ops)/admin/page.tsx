import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/business-os/private-shell";
import { BusinessWorkspace } from "@/components/business-os/workspace";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { BusinessOsUnconfiguredError, readBusinessOsConfig } from "@/lib/business-os/env";
import { parseWorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { loadWorkspace } from "@/lib/business-os/workspace/load";
import { loadBank } from "@/lib/business-os/bank/load";
import { loadCalendar } from "@/lib/business-os/calendar/load";
import { parseCalendarParams } from "@/lib/business-os/calendar/params";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  try {
    const identity = await loadIdentity();
    if (identity.kind === "denied") redirect("/api/business-os/auth/clear-revoked");
    if (identity.kind !== "ready") redirect("/login?next=/admin");
    const query = parseWorkspaceQuery(params, "admin");
    const [workspace, bank, calendar] = await Promise.all([
      loadWorkspace(identity.profile, query, { trend: query.section === "overview", upcoming: query.section === "home", documents: query.section === "documents", notes: query.section === "notes" }),
      query.section === "bank" ? loadBank(query) : Promise.resolve(undefined),
      query.section === "timeline" ? loadCalendar(query, parseCalendarParams(params)) : Promise.resolve(undefined),
    ]);
    const revolut = Array.isArray(params.revolut) ? params.revolut[0] : params.revolut;
    const withBank = bank ? { ...workspace, bank, bankNotice: revolut && /^[a-z_]{1,40}$/.test(revolut) ? revolut : null } : workspace;
    const data = calendar ? { ...withBank, calendar } : withBank;
    const config = readBusinessOsConfig();
    return (
      <BusinessWorkspace
        surface="admin"
        base="/admin"
        query={query}
        data={data}
        profile={identity.profile}
        brokerEnabled={config?.brokerEnabled ?? false}
        telegramConfigured={Boolean(config?.telegramBotToken && config.telegramBotId)}
      />
    );
  } catch (error) {
    if (error instanceof BusinessOsUnconfiguredError) return <PrivateShell surface="admin" />;
    throw error;
  }
}
