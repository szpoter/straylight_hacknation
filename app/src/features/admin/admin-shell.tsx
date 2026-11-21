"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "./ui";
import s from "./admin.module.css";

const NAV = [
  { href: "/admin/reguly", label: "Reguły świadczeń", icon: "rules" },
  { href: "/admin/sprawy-testowe", label: "Sprawy testowe", icon: "cases" },
  { href: "/admin/historia", label: "Historia zmian", icon: "history" },
] as const;

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/admin/zmiany", title: "Przygotuj zmianę" },
  ...NAV.map((item) => ({ prefix: item.href, title: item.label })),
];

function NavIcon({ name }: { name: "rules" | "cases" | "history" | "sources" }) {
  const common = {
    className: s.navIcon,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "rules":
      return (
        <svg {...common}>
          <path d="M4 6h10M4 12h16M4 18h7" />
          <circle cx="17" cy="6" r="2" />
          <circle cx="14" cy="18" r="2" />
        </svg>
      );
    case "cases":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v4h4M12 7v5l3 2" />
        </svg>
      );
    case "sources":
      return (
        <svg {...common}>
          <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
          <path d="M8 7h6" />
        </svg>
      );
  }
}

export function AdminShell({ children, fontClassName }: { children: ReactNode; fontClassName: string }) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const title = TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "Panel administracyjny";

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className={cx(s.shell, fontClassName)} data-admin-shell="">
      {menuOpen ? (
        <button type="button" className={s.scrim} aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />
      ) : null}

      <aside className={cx(s.sidebar, menuOpen && s.sidebarOpen)} id="admin-sidebar">
        <button
          type="button"
          className={cx(s.iconButton, s.sidebarClose)}
          aria-label="Zamknij menu"
          onClick={() => setMenuOpen(false)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className={s.brand}>
          <p className={s.brandName}>Panel administracyjny</p>
          <span className={s.brandSub}>Przewodnik Rodzica</span>
        </div>

        <nav aria-label="Panel administracyjny">
          <p className={s.navLabel}>Widoki</p>
          <div className={s.nav}>
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(s.navLink, active && s.navLinkActive)}
                  aria-current={active ? "page" : undefined}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            {/* Reserved slot from SPEC §14 L1, pending decision A in §13. */}
            <span className={cx(s.navLink, s.navLinkMuted)} aria-disabled="true">
              <NavIcon name="sources" />
              Treści i źródła
            </span>
          </div>
        </nav>

        <p className={s.sidebarFoot}>
          Wersja demonstracyjna. Zmiany działają w odizolowanej sesji i nie trafiają do prawdziwych spraw.
        </p>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <button
            type="button"
            className={cx(s.iconButton, s.menuButton)}
            aria-label="Otwórz menu"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1 className={s.topbarTitle}>{title}</h1>
          <span className={s.topbarSpacer} />
          <span className={cx(s.badge, s.demoBadge)}>Wersja demo</span>
          <div className={s.account}>
            <span className={s.avatar} aria-hidden>
              KD
            </span>
            <span className={s.accountText}>
              <span>Konto demo</span>
              <span className={s.accountRole}>Redaktor i zatwierdzający</span>
            </span>
          </div>
        </header>

        <main className={s.content}>{children}</main>
      </div>
    </div>
  );
}
