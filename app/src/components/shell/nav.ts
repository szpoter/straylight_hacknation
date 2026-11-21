export const NAV_ITEMS = [
  { href: "/plan", label: "Mój plan" },
  { href: "/dokumenty", label: "Dokumenty i wnioski" },
  { href: "/profil", label: "Profil rodziny" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
