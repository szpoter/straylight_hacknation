import { cn } from "./cn";
import { CheckIcon, LockIcon } from "./icons";

type Tone = "neutral" | "accent" | "brand" | "ink";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface border border-outline text-on-surface",
  accent: "bg-tertiary text-on-surface",
  brand: "bg-secondary text-on-surface",
  ink: "bg-on-surface text-on-primary",
};

/** Etykieta-pigułka, np. „Test”, „Przykład”, „AI”, status sprawy. */
export function Tag({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-meta font-medium whitespace-nowrap", TONE[tone], className)}>{children}</span>;
}

/** Plakietka funkcji AI (SPEC-PO-LOGOWANIU, „Oznaczenie funkcji AI”). */
export function AiTag() {
  return (
    <Tag tone="ink" className="tracking-wide">
      <span aria-hidden>AI</span>
      <span className="sr-only">Odczytane przez AI</span>
    </Tag>
  );
}

/** Źródło wartości: kłódka przy danych urzędowych. */
export function SourceLabel({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-meta text-on-surface-variant">
      {locked && <LockIcon size={14} aria-label="Dane z ZUS, nie do edycji" role="img" aria-hidden={false} />}
      {label}
    </span>
  );
}

export function DoneMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-5 items-center justify-center rounded-full bg-primary text-on-primary", className)}>
      <CheckIcon size={14} strokeWidth={2.5} />
    </span>
  );
}
