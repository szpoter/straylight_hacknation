"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlan } from "@/features/family/PlanProvider";
import { countByGroup } from "@/lib/plan/docs";
import { cn } from "../ui/cn";
import { CalculatorIcon, FileIcon, MapIcon, UsersIcon } from "../ui/icons";
import { NAV_ITEMS, isActive } from "./nav";

const ICONS = { "/plan": MapIcon, "/kalkulator": CalculatorIcon, "/dokumenty": FileIcon, "/profil": UsersIcon } as const;
const SHORT = { "/plan": "Mój plan", "/kalkulator": "Kalkulator", "/dokumenty": "Dokumenty", "/profil": "Profil" } as const;

/** Dolny pasek nawigacji na telefonie (M3 Navigation bar). */
export function BottomNav() {
  const pathname = usePathname();
  const { plan } = usePlan();
  const todo = countByGroup(plan.stops)["do-zalatwienia"];
  return (
    <nav aria-label="Karty" data-tour="nav" className="fixed inset-x-0 bottom-0 z-40 border-t border-outline bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.href];
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className="flex h-16 flex-col items-center justify-center gap-1 text-meta">
                <span className={cn("relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150", active && "bg-secondary")}>
                  <Icon size={22} />
                  {item.href === "/dokumenty" && todo > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-tertiary px-1 text-center text-meta font-medium leading-5">
                      {todo}
                      <span className="sr-only"> do załatwienia</span>
                    </span>
                  )}
                </span>
                <span className={cn(active && "font-medium")}>{SHORT[item.href]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
