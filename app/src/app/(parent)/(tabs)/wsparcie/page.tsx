import type { Metadata } from "next";
import { SupportView } from "@/features/support/SupportView";

export const metadata: Metadata = { title: "Wsparcie · Zusik" };

export default function SupportPage() {
  return <SupportView />;
}
