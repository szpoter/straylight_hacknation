import { z } from "zod";
import { linkSimulatedAccount, readSimulatedAccount } from "../memory/account";
import type { Answer, Context } from "./conversation";
import { ApiProblem } from "./http";

const areas = ["insurance","contributions","e_zla","balance","benefits"] as const;
const area = z.enum(areas);
export const accountLinkInput = z.strictObject({intent:z.literal("link_account"), subjectId:z.string().min(1).max(128),
  scenario:z.enum(["employment-transition","business-settlement","unavailable"]), basisCaseRevision:z.int().positive()});
export const accountReadInput = z.strictObject({intent:z.literal("read_account"),subjectId:z.string().min(1).max(128),
  from:z.iso.date(),to:z.iso.date(),areas:z.array(area).min(1).max(5),titleRef:z.string().min(1).max(128).optional(),payerRef:z.string().min(1).max(128).optional()});
export type AccountReport = Awaited<ReturnType<typeof readSimulatedAccount>>;
const topics = {insurance:"ubezpieczenie",contributions:"składki",e_zla:"e-ZLA",balance:"saldo",benefits:"świadczenia"};
const coverage = {no_register:"brak powiązanego konta",unavailable:"rejestr niedostępny",unknown:"brak pokrycia okresu",partial:"częściowe pokrycie okresu",complete:"pełne pokrycie okresu"};
const codes: Record<string,string> = {employee:"umowa o pracę",contract:"umowa zlecenia",business:"działalność",covered:"objęcie ubezpieczeniem",issued:"wystawione e-ZLA",sickness_paid:"wypłacony zasiłek chorobowy"};

export async function accountAnswer(ctx: Context, input: z.infer<typeof accountReadInput> | z.infer<typeof accountLinkInput>): Promise<Answer> {
  if (input.intent === "link_account") {
    ctx.file = await linkSimulatedAccount(ctx.repo,ctx.db,ctx.file.id,input.subjectId,input.scenario,input.basisCaseRevision);
    return {answer:"Powiązano symulowane konto ZUS z wybraną osobą w tej sprawie.",citations:[]};
  }
  if (input.from>input.to) throw new ApiProblem(422,"invalid_period");
  const {subjectId,from,to,areas,titleRef,payerRef} = input;
  const report = await readSimulatedAccount(ctx.repo,ctx.db,{caseId:ctx.file.id,subjectId,from,to,areas,titleRef,payerRef});
  const lines = report.facts.map(f => {
    const v = f.value;
    const value = v.kind==="money" ? (v.grosze/100).toLocaleString("pl-PL",{style:"currency",currency:"PLN"}) :
      v.kind==="date" ? v.date : v.kind==="count" ? String(v.count) : (codes[v.code] ?? v.code);
    const label = f.field==="accountArrears" ? "Zadłużenie" : f.field==="monthlyContributionBasis" ? "Podstawa składek" : "Zapis";
    return `${label}: ${value} (${f.validFrom ?? f.asOf}${f.validTo ? " – "+f.validTo : ""}).`;
  });
  for (const c of report.coverage) lines.push(`Symulowane konto ZUS, ${topics[c.area]}: ${coverage[c.status as keyof typeof coverage]} (${input.from} – ${input.to}).`);
  return {answer:lines.join("\n"), account:report,citations: report.facts.map(f=>({kind:"account",ref:f.source.referenceId,version:report.sourceVersion}))};
}
