import { cn } from "./cn";
import { ChevronDownIcon } from "./icons";

/** Rozwijana sekcja („Sprawdź dane startowe”, „Przygotuj”, „Skąd ta kwota?”). */
export function Disclosure({
  summary,
  children,
  defaultOpen,
  className,
  summaryClassName,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
}) {
  return (
    <details open={defaultOpen} className={cn("group", className)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-label font-medium [&::-webkit-details-marker]:hidden",
          summaryClassName,
        )}
      >
        <span>{summary}</span>
        <ChevronDownIcon className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}
