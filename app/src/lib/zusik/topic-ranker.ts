import { publicQuestion, type PublicQuestion } from "../rag/public-query";
import { MAX_QUESTION_LENGTH } from "../rag/query";
import projection from "./topic-projection.json";

type Axis = keyof typeof projection.features;
const model = projection.features as Record<Axis, Record<string, number>>;

function fold(text: string): string {
  return text.toLowerCase().replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
}

function weight(word: string, axis: Axis): number {
  return Object.hasOwn(model[axis], word) ? model[axis][word] : 0;
}

function tokens(text: string): string[] {
  // A personal calculation, dated case or message with an identifier needs its own path.
  if (text.length > MAX_QUESTION_LENGTH || /[\d@]|https?:|pesel|\bnip\b|\bpit\b|zarabiam|wynagrodzeni/iu.test(text)) return [];
  return [...new Set(fold(text).match(/[a-z]+/g) ?? [])];
}

function strongest(words: string[], axis: Axis): number {
  return Math.max(0, ...words.map(word => weight(word, axis)));
}

// A topic guess projects onto an existing public retrieval plan. Only that constant plan
// crosses into Qdrant/generation. The numeric cutoffs are cosine similarities × 100.
export function suggestTopic(text: string): PublicQuestion | null {
  const words = tokens(text);
  const aid = strongest(words, "aid");
  if (aid < 52 || strongest(words, "other") >= 67) return null;
  const school = strongest(words, "school");
  // 'dziecko' is close to childcare, but identifies no specific care arrangement.
  const care = strongest(words.filter(word => weight(word, "child") < 65), "care");
  const child = strongest(words, "child");
  const monthly = strongest(words, "monthly");
  const candidates = [
    { label: "Dobry Start", score: child >= 55 || school >= 80 ? school : 0 },
    { label: "Aktywny Rodzic", score: child >= 55 || care >= 84 ? care : 0 },
    { label: "800+", score: child >= 68 && aid >= 63 && strongest(words, "upbringing") >= 60 ? monthly : 0 },
  ].sort((a, b) => b.score - a.score);
  const [best, second] = candidates;
  if (best.score < 64 || second.score >= 64 || best.score - second.score < 12) return null;
  // 'co miesiąc' is a fee frequency as well as a benefit frequency.
  if (best.label === "800+" && (school >= 50 || care >= 55)) return null;
  return publicQuestion(best.label);
}

const connective = new Set(("a i ale czy jak gdzie kiedy do ktorego co to ten te ta by przez z ze za na od u w we mi " +
  "sie da mozna moge moglbym musze ja go je juz tez jeszcze cale cala wszystko sprawa sprawe sprawy moj swoj bez " +
  "jest sa bedzie oni tam tym mam taki tylko normalnie chyba sam teraz").split(" "));
type Facet = "termin złożenia wniosku" | "sposób złożenia wniosku";

export function suggestSubmissionFacet(text: string): Facet | null {
  const words = tokens(text);
  const content = words.filter(word => !connective.has(word));
  if (!content.length || strongest(content, "other") >= 64) return null;
  // Unknown content may introduce a different topic, e.g. "wysłać zdjęcie z telefonu".
  if (content.some(word => Math.max(...(["channel", "action", "deadline", "closure"] as const)
    .map(axis => weight(word, axis))) < 47)) return null;
  const channel = strongest(content, "channel") >= 58;
  const deadline = strongest(content, "deadline") >= 64;
  if (channel && !deadline && (strongest(content, "action") >= 58 || words.includes("mozna") || words.includes("da"))) {
    return "sposób złożenia wniosku";
  }
  if (deadline && !channel && (strongest(content, "closure") >= 62 || words.includes("kiedy"))) {
    return "termin złożenia wniosku";
  }
  return null;
}
