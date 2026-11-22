import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ink" | "quiet";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-on-surface disabled:bg-outline disabled:text-on-surface-variant",
  secondary: "bg-background text-on-surface border border-on-surface hover:bg-surface disabled:border-outline disabled:text-on-surface-variant",
  ink: "bg-on-surface text-on-primary hover:bg-primary",
  quiet: "bg-transparent text-on-surface underline underline-offset-4 decoration-outline hover:decoration-on-surface px-0! min-h-0!",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full max-w-full min-h-12 md:min-h-14 px-card text-center text-label font-medium transition-colors duration-200 disabled:cursor-not-allowed";

type Common = { variant?: Variant; size?: "md" | "sm"; className?: string };

function classes({ variant = "primary", size = "md", className }: Common) {
  return cn(BASE, VARIANT[variant], size === "sm" && "min-h-10! md:min-h-10! px-4 text-meta", className);
}

export function Button({ variant, size, className, type = "button", ...rest }: Common & ComponentProps<"button">) {
  return <button type={type} className={classes({ variant, size, className })} {...rest} />;
}

export function ButtonLink({ variant, size, className, ...rest }: Common & ComponentProps<typeof Link>) {
  return <Link className={classes({ variant, size, className })} {...rest} />;
}

/** Zwykły `<a>` z wyglądem przycisku, np. pobranie pliku z adresu `blob:` (bez nawigacji Next). */
export function ButtonAnchor({ variant, size, className, ...rest }: Common & ComponentProps<"a">) {
  return <a className={classes({ variant, size, className })} {...rest} />;
}

/** Tekstowy link pomocniczy (np. „Uzupełnię później”, „Dlaczego pytamy?”). */
export function TextButton({ className, type = "button", ...rest }: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn("text-label text-on-surface underline underline-offset-4 decoration-outline hover:decoration-on-surface text-left", className)}
      {...rest}
    />
  );
}

export function TextLink({ className, ...rest }: ComponentProps<typeof Link>) {
  return <Link className={cn("text-on-surface underline underline-offset-4 decoration-outline hover:decoration-on-surface", className)} {...rest} />;
}
