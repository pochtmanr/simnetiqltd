import { StatusPill } from "@/components/business-os/ui/primitives";
import { daysUntil } from "@/lib/business-os/company/deadlines";
import type { TaskRow } from "@/lib/business-os/tasks/load";
import { formatDate } from "@/lib/business-os/workspace/format";

export function isClosed(task: TaskRow): boolean {
  return task.status === "done" || task.status === "cancelled";
}

export function TaskMeta({ task, today, projects }: { task: TaskRow; today: string; projects: { slug: string; name: string }[] }) {
  const days = task.dueOn ? daysUntil(task.dueOn, today) : null;
  const project = projects.find((item) => item.slug === task.projectSlug)?.name;
  return (
    <span className="flex flex-wrap items-center gap-2">
      {task.dueOn && !isClosed(task) ? (
        <StatusPill tone={days !== null && days < 0 ? "bad" : days !== null && days <= 3 ? "warn" : "muted"} label={days !== null && days < 0 ? `Overdue since ${formatDate(task.dueOn)}` : `Due ${formatDate(task.dueOn)}`} />
      ) : null}
      {task.assignee === "agent" ? <StatusPill tone="info" label="For the agent" /> : null}
      {task.status === "doing" ? <StatusPill tone="info" label="In progress" /> : null}
      {project ? <span className="bos-caption">{project}</span> : null}
    </span>
  );
}
