import "server-only";
import { userDb } from "@/lib/business-os/brain/read";

export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  dueOn: string | null;
  status: "open" | "doing" | "done" | "cancelled";
  assignee: "owner" | "agent";
  projectSlug: string | null;
  completedAt: string | null;
};

export type TaskList = { rows: TaskRow[] } | { error: string };

/** Open tasks by due date, then the most recently closed ones. */
export async function loadTasks(projects: { id: string; slug: string }[]): Promise<TaskList> {
  const db = await userDb();
  if (!db) return { error: "unauthenticated" };
  const result = await db
    .from("tasks")
    .select("id, title, notes, due_on, status, assignee, project_id, completed_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (result.error) return { error: "unavailable" };
  const slugs = new Map(projects.map((project) => [project.id, project.slug]));
  const rows = (result.data ?? []).flatMap((row): TaskRow[] => {
    if (typeof row.id !== "string" || typeof row.title !== "string") return [];
    return [
      {
        id: row.id,
        title: row.title,
        notes: typeof row.notes === "string" ? row.notes : null,
        dueOn: typeof row.due_on === "string" ? row.due_on : null,
        status: row.status === "doing" || row.status === "done" || row.status === "cancelled" ? row.status : "open",
        assignee: row.assignee === "agent" ? "agent" : "owner",
        projectSlug: typeof row.project_id === "string" ? (slugs.get(row.project_id) ?? null) : null,
        completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
      },
    ];
  });
  const closed = (row: TaskRow) => row.status === "done" || row.status === "cancelled";
  const open = rows.filter((row) => !closed(row)).sort((a, b) => (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999"));
  return { rows: [...open, ...rows.filter(closed)] };
}

export type AgentActivityRow = { id: string; tool: string; tokenKind: string; summary: string | null; outcome: string; errorCode: string | null; createdAt: string };
export type AgentActivity = { rows: AgentActivityRow[] } | { error: string };

export async function loadAgentActivity(): Promise<AgentActivity> {
  const db = await userDb();
  if (!db) return { error: "unauthenticated" };
  const result = await db
    .from("agent_activity")
    .select("id, tool, token_kind, summary, outcome, error_code, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (result.error) return { error: "unavailable" };
  return {
    rows: (result.data ?? []).map((row) => ({
      id: String(row.id),
      tool: String(row.tool),
      tokenKind: String(row.token_kind),
      summary: typeof row.summary === "string" ? row.summary : null,
      outcome: String(row.outcome),
      errorCode: typeof row.error_code === "string" ? row.error_code : null,
      createdAt: String(row.created_at),
    })),
  };
}
