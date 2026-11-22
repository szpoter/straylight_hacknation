import { publicQuestion } from "../../rag/public-query";
import { chatStarters } from "../conversation";
import type { EvidenceFact } from "../memory/contract";
import type { MessageInput } from "./conversation";

type History = { id: string; input: {intent:string}; citations: {kind:string;ref:string}[] };
type Context = { facts: EvidenceFact[]; subjectId?: string; lastMessage?: History; assessmentId?: string; hasDocuments?: boolean };
type Result = {input:MessageInput} | {clarify:string} | {correction:true};
const recipient = "Komu ZUS wypłaca świadczenie aktywnie w żłobku?";
const months = ["stycz","lut","mar","kwie","maj","czerw","lip","sierp","wrze","paźdz","listop","grudz"];

function payVariant(q: string, ctx: Context): Result {
  const amount = /(?:^|\s)(\d{1,3}(?:[ \u00a0]\d{3})+|\d+)(?:[,.](\d{1,2}))?\s*(?:zł|pln)/iu.exec(q);
  if (!amount) return {clarify:"Jaką kwotę brutto zakładasz i za który miesiąc?"};
  const month = /\b(20\d\d)-(0[1-9]|1[012])\b/u.exec(q);
  const year = /\b(20\d\d)\b/u.exec(q)?.[1];
  const index = months.findIndex(m=>new RegExp("(?<!\\p{L})"+m+"\\p{L}*","iu").test(q));
  const afterDeduction = /po (?:potrąceniu|odliczeniu) składek/iu.test(q);
  const field = afterDeduction ? "monthlyPayAfterDeduction" : "monthlyGrossPay";
  // A gross row can locate the month when the user supplies an absolute amount after deductions.
  const rows = ctx.facts.filter(r=>r.fact.field === "monthlyGrossPay" && (!ctx.subjectId || r.fact.subjectId === ctx.subjectId) &&
    (!month || r.fact.validFrom?.startsWith(month[0])) &&
    (index === -1 || Number(r.fact.validFrom?.slice(5,7)) === index+1) && (!year || r.fact.validFrom?.startsWith(year)));
  if (rows.length !== 1 || rows[0].fact.value.kind !== "money") return {clarify:"Wskaż jeden miesiąc, rok i płatnika z potwierdzonego zestawienia wynagrodzeń."};
  const grosze = Number(amount[1].replace(/\s/g,"")) * 100 + Number((amount[2] ?? "").padEnd(2,"0"));
  const fact = rows[0].fact;
  const relative = /(?:podwyżk\p{L}*\s+o|więcej o|wyższ\p{L}* o)\s*$/iu.test(q.slice(0,amount.index).trimEnd()) ||
    /^\s+więcej/iu.test(q.slice(amount.index + amount[0].length));
  if (relative && afterDeduction) return {clarify:"Podaj nową kwotę po potrąceniu składek za wskazany miesiąc."};
  const next = relative && fact.value.kind === "money" ? fact.value.grosze + grosze : grosze;
  if (!Number.isSafeInteger(next)) return {clarify:"Podaj kwotę w złotych i groszach."};
  return {input:{intent:"hypothetical",subjectId:fact.subjectId,variant:[{...fact,field,value:{kind:"money",currency:"PLN",grosze:next},
    source:{kind:"declaration",referenceId:"variant"}}]}};
}

