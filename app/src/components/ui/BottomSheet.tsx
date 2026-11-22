"use client";

import { useEffect, useRef } from "react";
import { cn } from "./cn";
import { CloseIcon } from "./icons";

/**
 * Panel szczegółów oparty na <dialog>: na telefonie wysuwa się od dołu (M3 Bottom sheet),
 * od tabletu wzwyż z prawej krawędzi, a ścieżka zostaje widoczna obok.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-lg border-t border-outline bg-background p-0 text-on-surface backdrop:bg-on-surface/30",
        "md:mt-0 md:ml-auto md:h-dvh md:max-h-dvh md:max-w-column md:rounded-none md:rounded-l-lg md:border-t-0 md:border-l",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-outline bg-background px-gutter-mobile py-3 md:px-card md:py-4">
        <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-outline md:hidden" />
        <p className="min-w-0 flex-1 truncate pt-1 text-meta text-on-surface-variant md:pt-0">{eyebrow}</p>
        <button type="button" onClick={onClose} aria-label="Zamknij" className="rounded-full p-2 hover:bg-surface">
          <CloseIcon />
        </button>
      </div>
      <div className="p-gutter-mobile pb-10 md:p-card md:pb-12">{children}</div>
    </dialog>
  );
}
