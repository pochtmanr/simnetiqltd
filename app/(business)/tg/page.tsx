import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/business-os/private-shell";
import { BusinessWorkspace } from "@/components/business-os/workspace";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { BusinessOsUnconfiguredError, readBusinessOsConfig } from "@/lib/business-os/env";
import { parseWorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { loadWorkspace } from "@/lib/business-os/workspace/load";

export default async function TelegramPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  try {
    const identity = await loadIdentity();
    if (identity.kind === "denied") redirect("/api/business-os/auth/clear-revoked");
    if (identity.kind !== "ready") redirect("/login?next=/tg");
    const query = parseWorkspaceQuery(params, "tg");
    const data = await loadWorkspace(identity.profile, query);
    const config = readBusinessOsConfig();
    return (
      <BusinessWorkspace
        surface="tg"
        base="/tg"
        query={query}
        data={data}
        profile={identity.profile}
        brokerEnabled={config?.brokerEnabled ?? false}
        telegramConfigured={Boolean(config?.telegramBotToken && config.telegramBotId)}
      />
    );
  } catch (error) {
    if (error instanceof BusinessOsUnconfiguredError) return <PrivateShell surface="tg" />;
    throw error;
  }
}
