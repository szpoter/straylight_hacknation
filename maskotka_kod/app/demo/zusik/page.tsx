import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DemoLoader } from "./DemoLoader";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--zd-font" });

export const metadata: Metadata = { title: "Zusik · wniosek Oli (demo)" };

export default function ZusikDemoPage() {
  return (
    <main className={inter.variable}>
      <DemoLoader />
    </main>
  );
}
