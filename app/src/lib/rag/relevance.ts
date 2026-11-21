import type { Corpus, Fragment } from "./corpus";
import type { PublicQuestion } from "./public-query";

/**
 * For public questions with a known legal subject, a semantic neighbour from a
 * different benefit cannot justify looking up a local statute or prompting an LLM.
 * Accept the actual provision, another chunk of that provision, or guidance
 * directly cross-referenced to the provision in the curated corpus.
 */
export function relevantFragment(plan: PublicQuestion, corpus: Corpus): (fragment: Fragment) => boolean {
  if (!plan.locators?.length || plan.corpus === "marta") return () => true;
  const keys = new Set(plan.locators.flatMap((key) => [key, key.split(":").slice(0, 2).join(":")]));
  const anchors = new Set(
    [...corpus.fragments.values()].filter((f) => f.locatorKeys.some((key) => keys.has(key))).map((f) => f.logicalId),
  );
  return (fragment) => anchors.has(fragment.logicalId) || fragment.primaryIds.some((id) => anchors.has(id));
}
