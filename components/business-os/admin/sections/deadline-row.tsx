import { StatusPill } from "@/components/business-os/ui/primitives";
import { daysUntil, type Deadline } from "@/lib/business-os/company/deadlines";
import { formatDate } from "@/lib/business-os/workspace/format";

export function dueLabel(days: number): string {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} overdue unless filed`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return days <= 60 ? `In ${days} days` : "";
}

export function DeadlineRow({ item, today }: { item: Deadline; today: string }) {
  const days = daysUntil(item.due, today);
  const label = dueLabel(days);
  return (
    <li className="bos-row">
      <span className="bos-row__main">
        <span className="bos-row__title">{item.title}</span>
        <span className="bos-caption">{item.detail}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium">{formatDate(item.due)}</span>
        {label ? <StatusPill tone={days < 0 ? "bad" : days <= 14 ? "warn" : "muted"} label={label} /> : null}
      </span>
    </li>
  );
}
