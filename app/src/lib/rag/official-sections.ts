import { parse } from "next/dist/compiled/node-html-parser";
import sources from "../../../corpus/official-sources.json";
import { normalizeSpaces } from "./corpus";

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
