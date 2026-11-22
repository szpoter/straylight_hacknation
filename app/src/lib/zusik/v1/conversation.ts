import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { assessCase, assessCaseVariant, CASE_RULE_VERSION, type AssessmentInput, type DecisionResult } from "../../rules/case-assessment";
import { factInput, type CaseFile, type EvidenceFact, type MemoryRepository, type Page, type Profile } from "../memory/contract";
import { accountAnswer, accountReadInput, accountLinkInput, type AccountReport } from "./account";
import { ApiProblem } from "./http";

const id = z.string().min(1).max(128);
const date = z.iso.date();
const revision = z.int().positive();
const replyTo = id.optional();
const lookup = { subjectId: id.optional(), validAt: date.optional(), knownAt: z.iso.datetime({ offset: true }).optional(), replyTo };
export const messageInput = z.discriminatedUnion("intent", [
  accountReadInput, accountLinkInput,
  z.strictObject({ intent: z.literal("public_question"), publicQuestion: z.string().trim().min(2).max(500), replyTo }),
  z.strictObject({ intent: z.literal("read_context"), topic: id, publicTopic: z.literal("nursery_recipient").optional(), ...lookup }),
  z.strictObject({ intent: z.literal("declare_fact"), fact: factInput, basisProfileRevision: revision, replyTo }),
  z.strictObject({ intent: z.literal("ask_case"), topic: id.optional(), ...lookup }),
  z.strictObject({ intent: z.literal("explain_result"), assessmentId: id, replyTo }),
  z.strictObject({ intent: z.literal("hypothetical"), variant: z.array(factInput).min(1).max(12), ...lookup }),
]);
export const assessmentInput = z.strictObject({ subjectId: id, benefit: id, asOf: date, profileRevision: revision, caseRevision: revision });
export type MessageInput = z.infer<typeof messageInput>;
type Citation = { kind: "account" | "fact" | "workflow" | "document" | "public_source" | "assessment"; ref: string; version: string; page?: number; publicUrl?: string };
export type Answer = { answer: string; citations: Citation[]; proposalIds?: string[]; account?: AccountReport };
export type Message = Answer & { id: string; input: MessageInput; state: "completed"; profileRevision: number; caseRevision: number };
type Assessment = { id: string; input: AssessmentInput; decisions: DecisionResult[]; ruleVersion: string; stale: boolean };
export type Context = { repo: MemoryRepository; db: PoolClient; owner: string; file: CaseFile; profile: Profile };

async function collect<T>(read: (afterId?: string) => Promise<Page<T>>) {
  const items: T[] = [];
  let afterId: string | undefined;
  do {
    const page = await read(afterId);
    items.push(...page.items);
    afterId = page.nextAfterId ?? undefined;
  } while (afterId);
  return items;
}

async function save(ctx: Context, kind: "message" | "assessment", body: Message | Assessment) {
  await ctx.db.query(`INSERT INTO zusik.v1_turns(owner_session,profile_id,case_id,kind,id,body) VALUES ($1,$2,$3,$4,$5,$6)`,
    [ctx.owner,ctx.profile.id,ctx.file.id,kind,body.id,body]);
}

export async function readTurn<K extends "message" | "assessment">(ctx: Context, kind: K, id: string) {
  const row = (await ctx.db.query("SELECT body FROM zusik.v1_turns WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND kind=$4 AND id=$5",
    [ctx.owner,ctx.profile.id,ctx.file.id,kind,id])).rows[0];
  if (!row) throw new ApiProblem(404, "not_found");
  if (kind === "assessment") row.body.stale = row.body.input.profileRevision !== ctx.profile.revision || row.body.input.caseRevision !== ctx.file.revision;
  return row.body as K extends "message" ? Message : Assessment;
}

export async function listMessages(ctx: Context, limit: number, afterId?: string): Promise<Page<Message>> {
  const {rows} = await ctx.db.query(`SELECT body FROM zusik.v1_turns WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND kind='message'
    AND ($4::text IS NULL OR (created_at,id) > (SELECT created_at,id FROM zusik.v1_turns WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND kind='message' AND id=$4))
    ORDER BY created_at,id LIMIT $5`, [ctx.owner,ctx.profile.id,ctx.file.id,afterId ?? null,limit+1]);
  const items: Message[] = rows.slice(0,limit).map(r => r.body);
  return {items, nextAfterId: rows.length > limit ? items.at(-1)?.id ?? null : null};
}

