import type { Metadata } from "next";
import Link from "next/link";
import { FolderDemo } from "./FolderDemo";

export const metadata: Metadata = { title: "Zusik: teczka" };

export default function FolderDemoPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/mascot" className="text-sm text-slate-600 underline">
            ← Podgląd maskotki
          </Link>
          <h1 className="text-2xl font-semibold">Teczka</h1>
          <p className="text-slate-600">
            Stan „folder”: Zusik zamienia się w zamkniętą teczkę, raz lekko uchyla okładkę, a potem stoi i mruga.
          </p>
        </header>
        <FolderDemo />
      </div>
    </main>
  );
}
