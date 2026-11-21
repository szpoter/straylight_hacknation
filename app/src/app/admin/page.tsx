import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginView } from "@/features/admin/login-view";
import { adminDemoPrefill, getAdmin } from "@/lib/admin/server";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Logowanie" };

// /admin is the sign-in. A signed-in admin goes straight to the default view (SPEC §2).
export default async function AdminSignIn() {
  if (await getAdmin()) redirect("/admin/reguly");
  return <LoginView signInAction={signIn} prefill={adminDemoPrefill()} />;
}
