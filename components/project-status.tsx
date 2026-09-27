import { PROJECT_STATUS, type ProjectStatus as Status } from "@/lib/project-status";
import styles from "@/components/project-status.module.css";

type ProjectStatusProps = {
  project: keyof typeof PROJECT_STATUS;
  labels: Record<Status, string>;
};

export function ProjectStatus({ project, labels }: ProjectStatusProps) {
  const status = PROJECT_STATUS[project];
  return (
    <span className={styles.status} data-status={status}>
      <span className={styles.statusIcon} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
