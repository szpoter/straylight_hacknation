"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { CloseIcon } from "./icons";

/** Poniżej `md` panel jest arkuszem od dołu; tylko tam działa przeciąganie i blokada strony. */
const SHEET_QUERY = "(max-width: 767px)";
/** Przeciągnięcie dalej niż tyle pikseli albo szybkie machnięcie w dół zamyka arkusz. */
const CLOSE_DISTANCE = 96;
const CLOSE_VELOCITY = 0.5; // px/ms

/**
 * Panel szczegółów oparty na <dialog>: na telefonie wysuwa się od dołu (M3 Bottom sheet),
 * od tabletu wzwyż z prawej krawędzi, a ścieżka zostaje widoczna obok.
 *
 * Na telefonie arkusz zamyka się przeciągnięciem w dół za pasek u góry (uchwyt i tytuł),
 * a strona pod spodem nie przewija się, póki arkusz jest otwarty. Krzyżyk i stuknięcie
 * w tło nadal zamykają arkusz.
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
  const drag = useRef<{ id: number; y: number; t: number } | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Telefon: strona pod arkuszem stoi w miejscu (inaczej przeciągnięcie przewija ścieżkę pod spodem).
  useEffect(() => {
    if (!open || !window.matchMedia(SHEET_QUERY).matches) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia(SHEET_QUERY).matches) return;
    if ((e.target as HTMLElement).closest("button")) return; // krzyżyk działa zwykłym kliknięciem
    drag.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== e.pointerId) return;
    setOffset(Math.max(0, e.clientY - drag.current.y));
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (start?.id !== e.pointerId) return;
    drag.current = null;
    const distance = Math.max(0, e.clientY - start.y);
    const velocity = distance / Math.max(1, e.timeStamp - start.t);
    setOffset(0);
    if (e.type === "pointerup" && (distance > CLOSE_DISTANCE || (distance > 24 && velocity > CLOSE_VELOCITY))) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => {
        setOffset(0);
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      // Arkusz idzie za palcem; po puszczeniu wraca na miejsce albo się zamyka.
      style={offset ? { transform: `translateY(${offset}px)`, transition: "none" } : undefined}
      className={cn(
        "m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-lg border-t border-outline bg-background p-0 text-on-surface backdrop:bg-on-surface/30",
        "max-md:overscroll-contain max-md:transition-transform max-md:duration-200 max-md:motion-reduce:transition-none",
        "md:mt-0 md:ml-auto md:h-dvh md:max-h-dvh md:max-w-column md:rounded-none md:rounded-l-lg md:border-t-0 md:border-l",
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="sticky top-0 z-10 flex items-center gap-3 border-b border-outline bg-background px-gutter-mobile py-3 max-md:cursor-grab max-md:touch-none max-md:select-none md:px-card md:py-4"
      >
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