async function snapshotFor(ctx: Context, input: AssessmentInput, knownAt?: string) {
  if (!ctx.profile.subjects.includes(input.subjectId)) throw new ApiProblem(422, "unknown_subject");
  if (ctx.profile.revision !== input.profileRevision || ctx.file.revision !== input.caseRevision) throw new ApiProblem(409, "assessment_revision_mismatch");
  const facts = await collect(afterId => ctx.repo.listFacts(ctx.profile.id, {caseId:ctx.file.id,subjectId:input.subjectId,knownAt}, {afterId, limit:100}));
  const documents = await collect(afterId => ctx.repo.listDocuments(ctx.file.id, {afterId, limit:100}));
  return {facts,documents,profileRevision:ctx.profile.revision,caseRevision:ctx.file.revision};
}

export async function assess(ctx: Context, input: AssessmentInput, knownAt?: string) {
  const decisions = assessCase(input, await snapshotFor(ctx,input,knownAt));
  const body = { id: randomUUID(), input, decisions, ruleVersion: CASE_RULE_VERSION, stale: false };
  await save(ctx,"assessment",body);
  return body;
}

const money = (grosze: number) => (grosze / 100).toLocaleString("pl-PL",{style:"currency",currency:"PLN"});
const labels: Record<string,string> = { monthlyGrossPay:"Wynagrodzenie brutto", monthlyContributionBasis:"Podstawa składek", birthDate:"Data urodzenia",
  insuranceTitle:"Tytuł ubezpieczenia", employerRef:"Płatnik", submissionStatus:"Stan wniosku", sicknessCoverage:"Ubezpieczenie chorobowe", deliveryDate:"Data porodu" };
function valueText(fact: EvidenceFact["fact"]) {
  const value = fact.value;
  if (value.kind === "money") return money(value.grosze);
  if (value.kind === "code") return value.code;
  if (value.kind === "date") return value.date;
  return String(value.count);
}
function factAnswer(facts: EvidenceFact[]): Answer {
  const citations: Citation[] = [];
  const lines = facts.map(({fact,verification,factId,version}) => {
    citations.push({kind:"fact",ref:factId,version:String(version)});
    if (fact.source.kind === "document") citations.push({kind:"document",ref:fact.source.referenceId,version:"1",page:fact.source.page});
    if (fact.source.kind === "workflow") citations.push({kind:"workflow",ref:fact.source.referenceId,version:String(version)});
    const date = fact.validFrom ? [fact.validFrom,fact.validTo].filter(Boolean).join(" – ") : fact.asOf;
    const origin = verification === "disputed" ? "wartość sporna, wymaga wyjaśnienia" : fact.source.kind === "document" ? "dokument, str. " + fact.source.page :
      fact.source.kind === "workflow" ? "zdarzenie wniosku" : fact.source.kind === "simulated_zus" ? "symulowane dane ZUS" : "deklaracja";
    return `${labels[fact.field] ?? fact.field}: ${valueText(fact)} (${date}, ${origin}, wersja ${version}).`;
  });
  return { answer:lines.join("\n"),citations };
}
function describeDecisions(decisions: DecisionResult[]) {
  const labels = { eligible:"Potwierdzono prawo do świadczenia", ineligible:"Świadczenie nie przysługuje",
    needs_information:"Do ustalenia prawa brakuje danych", needs_review:"Sprawa wymaga wyjaśnienia", unsupported:"Ten wariant wymaga oceny specjalisty" };
  return decisions.map(d => {
    const payment = d.grossAmountGrosze === undefined ? "" : ` Kwota brutto: ${money(d.grossAmountGrosze)}.`;
    const trace = d.segments?.map(s => `Podstawa ${money(s.basisGrosze)}, stawka ${s.ratePct}%: ${s.days} dni × ${money(s.dailyGrosze)} = ${money(s.grossAmountGrosze)}.`).join(" ") ?? "";
    const paymentState = d.paymentStatus && {payable:"Wypłata możliwa.",withheld:"Wypłata wstrzymana do rozliczenia zadłużenia.",
      needs_information:"Do ustalenia możliwości wypłaty potrzebny jest stan rozliczeń.",expired:"Upłynął termin rozliczenia zadłużenia."}[d.paymentStatus];
    const why = d.reasonCode === "excluded_no_other_title_or_exception" ? " Potwierdzono brak ubezpieczenia, innego tytułu i wyjątku na dzień porodu." : "";
    return [`${labels[d.status]}${d.from && d.to ? " za okres " + d.from + " – " + d.to : ""}.${payment}${why}`,paymentState,trace,...(d.needed ?? []).map(n=>n.request)].filter(Boolean).join(" ");
  }).join("\n");
}
function describe(result: Assessment): Answer {
  return { answer:[...(result.stale ? ["To wcześniejsza ocena. Dane sprawy od tego czasu się zmieniły."] : []),describeDecisions(result.decisions)].join("\n"),
    citations:[{kind:"assessment",ref:result.id,version:result.ruleVersion},...result.decisions.flatMap(d=>d.citations)] };
}

