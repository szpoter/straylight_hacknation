// The explicit compiled entry keeps Next webpack from bundling its entity decoder a second time.
import { parse } from "next/dist/compiled/node-html-parser/index.js";
import sources from "../../../corpus/official-sources.json";
import { normalizeSpaces } from "./corpus";

export const FAMILY_CATALOG_URL = "https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin";

export function familyProgramUrl(href: string, base = FAMILY_CATALOG_URL) {
  try {
    const url = new URL(href, base);
    if (url.origin !== "https://www.zus.pl" || url.username || url.password || url.search || url.hash ||
        !/^\/(?:pl\/)?(?:swiadczenia\/swiadczenia-dla-rodzin|aktywnyrodzic)\/[\w-]+$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

const uninformative = new Set(["jak", "czy", "jest", "tego", "program", "programie", "świadczenie", "świadczenia", "rodzic", "rodziny", "rodziców", "jakie", "jakich", "jakim", "dziecka", "dziecko", "mogę", "sprawdzić"]);
function words(text: string) {
  return new Set((text.toLocaleLowerCase("pl").match(/[\p{L}\d]{3,}/gu) ?? [])
    .filter(word => !uninformative.has(word)).map(word => word.replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "").slice(0, 5)));
}

function overlap(a: Set<string>, b: Set<string>) {
  return [...a].filter(word => b.has(word)).length;
}

export function matchingProgramLinks(html: string, question: string) {
  const article = parse(html).querySelectorAll(".article__main .zus-cms");
  if (article.length !== 1) return [];
  const wanted = words(question);
  const links = new Map<string, number>();
  for (const link of article[0].querySelectorAll("a[href]")) {
    const url = familyProgramUrl(link.getAttribute("href") ?? "");
    if (!url) continue;
    const score = overlap(wanted, words(link.text + " " + new URL(url).pathname.split("/").at(-1)));
    if (score) links.set(url, Math.max(links.get(url) ?? 0, score));
  }
  return [...links].sort((a, b) => b[1] - a[1]).filter((row, _, all) => row[1] === all[0][1]).map(row => row[0]);
}

export function matchingProgramSection(html: string, question: string) {
  const doc = parse(html);
  const articles = doc.querySelectorAll(".article__main .zus-cms");
  const title = normalizeSpaces(doc.querySelectorAll("h1")[0]?.text ?? "");
  if (articles.length !== 1 || !title || /archiwal|wycofan|zapowied/iu.test(title) ||
      /komunikat (?:wycofano|wycofany)|program (?:zakończony|został wycofany)/iu.test(articles[0].text)) return null;
  const wanted = words(question);
  const subject = words(title);
  if (overlap(subject, wanted) === 0) return null;
  for (const word of subject) wanted.delete(word);
  const sections = articles[0].querySelectorAll("h2,h3").flatMap(node => {
    const heading = normalizeSpaces(node.text);
    const headingWords = words(heading);
    const shared = overlap(wanted, headingWords);
    if (!shared) return [];
    const exact = question.toLocaleLowerCase("pl").includes(heading.toLocaleLowerCase("pl"));
    return [{ node, heading, headingScore: Number(exact) + shared / Math.sqrt(headingWords.size) }];
  }).sort((a,b) => b.headingScore-a.headingScore);
  const best = sections[0];
  if (!best || best.headingScore === sections[1]?.headingScore) return null;
  const blocks: string[] = [];
  for (let entry = best.node.nextElementSibling; entry && !/^H[1-6]$/.test(entry.tagName); entry = entry.nextElementSibling) {
    if (!["P", "UL", "OL"].includes(entry.tagName)) return null;
    blocks.push(normalizeSpaces(entry.text));
  }
  const quote = blocks.join(" ").trim();
  return quote.length >= 25 && quote.length <= 4500 && !quote.endsWith(":") ? { title, heading: best.heading, quote } : null;
}

export function getOfficialSection(sourceId: string, facet: "care" | "recipient" | "age") {
  const source = sources.find((entry) => entry.sourceId === sourceId);
  const section = source?.sections.find((entry) => entry.facet === facet);
  if (!source || !section) return null;
  return { url: source.url, title: source.title, heading: section.heading, fragmentId: section.fragmentId, paragraphStarts: section.paragraphStarts };
}

/** A missing or ambiguous heading requires another review of the publication. */
export function extractOfficialParagraph(html: string, heading: string, paragraphStarts?: readonly string[]): string | null {
  const article = parse(html).querySelectorAll(".article__main .zus-cms");
  if (article.length !== 1) return null;
  const matches = article[0].querySelectorAll("h2,h3").filter((node) => normalizeSpaces(node.text) === heading);
  if (matches.length !== 1) return null;
  if (paragraphStarts?.length) {
    const paragraphs: string[] = [];
    for (let node = matches[0].nextElementSibling; node && !/^H[1-6]$/.test(node.tagName); node = node.nextElementSibling) {
      paragraphs.push(node.tagName === "P" ? normalizeSpaces(node.text) : "");
    }
    const starts = paragraphs.map((text, i) => text.startsWith(paragraphStarts[0]) ? i : -1).filter(i => i >= 0);
    if (starts.length !== 1 || !paragraphStarts.every((prefix, i) => paragraphs[starts[0] + i]?.startsWith(prefix))) return null;
    return paragraphs.slice(starts[0], starts[0] + paragraphStarts.length).join(" ");
  }
  const paragraph = matches[0].nextElementSibling;
  if (paragraph?.tagName !== "P") return null;
  const text = normalizeSpaces(paragraph.text);
  return text && !text.endsWith(":") ? text : null;
}
