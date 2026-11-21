"use client";

import { useTransition } from "react";
import s from "./draft-preview-banner.module.css";

/**
 * Shown above a parent view while the administrator previews an unpublished draft (SPEC-PANEL §7 step 2):
 * the parent sees what the change would do, clearly marked as not published.
 */
export function DraftPreviewBanner({
  label,
  value,
  from,
  endAction,
}: {
  label: string;
  value: string;
  from: string;
  endAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const end = () =>
    startTransition(async () => {
      await endAction();
      window.location.reload();
    });

  return (
    <div className={s.banner} role="status">
      <span className={s.badge}>Podgląd szkicu</span>
      <span className={s.text}>
        {label}: <strong>{value}</strong> od {from}. Zmiana nie jest opublikowana, widzisz ją tylko w tej przeglądarce.
      </span>
      <button type="button" className={s.end} onClick={end} disabled={pending}>
        Zakończ podgląd
      </button>
    </div>
  );
}
