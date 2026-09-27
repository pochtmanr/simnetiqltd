import { ServiceFigure } from "./service-figure";
import styles from "./contact-section.module.css";

export function ContactFigure() {
  return <ServiceFigure code="mobile" className={styles.figure} animated />;
}
