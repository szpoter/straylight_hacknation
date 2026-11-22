const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/gi, "l").toLowerCase();
const stopWords = new Set(["akta", "chce", "czy", "czym", "dane", "dlaczego", "dokument", "jest", "jaka", "jakie", "jak", "mam", "moge", "moje", "mojej", "oraz", "plik", "prosze", "sprawdz", "sprawie", "ten", "tym", "wniosku", "wynika", "zalaczonym"]);
const topics = [
  { question: /ile|kwot|wyso[kc]|oblicz|wynagrod|wyplat/u, terms: ["kwot", "podstaw", "wynagrod", "wyplat", "brutto", "zł"] },
  { question: /ubezpiecz|podlega/u, terms: ["ubezpiecz", "podlega", "tytul"] },
  { question: /termin|okres|kiedy|dat[ay]/u, terms: ["termin", "okres", "data"] },
  { question: /dokument|formularz|zalacznik/u, terms: ["wniosek", "zaswiadcz", "zalacznik", "formularz"] },
];

export function findCasePassages(pages: string[], question: string) {
  const query = fold(question);
  const terms = new Set(query.split(/[^a-z0-9-]+/u).filter(t => t.length >= 3 && !stopWords.has(t)).map(t => t.slice(0, 7)));
  for (const topic of topics) if (topic.question.test(query)) for (const word of topic.terms) terms.add(fold(word));
  const passages: Array<{ page: number; excerpt: string; score: number }> = [];
  for (const [index, page] of pages.entries()) {
    const text = page.replace(/\s+/gu, " ").trim();
    let best = { page: index + 1, excerpt: "", score: 0 };
    // Windows overlap so a label and value separated by a PDF line break can be quoted together.
    for (let start = 0; start < text.length; start += 200) {
      const excerpt = text.slice(start, start + 350);
      const folded = fold(excerpt);
      let score = 0;
      for (const term of terms) if (folded.includes(term)) score++;
      if (score > best.score) best = { page: index + 1, excerpt, score };
    }
    if (best.score) passages.push(best);
  }
  return passages.sort((a, b) => b.score - a.score || a.page - b.page).slice(0, 3);
}
