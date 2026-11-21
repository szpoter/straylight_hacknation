import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import { AdminShell } from "@/features/admin/admin-shell";
import "./admin-globals.css";

// Fonts from DESIGN.md: Literata for headings and numbers, Inter for interface text.
const literata = Literata({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-serif" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { template: "%s · Panel administracyjny", default: "Panel administracyjny" },
  robots: { index: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell fontClassName={`${literata.variable} ${inter.variable}`}>{children}</AdminShell>;
}