async function hypothetical(ctx: Context, message: Extract<MessageInput,{intent:"hypothetical"}>): Promise<Answer> {
  const subjectId = message.subjectId ?? message.variant[0].subjectId;
  if (message.variant.some(f => f.subjectId !== subjectId)) throw new ApiProblem(422,"mixed_variant_subjects");
  const input = {subjectId, benefit:"maternity", asOf:message.validAt ?? new Date().toISOString().slice(0,10),
    profileRevision:ctx.profile.revision,caseRevision:ctx.file.revision};
  const snapshot = await snapshotFor(ctx,input,message.knownAt);
  const actual = assessCase(input,snapshot);
  const assumptions = message.variant.map(f => (labels[f.field] ?? f.field) + " " + (f.validFrom ?? f.asOf) + ": " + valueText(f)).join(", ");
  const intro = "Symulacja. Założenia: " + assumptions + ". ";
  if (!actual.some(d=>d.titleRef && d.payerRef)) {
    return {answer:intro + describeDecisions(actual),citations:actual.flatMap(d=>d.citations)};
  }
  let variant;
  try { variant = assessCaseVariant(input,snapshot,message.variant); }
  catch (error) {
    if (error instanceof Error && ["invalid_assessment_variant","duplicate_variant_field","unused_assessment_variant"].includes(error.message)) {
      throw new ApiProblem(422,error.message);
    }
    throw error;
  }
  const lines = variant.map(d => {
    const before = actual.find(a=>a.titleRef===d.titleRef && a.payerRef===d.payerRef && a.from===d.from && a.to===d.to);
    const delta = d.grossAmountGrosze !== undefined && before?.grossAmountGrosze !== undefined
      ? " Różnica wobec zapisanej kwoty " + money(before.grossAmountGrosze) + ": " + money(d.grossAmountGrosze-before.grossAmountGrosze) + "." : "";
    return describeDecisions([d]) + delta;
  });
  return {answer:intro + lines.join("\n"),citations:variant.flatMap(d=>d.citations)};
}

