import { cn } from "../ui/cn";
import { Babelek } from "./babelek/Babelek";
import type { BabelekProps } from "./babelek/types";

/**
 * Zusik — maskotka Bąbelek przeniesiona z maskotka_kod/components/mascot (kopia w ./babelek).
 * Bez `animated` to statyczny SVG renderowany na serwerze. Animacje dostarcza zespół maskotki.
 */
export function Zusik({ size = 56, className, ...rest }: Omit<BabelekProps, "size"> & { size?: number }) {
  return <Babelek size={size} className={cn("shrink-0", className)} {...rest} />;
}

/** Dymek Zusika. `id` pozwala ustawić fokus na pytaniu po zmianie ekranu. */
export function SpeechBubble({
  children,
  className,
  as: As = "div",
  id,
  tabIndex,
  tail = "left",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "h1" | "p";
  id?: string;
  tabIndex?: number;
  /** Strona ogonka: „left” — Zusik obok, „bottom” — Zusik pod dymkiem. */
  tail?: "left" | "bottom";
}) {
  return (
    <As
      id={id}
      tabIndex={tabIndex}
      className={cn(
        "relative rounded-lg border border-outline bg-surface px-5 py-4 focus:outline-none",
        "before:absolute before:size-3 before:rotate-45 before:border-outline before:bg-surface",
        tail === "left" ? "before:-left-[7px] before:top-6 before:border-b before:border-l" : "before:-bottom-[7px] before:left-1/2 before:-ml-1.5 before:border-b before:border-r",
        className,
      )}
    >
      {children}
    </As>
  );
}

/** Zusik z dymkiem w jednym rzędzie (ekran pytania). */
export function ZusikSays({ children, size = 48, className }: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Zusik size={size} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
