/** Only propose explicitly labelled monthly amounts. A parent confirms against the source page. */
export function basisCandidates(pages: string[]) {
  return pages.flatMap((page, index) => {
    const pattern = /(?:miesięczna\s+)?podstaw(?:a|ę|y)\s+wymiaru(?:\s+zasiłku(?:\s+(?:macierzyńskiego|chorobowego))?)?\s*(?:(?:wynosi|stanowi|ustalono\s+na)(?:\s+kwotę)?\s*)?[:–-]?\s*(\d{1,7}(?:[ \u00a0]\d{3})*[,\.]\d{2})\s*(?:zł|PLN)(?![\p{L}\d])/giu;
    return Array.from(page.matchAll(pattern), match => ({
      page: index + 1, amount: match[1].replace(/\s/g, "").replace(".", ","), excerpt: match[0],
    }));
  }).filter(candidate => /^\d{1,7},\d{2}$/.test(candidate.amount) && Number(candidate.amount.replace(",", ".")) > 0);
}
