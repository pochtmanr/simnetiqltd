import styles from "./page-header.module.css";

export function PageHeader({ title, subtitle, description }: { title: string; subtitle?: string; description?: string }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}{subtitle && <> <span>{subtitle}</span></>}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  );
}
