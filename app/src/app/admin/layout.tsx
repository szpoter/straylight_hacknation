import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import "./admin-globals.css";

// Fonts from DESIGN.md: Literata for headings and numbers, Inter for interface text.
const literata = Literata({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-serif" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { template: "%s · Panel administracyjny", default: "Panel administracyjny" },
  robots: { index: false },
};

// Shared by the sign-in (/admin) and the panel ((panel)/), which adds the sidebar after the access check.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${literata.variable} ${inter.variable}`} data-admin-shell="">
      {children}
    </div>
  );
}
