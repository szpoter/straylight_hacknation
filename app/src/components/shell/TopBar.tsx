"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlan } from "@/features/family/PlanProvider";
import { countByGroup } from "@/lib/plan/docs";
import { cn } from "../ui/cn";
import { ChildSelector } from "./ChildSelector";
import { NAV_ITEMS, isActive } from "./nav";

/** Pływająca pigułka 56 px, 8 px od góry, przyklejona przy przewijaniu (DESIGN.md, Layout). */
export function TopBar() {
  const pathname = usePathname();
  const { plan } = usePlan();
  const todo = countByGroup(plan.stops)["do-zalatwienia"];

  return (
    <header className="sticky top-2 z-40 px-gutter-mobile md:px-gutter-desktop">
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 rounded-full border border-outline bg-background pl-2 pr-2 md:gap-4 md:pl-5">
        <Link href="/plan" className="hidden font-serif text-title md:block" aria-label="Zusik — Mój plan">
          Zusik
        </Link>
        <span aria-hidden className="hidden h-6 w-px bg-outline md:block" />
        <ChildSelector />
        <nav aria-label="Karty" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-meta font-medium transition-colors duration-150",
                      active ? "bg-on-surface text-on-primary" : "hover:bg-surface",
                    )}
                  >
                    {item.label}
                    {item.href === "/dokumenty" && todo > 0 && (
                      <span className={cn("rounded-full px-1.5", active ? "bg-background text-on-surface" : "bg-tertiary")}>
                        {todo}
                        <span className="sr-only"> do załatwienia</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
