/** Score already-written local predictions. The ranker never reads required IDs, equivalents or facts. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {ragAssertions} from "./zusik-eval-g7";
import {benefitFilter} from "../src/lib/rag/benefit-scope";
import {isValidOn, type Fragment} from "../src/lib/rag/corpus";
import {corpusNames, loadCorpus} from "../src/lib/rag/corpus-fs";
import {extractiveAnswer} from "../src/lib/rag/excerpt";
import {asksAboutOwnEligibility, publicQuestion} from "../src/lib/rag/public-query";
import {statutoryListIds} from "../src/lib/rag/relevance";
import type {AskTurn} from "../src/lib/zusik/types";

type Trial = {id:string; group:string; questions:string[]; requiredEvidence:string[]; facts?:string[]};
type Prediction = {id:string; variant:string; ranking:string[]; selected:string[]; aspects:number};
const read = (file:string) => readFileSync(file,"utf8");
const jsonLines = <T,>(file:string): T[] => read(file).trim().split("\n").map(line => JSON.parse(line));
const fixture = "tests/fixtures/";
const frozen = fixture + "zusik-acceptance/g7.jsonl";
assert.equal(createHash("sha256").update(read(frozen)).digest("hex"), "51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781");
const pairs: {id:string; question:string; requiredEvidence:string[]}[] = JSON.parse(read(fixture+"public-rag-subject-pairs.json"));
const trials = [
  ...jsonLines<Trial>(frozen).filter(t => t.group === "rag"),
  ...pairs.map(p => ({...p, group:p.requiredEvidence.length ? "pairs":"pair-negative", questions:[p.question]})),
  ...JSON.parse(read(fixture+"public-rag-probes.json")) as Trial[],
];
const byId = new Map(trials.map(t => [t.id,t]));
const alternatives: Record<string,Record<string,string[]>> = JSON.parse(read(fixture+"zusik-acceptance/equivalent-evidence.json"));
type Source = {name:typeof corpusNames[number]; corpus:ReturnType<typeof loadCorpus>; fragment:Fragment};
const sources = new Map<string,Source>();
for (const name of corpusNames) {
  const corpus = loadCorpus(name);
  for (const fragment of corpus.fragments.values()) {
    assert(!sources.has(fragment.logicalId));
    if (isValidOn(corpus,fragment,"2026-11-22")) sources.set(fragment.logicalId,{name,corpus,fragment});
  }
}

function score(trial:Trial, top:string[], ids:string[]) {
  const turn: AskTurn = {status:ids.length?"answered":"insufficient_evidence", question:trial.questions[0],
    message:"", requestId:trial.id, createdAt:"", corpusVersion:"", claims:[], citations:[]};
  for (const id of ids) {
    const source = sources.get(id);
    assert(source);
    const {name,corpus,fragment} = source;
    const excerpt = extractiveAnswer(corpus,{corpus:name,question:"",fragmentId:id,requiredFragmentIds:[id]},[fragment],[id]);
    const citation = excerpt?.citations[0];
    assert(citation && citation.quote === fragment.sourceText);
    const ref = "c"+(turn.citations.length+1);
    turn.citations.push({...citation,id:ref});
    turn.claims.push({text:citation.quote,citationIds:[ref]});
  }
  return ragAssertions(trial,{turn,retrieval:{top,evidence:ids}});
}

function safeSelection(trial:Trial, p:Prediction) {
  const question = trial.questions[0];
  const plan = publicQuestion(question,true);
  if (asksAboutOwnEligibility(question) || plan?.clarify || plan?.uncovered) return [];
  const allowed = benefitFilter(question);
  const result = new Set<string>();
  for (const id of p.selected) {
    const source = sources.get(id);
    assert(source);
    if (!allowed(source.corpus,source.fragment)) return [];
    for (const unit of statutoryListIds(source.corpus,source.fragment)) {
      if (!p.ranking.slice(0,5).includes(unit)) return [];
      result.add(unit);
    }
  }
  return [...result];
}

// Retrospective existence check. Only this evaluator can see the key.
function bestWitness(trial:Trial, ranking:string[], groups:string[][]) {
  if (!groups.length || !groups.every(g => g.some(id => ranking.includes(id)))) return null;
  const candidates = ranking.filter(id => groups.some(g => g.includes(id)));
  function visit(start:number, picked:string[], size:number):string[]|null {
    if (picked.length === size) {
      if (!groups.every(g => g.some(id => picked.includes(id)))) return null;
      return Object.values(score(trial,picked,picked)).every(Boolean) ? picked : null;
    }
    for (let i=start; i<=candidates.length-(size-picked.length); i++) {
      const found = visit(i+1,[...picked,candidates[i]],size);
      if (found) return found;
    }
    return null;
  }
  for (let size=1;size<=Math.min(5,candidates.length);size++) {
    const found = visit(0,[],size);
    if (found) return found;
  }
  return null;
}

const predictions = jsonLines<Prediction>(process.argv[2]);
assert.equal(predictions.length,trials.length*3);
const seen = new Set<string>();
const pools = new Map<string,string>();
for (const p of predictions) {
  const trial = byId.get(p.id);
  assert(trial && ["rrf","late","mmr"].includes(p.variant));
  const key = p.id+"/"+p.variant;
  assert(!seen.has(key)); seen.add(key);
  assert(p.ranking.length === 20 && new Set(p.ranking).size === 20 && p.ranking.every(id => sources.has(id)));
  const signature = p.ranking.toSorted().join("/");
  assert(!pools.has(p.id) || pools.get(p.id) === signature); pools.set(p.id,signature);
  assert(p.selected.length && p.selected.every(id => p.ranking.slice(0,5).includes(id)));
  const accepted = trial.requiredEvidence.map(id => [id,...(alternatives[trial.id]?.[id] ?? [])]);
  const ids = safeSelection(trial,p);
  const check = score(trial,p.ranking,ids);
  const negative = !accepted.length;
  const extra = ids.filter(id => !accepted.some(group => group.includes(id)));
  console.log(JSON.stringify({id:trial.id, group:trial.group, variant:p.variant, multi:accepted.length>1,
    top5:negative ? null : check.raw, top20:negative ? null : accepted.every(group => group.some(id => p.ranking.includes(id))),
    complete:negative ? null : Object.values(check).every(Boolean), abstained:!ids.length, extra, selected:ids,
    exact:negative ? null : check.citation && !extra.length,
    oracle5:negative ? null : bestWitness(trial,p.ranking.slice(0,5),accepted),
    ...(p.variant==="rrf" && !negative ? {oracle20:bestWitness(trial,p.ranking,accepted)} : {})}));
}
