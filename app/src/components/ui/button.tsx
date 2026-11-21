import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "tonal" | "ghost";
type Size = "md" | "sm";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

function buttonClasses(variant: Variant, size: Size, className?: string) {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
}

/** Pigułka z DESIGN.md (button-primary / button-secondary) jako link. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/** Ta sama pigułka jako przycisk, do akcji bez zmiany adresu. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
