import { citationUrl, isValidOn, pointId } from "../rag/corpus";
import { loadCorpus } from "../rag/corpus-fs";
import { LAW_IDS, assessedOn } from "../rules/sickness";
import { knowledgeSettings } from "../zusik/server";
import type { Law } from "./types";

/** Exact legal locators from the rule; only matching, active Qdrant versions can support a conclusion. */
export async function retrieveSicknessLaw(): Promise<Law[]> {
  const corpus = loadCorpus("publiczne");
  const version = corpus.manifest.corpusVersion;
  const settings = knowledgeSettings();
  const response = await fetch(
    settings.url.replace(/\/$/, "") + "/collections/" + encodeURIComponent(settings.collection) + "/points",
    {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": settings.apiKey },
      body: JSON.stringify({
        ids: LAW_IDS.map((id) => pointId(version, id)),
        with_payload: ["logicalId", "corpusVersion", "fragmentSha256"],
        with_vector: false,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("SicknessKnowledgeUnavailable");
  const { result } = (await response.json()) as {
    result: { payload: { logicalId: string; corpusVersion: string; fragmentSha256: string } }[];
  };
  return LAW_IDS.flatMap((id) => {
    const fragment = corpus.fragments.get(id);
    if (
      !fragment ||
      !isValidOn(corpus, fragment, assessedOn) ||
      !result.some(
        (p) =>
          p.payload.logicalId === id &&
          p.payload.corpusVersion === version &&
          p.payload.fragmentSha256 === fragment.fragmentSha256,
      )
    )
      return [];
    return [{ id, title: "Ustawa zasiłkowa · " + fragment.locator, url: citationUrl(corpus, fragment) }];
  });
}
