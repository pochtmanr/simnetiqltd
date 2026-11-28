"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { CheckCircleIcon, TrashIcon } from "@/components/business-os/ui/icons";
import { useToast } from "@/components/business-os/ui/overlay";
import { isClosed, TaskMeta } from "@/components/business-os/admin/sections/task-meta";
import { Button, Card, CardHead, EmptyState, Input, Notice, Select } from "@/components/business-os/ui/primitives";
import type { TaskList, TaskRow } from "@/lib/business-os/tasks/load";

const TASK_ERRORS: Record<string, string> = {
  invalid_body: "Check the title and the date, then try again.",
  forbidden: "This membership cannot change tasks.",
};

function explain(payload: Record<string, unknown>): string {
  return (typeof payload.error === "string" && TASK_ERRORS[payload.error]) || explainFinanceError(payload);
}

/** Next steps for the owner and for the agent. The agent reads and updates the same list over MCP. */
export function Tasks({ tasks, projects, today, canWrite }: { tasks: TaskList | undefined; projects: { slug: string; name: string }[]; today: string; canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (!tasks || "error" in tasks) return <Notice tone="bad">Tasks could not be loaded. Reload the page.</Notice>;
  const open = tasks.rows.filter((task) => !isClosed(task));
  const closed = tasks.rows.filter(isClosed).slice(0, 30);

  async function send(path: string, body: Record<string, unknown>, done: string): Promise<boolean> {
    setBusy(true);
    setProblem(null);
    const saved = await businessPost(path, body);
    setBusy(false);
    if (!saved.ok) {
      setProblem(explain(saved.payload));
      return false;
    }
    toast(done);
    router.refresh();
    return true;
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await send(
      "/api/business-os/tasks",
      { title: String(data.get("title") ?? ""), dueOn: String(data.get("dueOn") ?? ""), assignee: String(data.get("assignee") ?? "owner"), project: String(data.get("project") ?? "") },
      "Task added",
    );
    if (ok) form.reset();
  }

  const row = (task: TaskRow) => (
    <li key={task.id} className="bos-task" data-closed={isClosed(task) ? "" : undefined}>
      {canWrite ? (
        <button
          type="button"
          className="bos-task__check"
          aria-pressed={task.status === "done"}
          aria-label={task.status === "done" ? `Reopen ${task.title}` : `Mark ${task.title} done`}
          disabled={busy}
          onClick={() => void send("/api/business-os/tasks", { id: task.id, status: task.status === "done" ? "open" : "done" }, task.status === "done" ? "Task reopened" : "Task done")}
        >
          <CheckCircleIcon size={20} />
        </button>
      ) : null}
      <span className="bos-row__main">
        <span className="bos-task__title">{task.title}</span>
        {task.notes ? <span className="bos-caption whitespace-pre-line">{task.notes}</span> : null}
        <TaskMeta task={task} today={today} projects={projects} />
      </span>
      {canWrite ? (
        <Button variant="ghost" size="sm" iconOnly aria-label={`Delete ${task.title}`} disabled={busy} onClick={() => void send("/api/business-os/tasks/delete", { taskId: task.id }, "Task deleted")}>
          <TrashIcon size={16} />
        </Button>
      ) : null}
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      {problem ? <Notice tone="bad">{problem}</Notice> : null}
      {canWrite ? (
        <Card pad>
          <form className="bos-task-add" onSubmit={add}>
            <Input name="title" required maxLength={200} placeholder="What needs doing next?" aria-label="Task" />
            <Input name="dueOn" type="date" aria-label="Due date" />
            <Select name="assignee" aria-label="Who does it" defaultValue="owner">
              <option value="owner">For me</option>
              <option value="agent">For the agent</option>
            </Select>
            <Select name="project" aria-label="Project" defaultValue="">
              <option value="">Whole company</option>
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="primary" disabled={busy}>
              Add
            </Button>
          </form>
        </Card>
      ) : null}

      <Card>
        <CardHead title="To do" meta={`${open.length} open`} />
        {open.length === 0 ? (
          <EmptyState icon={<CheckCircleIcon />} title="Nothing open">
            Add the next step above, or ask the agent to plan the week.
          </EmptyState>
        ) : (
          <ul className="bos-rows">{open.map(row)}</ul>
        )}
      </Card>

      {closed.length > 0 ? (
        <Card>
          <details>
            <summary className="bos-card__head cursor-pointer">
              <h3 className="bos-h3">Done and cancelled ({closed.length})</h3>
            </summary>
            <ul className="bos-rows">{closed.map(row)}</ul>
          </details>
        </Card>
      ) : null}
    </div>
  );
}
