import { cn } from "./cn";

/** Kontener strony: maks. 1280 px, margines 16 px (telefon) / 40 px (desktop). */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-page px-gutter-mobile pt-8 md:px-gutter-desktop md:pt-12", className)}>{children}</main>;
}

/** Tytuł strony: Headline 48 px, na telefonie 36/40 px. */
export function PageTitle({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h1 id={id} className={cn("font-serif text-headline-mobile md:text-headline", className)}>
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("font-serif text-title", className)}>
      {children}
    </h2>
  );
}
