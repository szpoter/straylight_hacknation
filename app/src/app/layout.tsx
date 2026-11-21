import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zusik",
  description: "Zusik — asystent rodzica",
};

// Intentionally unstyled: the design system in design/ is not final yet.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