export async function createMessage(ctx: Context, input: MessageInput, publicAnswer: (question: string, previous?: Message) => Promise<Answer>) {
  let previous: Message | undefined;
  if ("replyTo" in input && input.replyTo) previous = await readTurn(ctx,"message",input.replyTo);
  else previous = (await ctx.db.query("SELECT body FROM zusik.v1_turns WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND kind='message' ORDER BY created_at DESC,id DESC LIMIT 1",
    [ctx.owner,ctx.profile.id,ctx.file.id])).rows[0]?.body;
  let response: Answer;
  if (input.intent === "read_account" || input.intent === "link_account") {
    response = await accountAnswer(ctx,input);
  } else if (input.intent === "public_question") {
    response = await publicAnswer(input.publicQuestion,previous?.input.intent === "public_question" ? previous : undefined);
  } else if (input.intent === "ask_case" && input.topic === "previous_sources" && previous) {
    response = {answer: previous.answer,citations:previous.citations};
  } else if (input.intent === "explain_result") {
    response = describe(await readTurn(ctx,"assessment",input.assessmentId));
  } else if (input.intent === "declare_fact") {
    if (input.basisProfileRevision !== ctx.profile.revision) throw new ApiProblem(409,"profile_revision_mismatch");
    ctx.profile = await ctx.repo.patchProfile(ctx.profile.id, ctx.profile.revision, {changes:[{action:"add_fact",fact:input.fact}]},ctx.file.id);
    const rows = await collect(afterId => ctx.repo.listFacts(ctx.profile.id,{caseId:ctx.file.id,subjectId:input.fact.subjectId},{afterId,limit:100}));
    const proposals = await collect(afterId => ctx.repo.listProposals(ctx.profile.id,{afterId,limit:100}));
    const proposalIds = proposals.filter(p => p.status === "pending" && p.fact.subjectId === input.fact.subjectId && p.fact.field === input.fact.field && p.fact.source.referenceId === input.fact.source.referenceId).map(p=>p.id);
    response = {...factAnswer(rows.filter(r => r.fact.field === input.fact.field && r.fact.validFrom === input.fact.validFrom && r.fact.asOf === input.fact.asOf)),proposalIds};
    if (proposalIds.length) response.answer += " Potwierdź, która wartość ma obowiązywać.";
  } else if (input.intent === "hypothetical") {
    response = await hypothetical(ctx,input);
  } else {
    const subjectId = input.subjectId ?? (ctx.profile.subjects.length === 1 ? ctx.profile.subjects[0] : undefined);
    if (subjectId && !ctx.profile.subjects.includes(subjectId)) throw new ApiProblem(422,"unknown_subject");
    const facts = await collect(afterId => ctx.repo.listFacts(ctx.profile.id,{caseId:ctx.file.id,subjectId,knownAt:input.knownAt,
      validAt:input.intent === "read_context" ? input.validAt : undefined},{afterId,limit:100}));
    const matching = facts.filter(f=>input.intent !== "read_context" || f.fact.field === input.topic);
    const people = [...new Set(matching.map(r=>r.fact.subjectId))];
    const subject = subjectId ?? (people.length === 1 ? people[0] : undefined);
    if (!subject) response = {answer:ctx.profile.subjects.length ? "Której osoby dotyczy pytanie?" : "Dodaj osobę i potwierdź dane z wniosku, aby rozpocząć analizę.",citations:[]};
    else if (input.intent === "read_context") response = matching.length ? factAnswer(matching) :
      {answer:`Brakuje informacji „${labels[input.topic] ?? input.topic}” dla tej osoby${input.validAt ? " na " + input.validAt : ""}. Możesz ją podać lub dołączyć dokument.`,citations:[]};
    else {
      const benefits = [...new Set(matching.filter(r => String(r.fact.field) === "benefitRequest" && r.fact.value.kind === "code").map(r=>valueText(r.fact)))];
      if (input.topic && !benefits.includes(input.topic)) benefits.push(input.topic);
      if (!benefits.length) {
        const partial = factAnswer(matching);
        response = { ...partial, answer: [partial.answer,"Wskaż świadczenie i okres z wniosku."].filter(Boolean).join(" ") };
      } else {
        const parts = [];
        for (const benefit of benefits) parts.push(describe(await assess(ctx,{subjectId:subject,benefit,asOf:input.validAt ?? new Date().toISOString().slice(0,10),caseRevision:ctx.file.revision,profileRevision:ctx.profile.revision},input.knownAt)));
        response = {answer:parts.map(r=>r.answer).join("\n"),citations:parts.flatMap(r=>r.citations)};
      }
    }
  }
  if (input.intent === "read_context" && input.publicTopic === "nursery_recipient") {
    try {
      const publicPart = await publicAnswer("Komu ZUS wypłaca świadczenie aktywnie w żłobku?");
      response.answer += " " + publicPart.answer;
      response.citations.push(...publicPart.citations);
    } catch { response.answer += " Nie udało się teraz sprawdzić odbiorcy przelewu w źródle ZUS."; }
  }
  const message: Message = {proposalIds:[],...response,id:randomUUID(),input,state:"completed",profileRevision:ctx.profile.revision,caseRevision:ctx.file.revision};
  await save(ctx,"message",message);
  return message;
}
