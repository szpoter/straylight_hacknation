import Link from "next/link";
import { OLA } from "@/lib/family/ola";
import { cn } from "../ui/cn";

export function ChildSelector({ className }: { className?: string }) {
  return (
    <Link href="/profil" aria-label="Profil rodziny Oli Lis" className={cn("inline-flex min-h-11 items-center rounded-full px-3 font-serif text-title hover:bg-surface", className)}>
      {OLA.child}
    </Link>
  );
}
