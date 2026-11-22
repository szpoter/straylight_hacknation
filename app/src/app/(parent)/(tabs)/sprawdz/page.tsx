import type { Metadata } from "next";
import { CheckView, type LawRef } from "@/features/check/CheckView";
import { effectiveSchedule } from "@/lib/admin/rule-store";
import { citationUrl } from "@/lib/rag/corpus";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { ELIGIBILITY_LAW_IDS } from "@/lib/rules/maternity-eligibility";

export const metadata: Metadata = { title: "Sprawdź prawo do zasiłku · Zusik" };
// Parametry z panelu administracyjnego są w ciasteczku sesji demo, więc strona nie jest statyczna.
export const dynamic = "force-dynamic";

/**
 * Test na sprawach z zestawu ZUS (zadanie s. 14–15): wybór sprawy, wgranie skanu albo własne
 * fakty, werdykt reguły z przypisami do przepisów z korpusu Zusika.
 */
export default async function CheckPage({ searchParams }: { searchParams: Promise<{ sprawa?: string | string[] }> }) {
  const corpus = loadCorpus("publiczne");
  const laws: Record<string, LawRef> = {};
  for (const id of ELIGIBILITY_LAW_IDS) {
    const fragment = corpus.fragments.get(id);
    if (!fragment) continue;
    const doc = corpus.documents.get(fragment.documentId);
    laws[id] = { title: `${doc?.shortTitle ?? ""} · ${fragment.locator}`, url: citationUrl(corpus, fragment), quote: fragment.sourceText };
  }
  // Kilka fragmentów tego samego artykułu (np. art. 29 ust. 1 i ust. 2) dostaje numer części.
  const original = Object.fromEntries(Object.entries(laws).map(([id, law]) => [id, law.title]));
  for (const id of Object.keys(laws)) {
    const same = Object.keys(original).filter((other) => original[other] === original[id]);
    if (same.length > 1) laws[id] = { ...laws[id], title: `${original[id]}, cz. ${same.indexOf(id) + 1}` };
  }
  const { schedule } = await effectiveSchedule();
  const today = new Date().toISOString().slice(0, 10);
  const { sprawa } = await searchParams;
  return <CheckView laws={laws} schedule={schedule} today={today} initialCaseId={typeof sprawa === "string" ? sprawa : undefined} />;
}
