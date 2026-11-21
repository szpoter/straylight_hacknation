import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, LockIcon } from "./icons";
import styles from "./auth.module.css";

// Lista metod logowania. Na każdym ekranie najpierw jedyna aktywna droga, pozostałe metody
// są widoczne, nieaktywne i mają przy sobie powód (ui/NIKODEM.md, punkt 6).

export const UNAVAILABLE_REASON = "Niedostępne w wersji demonstracyjnej";

type MethodBase = {
  icon: ReactNode;
  title: string;
  description?: string;
};

export function MethodList({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className={styles.methodGroup}>
      {label ? <p className={styles.groupLabel}>{label}</p> : null}
      <ul className={styles.methods}>{children}</ul>
    </div>
  );
}

export function MethodLink({ href, icon, title, description, badge }: MethodBase & { href: string; badge?: string }) {
  return (
    <li>
      <Link href={href} className={`${styles.method} ${styles.methodActive}`}>
        <span className={styles.methodIcon}>{icon}</span>
        <span className={styles.methodText}>
          <span className={styles.methodTitle}>
            {title}
            {badge ? <span className={styles.badge}>{badge}</span> : null}
          </span>
          {description ? <span className={styles.methodDesc}>{description}</span> : null}
        </span>
        <span className={styles.methodGo} aria-hidden="true">
          <ArrowRightIcon />
        </span>
      </Link>
    </li>
  );
}

/** Metoda pokazana dla porządku, bez możliwości wyboru. Czytnik ekranu słyszy powód w treści. */
export function MethodUnavailable({ icon, title, description, children }: MethodBase & { children?: ReactNode }) {
  return (
    <li className={`${styles.method} ${styles.methodDisabled}`} data-extra={children ? "" : undefined}>
      <span className={styles.methodIcon}>{icon}</span>
      <span className={styles.methodText}>
        <span className={styles.methodTitle}>{title}</span>
        {description ? <span className={styles.methodDesc}>{description}</span> : null}
        {children}
        <span className={styles.reason}>
          <LockIcon className={styles.reasonIcon} />
          {UNAVAILABLE_REASON}
        </span>
      </span>
    </li>
  );
}
