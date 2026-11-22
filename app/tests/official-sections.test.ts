import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { extractOfficialParagraph, getOfficialSection } from "../src/lib/rag/official-sections";
import sources from "../corpus/official-sources.json";

const [source] = sources;
const html = readFileSync(`corpus/${source.snapshot}`, "utf8");

it.each(["care", "recipient", "age"] as const)("extracts the exact imported %s paragraph", (facet) => {
  const section = getOfficialSection(source.sourceId, facet);
  expect(section).toBeTruthy();
  if (!section) return;
  const fragment = loadCorpus("oferta").fragments.get(section.fragmentId);
  expect(extractOfficialParagraph(html, section.heading, section.paragraphStarts)).toBe(fragment?.sourceText);
  expect(getOfficialSection("unregistered", facet)).toBeNull();
});

it("rejects missing headings, duplicate articles and a list introduction without its conditions", () => {
  expect(extractOfficialParagraph(html, "Brak takiej sekcji")).toBeNull();
  expect(extractOfficialParagraph(html + html, source.sections[0].heading)).toBeNull();
  expect(extractOfficialParagraph(html, "Komu przysługuje świadczenie aktywnie w żłobku")).toBeNull();
});
