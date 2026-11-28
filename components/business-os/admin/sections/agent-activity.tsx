import { SparkIcon } from "@/components/business-os/ui/icons";
import { Card, CardHead, EmptyState, Notice, StatusPill } from "@/components/business-os/ui/primitives";
import type { AgentActivity } from "@/lib/business-os/tasks/load";
import { formatDateTime } from "@/lib/business-os/workspace/format";

const OUTCOME: Record<string, { tone: "ok" | "warn" | "bad"; label: string }> = {
  ok: { tone: "ok", label: "Done" },
  refused: { tone: "warn", label: "Refused" },
  failed: { tone: "bad", label: "Failed" },
};

/** Every call the agent made over MCP. Arguments are summarised; file contents and long text are never stored. */
export function AgentActivityLog({ activity }: { activity: AgentActivity | undefined }) {
  if (!activity || "error" in activity) return <Notice tone="bad">The activity log could not be loaded. Reload the page.</Notice>;
  return (
    <Card>
      <CardHead title="Agent activity" meta="The last 200 calls made with the MCP tokens, newest first." />
      {activity.rows.length === 0 ? (
        <EmptyState icon={<SparkIcon />} title="No agent activity yet">
          Once the Business OS MCP server is connected, every read and change the agent makes is listed here.
        </EmptyState>
      ) : (
        <ul className="bos-rows">
          {activity.rows.map((row) => (
            <li key={row.id} className="bos-row">
              <span className="bos-row__main">
                <span className="bos-row__title font-mono">{row.tool}</span>
                <span className="bos-caption break-words">{[row.summary, row.errorCode ? `Error: ${row.errorCode}` : null].filter(Boolean).join(" · ") || "No arguments"}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="bos-caption">{formatDateTime(row.createdAt)}</span>
                <span className="flex gap-1">
                  <StatusPill tone="muted" label={row.tokenKind === "write" ? "Write token" : "Read token"} />
                  <StatusPill tone={OUTCOME[row.outcome]?.tone ?? "bad"} label={OUTCOME[row.outcome]?.label ?? row.outcome} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
