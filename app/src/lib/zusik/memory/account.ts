import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { PoolClient } from "pg";
import { z } from "zod";
import { MemoryError, type FactInput, type MemoryRepository } from "./contract";

const scenarios = z.enum(["employment-transition","business-settlement","unavailable"]);
export type AccountScenario = z.infer<typeof scenarios>;
const areas = z.enum(["insurance","contributions","e_zla","balance","benefits"]);
type Area = z.infer<typeof areas>;
const readInput = z.strictObject({ caseId:z.string().min(1),subjectId:z.string().min(1),from:z.iso.date(),to:z.iso.date(),
  areas:z.array(areas).min(1).max(5),titleRef:z.string().optional(),payerRef:z.string().optional() }).refine(r=>r.from<=r.to);
type AccountQuery = z.infer<typeof readInput>;
const sourceVersion = "synthetic-ezus-1";
type RecordInput = Omit<FactInput,"subjectId"|"source"> & { area:Area };

const code = (code:string) => ({kind:"code",code} as const);
const money = (grosze:number) => ({kind:"money",currency:"PLN",grosze} as const);
const employee = {titleRef:"title-employee",payerRef:"payer-one"};
const contract = {titleRef:"title-contract",payerRef:"payer-two"};
const business = {titleRef:"title-business",payerRef:"payer-self"};
const records: Record<Exclude<AccountScenario,"unavailable">,RecordInput[]> = {
  "employment-transition":[
    {area:"insurance",field:"insuranceTitle",value:code("employee"),validFrom:"2026-05-01",validTo:"2026-05-10",...employee},
    {area:"insurance",field:"sicknessCoverage",value:code("covered"),validFrom:"2026-05-01",validTo:"2026-05-10",...employee},
    {area:"insurance",field:"insuranceTitle",value:code("contract"),validFrom:"2026-05-12",validTo:"2026-05-31",...contract},
    {area:"insurance",field:"sicknessCoverage",value:code("covered"),validFrom:"2026-05-15",validTo:"2026-05-31",...contract},
    {area:"contributions",field:"monthlyContributionBasis",value:money(430000),validFrom:"2026-05-01",validTo:"2026-05-31",...employee},
    {area:"e_zla",field:"sicknessCertificate",value:code("issued"),validFrom:"2026-05-18",validTo:"2026-05-21",...contract},
  ],
  "business-settlement":[
    {area:"insurance",field:"insuranceTitle",value:code("business"),validFrom:"2026-05-01",validTo:"2026-05-31",...business},
    {area:"balance",field:"accountArrears",value:money(120000),asOf:"2026-05-01",...business},
    {area:"balance",field:"accountArrears",value:money(0),asOf:"2026-05-19",...business},
    {area:"benefits",field:"benefitHistory",value:code("sickness_paid"),validFrom:"2026-05-01",validTo:"2026-05-04",...business},
  ],
};

function candidate(caseId:string,subjectId:string,scenario:string,index:number,record:RecordInput): FactInput {
  const referenceId=createHash("sha256").update(JSON.stringify([sourceVersion,caseId,subjectId,scenario,index])).digest("hex");
  const {area, ...fact}=record;
  return {...fact,subjectId,source:{kind:"simulated_zus",referenceId:area+"-"+referenceId}};
}

