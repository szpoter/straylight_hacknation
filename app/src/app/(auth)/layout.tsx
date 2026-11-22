import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
