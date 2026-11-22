import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Karta z treścią: biała płaszczyzna, linia 1 px, bez cienia (DESIGN.md, Shapes). */
export function Panel({ className, as: As = "section", ...rest }: HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" }) {
  return <As className={cn("rounded-lg border border-outline bg-background p-gutter-mobile md:p-card", className)} {...rest} />;
}
