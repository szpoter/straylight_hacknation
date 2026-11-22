import { isPrimary, type Corpus, type Fragment } from "./corpus";
import type { PublicQuestion } from "./public-query";

/** Numbered corpus chunks can split a statutory enumeration after a comma or semicolon. */
export function statutoryListIds(corpus: Corpus, target: Fragment): string[] {
  const chunk = /^(.*)-(\d+)$/u.exec(target.logicalId);
  if (!chunk || !isPrimary(corpus, target)) return [target.logicalId];
  const sibling = (n: number) => corpus.fragments.get(chunk[1] + "-" + n);
  const sameUnit = (f: Fragment | undefined): f is Fragment => !!f && f.documentId === target.documentId && f.locator === target.locator;
  const continues = (left: Fragment, right: Fragment) => /[,;:]$/u.test(left.sourceText) && /^(?:\d+[a-z]?|[a-z])\)\s/u.test(right.sourceText);
  const ids = [target.logicalId];
  let current = target;
  for (let i = Number(chunk[2]) - 1; ; i--) {
    const prev = sibling(i);
    if (!sameUnit(prev) || !continues(prev, current)) break;
    ids.unshift(prev.logicalId);
    current = prev;
  }
  current = target;
  for (let i = Number(chunk[2]) + 1; ; i++) {
    const next = sibling(i);
    if (!sameUnit(next) || !continues(current, next)) break;
    ids.push(next.logicalId);
    current = next;
  }
  return ids;
}

/**
 * For public questions with a known legal subject, a semantic neighbour from a
 * different benefit cannot justify looking up a local statute or prompting an LLM.
 * Accept the actual provision, another chunk of that provision, or guidance
 * directly cross-referenced to the provision in the curated corpus.
 */
export function relevantFragment(plan: PublicQuestion, corpus: Corpus): (fragment: Fragment) => boolean {
  const required = plan.requiredFragmentIds;
  if (required?.length) return f => required.includes(f.logicalId);
  if (plan.fragmentId) {
    const target = corpus.fragments.get(plan.fragmentId);
    const ids = new Set(target ? [...statutoryListIds(corpus, target), ...target.primaryIds, ...target.relatedIds] : []);
    return fragment => ids.has(fragment.logicalId);
  }
  if (!plan.locators?.length || plan.corpus === "marta") return () => true;
  const keys = new Set(plan.corpus === "oferta" ? plan.locators :
    plan.locators.flatMap((key) => [key, key.split(":").slice(0, 2).join(":")]));
  const anchors = new Set(
    [...corpus.fragments.values()].filter((f) => f.locatorKeys.some((key) => keys.has(key))).map((f) => f.logicalId),
  );
  return (fragment) => anchors.has(fragment.logicalId) || fragment.primaryIds.some((id) => anchors.has(id));
}