/** Free-form input is projected locally. Only public vocabulary or typed facts reach HTTP. */
export function routeCaseQuestion(question: string, ctx: Context): Result {
  const text = question.trim();
  const prior = ctx.lastMessage;
  const privateContext = Boolean(ctx.hasDocuments || ctx.facts.length || ctx.assessmentId ||
    (prior && prior.input.intent !== "public_question"));
  const date = /\b\d{4}-\d{2}-\d{2}\b/u.exec(text)?.[0];
  const starter = chatStarters.find(s=>s.prompt===text);
  if (starter && !privateContext) return {input:{intent:"public_question",publicQuestion:starter.prompt}};
  if (/gdyby|hipotetycz|co jeśli|co by było/iu.test(text)) return payVariant(text,ctx);
  const changeTopic = /^(?:nie[, ]+)?(?:chodzi(?:ło)? mi o|chodzi o|pytam o|mam na myśli) (?:program )?(dobry start|300\s*(?:plus|\+)|aktywnie w żłobku|żłobek)[?!. ]*$/iu.exec(text);
  if (changeTopic && prior?.input.intent === "public_question") {
    const topic = /żłob/iu.test(changeTopic[1]) ? "Aktywnie w żłobku" : "Dobry Start";
    return {input:{intent:"public_question",publicQuestion:"Chodzi mi o " + topic + ".",replyTo:prior.id}};
  }
  if (/^(?:nie[, ]+)?(?:popraw|sprostuj|korekt|jednak|zmień|pomyli)/iu.test(text) && ctx.facts.length) return {correction:true};
  if (/skąd|dlaczego|pokaż źródło|na jakiej podstawie/iu.test(text)) {
    const assessmentId = prior ? prior.citations.find(c=>c.kind==="assessment")?.ref : ctx.assessmentId;
    if (prior?.input.intent === "public_question" && (!privateContext || /^(?:skąd to wiesz|dlaczego|pokaż źródło|na jakiej podstawie)[?!. ]*$/iu.test(text)))
      return {input:{intent:"public_question",publicQuestion:"Skąd to wiesz?",replyTo:prior.id}};
    if (assessmentId) return {input:{intent:"explain_result",assessmentId}};
    if (prior) return {input:{intent:"ask_case",topic:"previous_sources",replyTo:prior.id}};
  }
  const birth = /urodz(?:ił|iła|enia)|dat[ęay] urodz/iu.test(text) && /kiedy|jak[aą]|data|podaj|ile lat/iu.test(text);
  const topic = birth ? "birthDate" : /stan wniosku|status wniosku|czy (?:już )?(?:złożył|wysłał|złożono|wysłano)/iu.test(text) ? "submissionStatus" :
    /(?:ile|jakie|moj[ea]|podaj|pokaż).*(?:zarabia|zarob|pensj|wynagrodz)|(?:moja pensja|moje wynagrodzenie)/iu.test(text) ? "monthlyGrossPay" :
    /czy (?:mam|miał[ae]m|był[ae]m).{0,15}ubezpiecz/iu.test(text) ? "sicknessCoverage" : undefined;
  const nursery = /żłob|zlob/iu.test(text) && /komu|kto .*(?:dosta|otrzy)|czyje konto|czyj rachunek/iu.test(text);
  if (topic) return {input:{intent:"read_context",topic,subjectId:ctx.subjectId || undefined,validAt:date,...(nursery ? {publicTopic:"nursery_recipient" as const} : {})}};
  const generalNursery = /^(?:komu (?:zus )?(?:wypłaca|przekazuje)|na czyje konto (?:zus )?(?:przelewa|wypłaca)) (?:świadczenie )?[„"]?aktywnie w żłobku[”"?!. ]*$/iu.test(text);
  if ((nursery && (!privateContext || generalNursery)) || (prior?.input.intent === "public_question" && /^(?:a |i )?na czyje konto[?!. ]*$/iu.test(text)))
    return {input:{intent:"public_question",publicQuestion:nursery ? recipient : "Na czyje konto?",replyTo:prior?.input.intent === "public_question" ? prior.id : undefined}};
  if (/^(?:hej|cześć|co umiesz|jak możesz mi pomóc)[?!. ]*$/iu.test(text)) return {input:{intent:"public_question",publicQuestion:"Co umiesz?"}};
  const direct = publicQuestion(text);
  const explicitlyGeneral = /^(?:ogólnie\b|jakie są ogólne zasady\b|co (?:mówią|stanowią) przepisy\b)/iu.test(text);
  if (direct?.question && !direct.clarify && (!privateContext || explicitlyGeneral || text === direct.question)) {
    return {input:{intent:"public_question",publicQuestion:direct.question,replyTo:prior?.input.intent === "public_question" ? prior.id : undefined}};
  }
  if (prior?.input.intent === "public_question" && /^(?:(?:a |i )?(?:jakie dokumenty|do kiedy|ile dni|jak długo|ile tygodni|gdzie złożyć|w jakim terminie))[?!. ]*$/iu.test(text))
    return {input:{intent:"public_question",publicQuestion:text,replyTo:prior.id}};
  if (!privateContext) return {clarify:direct?.clarify ?? "Którego świadczenia, wniosku lub okresu dotyczy pytanie?"};
  return {input:{intent:"ask_case",subjectId:ctx.subjectId || undefined,validAt:date}};
}