// Called only for an explicit scenario selection in D's authenticated, idempotent transaction.
export async function linkSimulatedAccount(repo:MemoryRepository, db:PoolClient, caseId:string, subjectId:string,
  scenario:AccountScenario, expectedCaseRevision:number) {
  scenarios.parse(scenario);
  const {profileId}=await repo.getCase(caseId);
  const profile=await repo.getProfile(profileId,true);
  const current=await repo.getCase(caseId,true);
  if (expectedCaseRevision!==current.revision) throw new MemoryError(412,"stale_revision",current.revision);
  if (!profile.subjects.includes(subjectId)) throw new MemoryError(422,"unknown_subject");
  const args=[profileId,caseId,subjectId];
  const owner="current_setting('zusik.owner_session')";
  const linked=await db.query(`SELECT scenario FROM zusik.v1_account_links WHERE owner_session=${owner}
    AND profile_id=$1 AND case_id=$2 AND subject_id=$3`,args);
  if (linked.rowCount) {
    if (linked.rows[0].scenario!==scenario) throw new MemoryError(409,"account_already_linked");
    return current;
  }
  await db.query(`INSERT INTO zusik.v1_account_links(owner_session,profile_id,case_id,subject_id,scenario)
    VALUES(${owner},$1,$2,$3,$4)`,[...args,scenario]);
  await db.query(`UPDATE zusik.v1_cases SET revision=revision+1 WHERE owner_session=${owner} AND profile_id=$1 AND id=$2`,args.slice(0,2));
  return repo.getCase(caseId);
}

export async function readSimulatedAccount(repo:MemoryRepository, db:PoolClient, query:AccountQuery) {
  const input=readInput.parse(query);
  const {profileId}=await repo.getCase(input.caseId);
  if (!(await repo.getProfile(profileId)).subjects.includes(input.subjectId)) throw new MemoryError(422,"unknown_subject");
  const {rows}=await db.query<{scenario:AccountScenario}>(`SELECT scenario FROM zusik.v1_account_links
    WHERE owner_session=current_setting('zusik.owner_session') AND profile_id=$1 AND case_id=$2 AND subject_id=$3`,
    [profileId,input.caseId,input.subjectId]);
  const scenario=rows[0]?.scenario;
  const data=scenario && scenario!=="unavailable"?records[scenario]:[];
  const facts:FactInput[]=[];
  const coverage=input.areas.map(area=>{
    const spans: {from:string;to:string}[]=[];
    // The transition ledger is complete for insurance in May. Other areas only cover the returned records.
    const completeMonth=scenario==="employment-transition" && area==="insurance";
    if (completeMonth && input.from<="2026-05-31" && input.to>="2026-05-01") spans.push({
      from:input.from>"2026-05-01"?input.from:"2026-05-01",to:input.to<"2026-05-31"?input.to:"2026-05-31",
    });
    for (const [index,record] of data.entries()) {
      if (record.area!==area || (input.titleRef && record.titleRef!==input.titleRef) || (input.payerRef && record.payerRef!==input.payerRef)) continue;
      const from=record.validFrom??record.asOf as string, to=record.validTo??from;
      if (to<input.from || from>input.to) continue;
      facts.push(candidate(input.caseId,input.subjectId,scenario,index,record));
      if (!completeMonth) spans.push({from:from<input.from?input.from:from,to:to>input.to?input.to:to});
    }
    const complete=(completeMonth || area==="balance") && spans.some(s=>s.from===input.from && s.to===input.to);
    const status=!scenario?"no_register":scenario==="unavailable"?"unavailable":complete?"complete":spans.length?"partial":"unknown";
    return {area,status,spans};
  });
  return {sourceVersion,readAt:new Date().toISOString(),facts,coverage};
}

// A caller may submit only the exact registered value from the selected synthetic account.
export async function verifyAccountFact(db:PoolClient,owner:string,profileId:string,caseId:string|undefined,fact:FactInput) {
  const {rows}=await db.query<{case_id:string;scenario:AccountScenario}>(`SELECT case_id,scenario FROM zusik.v1_account_links
    WHERE owner_session=$1 AND profile_id=$2 AND subject_id=$3 AND ($4::text IS NULL OR case_id=$4)`,
    [owner,profileId,fact.subjectId,caseId??null]);
  for (const link of rows) {
    if (link.scenario==="unavailable") continue;
    if (records[link.scenario].some((r,i)=>isDeepStrictEqual(candidate(link.case_id,fact.subjectId,link.scenario,i,r),fact))) {
      return link.case_id;
    }
  }
  throw new MemoryError(422,"unverified_source");
}
