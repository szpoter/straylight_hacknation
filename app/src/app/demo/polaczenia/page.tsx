import type { Metadata } from "next";
import { ProbeScreen } from "./probe-screen";

export const metadata: Metadata = {
  title: "Próba połączeń · Zusik",
  robots: { index: false },
};

export default function Page() {
  return <ProbeScreen />;
}
