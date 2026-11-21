import { redirect } from "next/navigation";

// "Reguły świadczeń" is the default view (SPEC-PANEL-ADMINISTRACYJNY.md §2).
export default function AdminIndex() {
  redirect("/admin/reguly");
}
