import { AppSettings } from "@/components/business-os/admin/chrome";
import { IdentityActions } from "@/components/business-os/identity-actions";
import { AppIcon, ProjectIcon, RegistryIcon, SparkIcon } from "@/components/business-os/ui/icons";
import { Card, CardHead, EmptyState, KeyValues, Section, StatusPill } from "@/components/business-os/ui/primitives";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { humanize } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

export function Projects({ data }: { data: WorkspaceData }) {
  const exclusions = data.company.report?.exclusions ?? data.byProject.flatMap((project) => project.report?.exclusions ?? []);
  if (data.projects.length === 0) {
    return (
      <Card>
        <EmptyState icon={<ProjectIcon />} title="No projects yet" />
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <table className="bos-table" aria-label="Projects">
        <thead>
          <tr>
            <th>Project</th>
            <th>State</th>
            <th>Reporting</th>
            <th className="hidden md:table-cell">Note</th>
          </tr>
        </thead>
        <tbody>
          {data.projects.map((project) => {
            const exclusion = exclusions.find((item) => item.projectSlug === project.slug);
            return (
              <tr key={project.id}>
                <td>
                  <span className="font-medium">{project.name}</span>
                  <span className="bos-caption block bos-mono">{project.slug}</span>
                </td>
                <td>
                  <StatusPill status={project.state} label={humanize(project.state)} />
                </td>
                <td>{project.reportingEnabled ? <StatusPill status="active" label="On" /> : <StatusPill status="unconfigured" label="Reporting disabled" />}</td>
                <td className="bos-caption hidden md:table-cell">{exclusion ? humanize(exclusion.reason) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

const LATER: Record<string, { title: string; icon: React.ReactNode; body: string }> = {
  records: { title: "Registrations are coming next", icon: <RegistryIcon />, body: "Company, tax and service registrations with their renewal dates will live here." },
  ask: { title: "Ask is coming next", icon: <SparkIcon />, body: "Ask Claude about your notes, files and figures, with sources cited and token usage shown." },
  appstore: { title: "App Store is coming next", icon: <AppIcon />, body: "Daily units, proceeds and countries from App Store Connect sales and finance reports." },
};

export function Later({ section }: { section: string }) {
  const item = LATER[section] ?? LATER.records;
  return (
    <Card>
      <EmptyState icon={item.icon} title={item.title}>
        <p>{item.body}</p>
        <p className="mt-2">It is not available in this workspace yet.</p>
      </EmptyState>
    </Card>
  );
}

export function Settings({
  profile,
  brokerEnabled,
  telegramConfigured,
}: {
  profile: IdentityProfile;
  brokerEnabled: boolean;
  telegramConfigured: boolean;
}) {
  return (
    <div className="bos-grid-2" data-even="">
      <Section title="Account">
        <Card pad>
          <KeyValues
            rows={[
              ["Role", humanize(profile.role)],
              ["Sign-in strength", profile.assurance === "aal2" ? <StatusPill key="a" status="verified" label={profile.stepUpUntil ? "Confirmed with Telegram" : "Two-factor"} /> : <StatusPill key="a" status="unverified" label="Password only" />],
              ["Telegram", profile.telegramLinked ? <StatusPill key="t" status="ok" label="Linked" /> : <StatusPill key="t" status="unconfigured" label="Not linked" />],
              ["Session broker", brokerEnabled ? "Enabled" : "Off until staging proof"],
            ]}
          />
        </Card>
      </Section>
      <Section title="Security">
        <Card>
          <CardHead title="Two-factor and Telegram" meta="Confirm with a Telegram code before changing finance records or secrets." />
          <div className="p-4 md:p-5">
            <IdentityActions role={profile.role} assurance={profile.assurance} surface="admin" telegramConfigured={telegramConfigured} focus="session" stepUpUntil={profile.stepUpUntil} />
          </div>
        </Card>
      </Section>
      <Section title="Settings">
        <Card pad>
          <AppSettings />
        </Card>
      </Section>
    </div>
  );
}
