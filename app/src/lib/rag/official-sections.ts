import { parse } from "next/dist/compiled/node-html-parser";
import sources from "../../../corpus/official-sources.json";
import { normalizeSpaces } from "./corpus";

export function getOfficialSection(sourceId: string, facet: "care" | "recipient") {
  const source = sources.find((entry) => entry.sourceId === sourceId);
  const section = source?.sections.find((entry) => entry.facet === facet);
  if (!source || !section) return null;
  return { url: source.url, title: source.title, heading: section.heading, fragmentId: section.fragmentId };
}

/** A missing or ambiguous heading requires another review of the publication. */
export function extractOfficialParagraph(html: string, heading: string): string | null {
  const article = parse(html).querySelectorAll(".article__main .zus-cms");
  if (article.length !== 1) return null;
  const matches = article[0].querySelectorAll("h2,h3").filter((node) => normalizeSpaces(node.text) === heading);
  if (matches.length !== 1) return null;
  const paragraph = matches[0].nextElementSibling;
  if (paragraph?.tagName !== "P") return null;
  const text = normalizeSpaces(paragraph.text);
  return text && !text.endsWith(":") ? text : null;
}
