import { AdminShell } from "@/features/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/server";
import { signOut } from "../actions";

// Pages repeat requireAdmin(): layouts are not re-rendered on client navigation, pages are.
export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  return (
    <AdminShell adminLogin={admin} signOutAction={signOut}>
      {children}
    </AdminShell>
  );
}
