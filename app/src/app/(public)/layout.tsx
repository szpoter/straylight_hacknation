// Strona główna: [data-site] włącza bazowe style elementów z globals.css (tło, krój, marginesy).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div data-site>{children}</div>;
}
