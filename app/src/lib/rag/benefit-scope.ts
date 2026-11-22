import { isPrimary, type Corpus, type Fragment } from "./corpus";
import { publicBenefitTopics, type PublicBenefitTopic } from "./public-query";

// Health insurance and a medical certificate occur in many benefit descriptions.
// Only the name of sickness benefit establishes that subject in the source.
function sourceTopics(text: string) {
  return publicBenefitTopics(text).filter(topic => topic !== "sickness" ||
    /(?:zasił\p{L}*|wynagrodzeni\p{L}*)\s+chorobow/iu.test(text));
}

export function matchesPublishedBenefit(question: string, publication: string) {
  const asked = publicBenefitTopics(question);
  return !asked.length || sourceTopics(publication).some(topic => asked.includes(topic));
}

export function contradictsQuotedBenefit(claim: string, quotes: string) {
  const named = sourceTopics(quotes);
  return named.length > 0 && sourceTopics(claim).some(topic => !named.includes(topic));
}

const indexed = new WeakMap<Corpus, Map<string, PublicBenefitTopic[]>>();
function index(corpus: Corpus) {
  const subjects = new Map<string, PublicBenefitTopic[]>();
  const provisions = new Map<string, Set<PublicBenefitTopic>>();
  for (const f of corpus.fragments.values()) {
    if (!isPrimary(corpus, f)) continue;
    const key = f.documentId + "/" + f.locator;
    const topics = provisions.get(key) ?? new Set<PublicBenefitTopic>();
    const names = sourceTopics(f.sourceText);
    if (/niezdolnoś\p{L}* do pracy z powodu choroby/iu.test(f.sourceText)) names.push("sickness");
    for (const topic of names) topics.add(topic);
    provisions.set(key, topics);
  }
  for (const f of corpus.fragments.values()) {
    const provision = provisions.get(f.documentId + "/" + f.locator);
    if (provision) {
      subjects.set(f.logicalId, [...provision]);
      continue;
    }
    const heading = sourceTopics(f.headingPath.join(" ") + " " + (corpus.documents.get(f.documentId)?.title ?? ""));
    subjects.set(f.logicalId, heading.length ? heading : sourceTopics(f.sourceText));
  }
  indexed.set(corpus, subjects);
  return subjects;
}

export function benefitFilter(question: string) {
  const asked = publicBenefitTopics(question);
  return (corpus: Corpus, fragment: Fragment) => {
    if (!asked.length) return true;
    const subjects = (indexed.get(corpus) ?? index(corpus)).get(fragment.logicalId) ?? [];
    // General statutes also govern evidence, payment and procedure across benefits.
    return subjects.length ? subjects.some(topic => asked.includes(topic)) : isPrimary(corpus, fragment);
  };
}
