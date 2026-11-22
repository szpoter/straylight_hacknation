import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { linkSimulatedAccount, readSimulatedAccount, type AccountScenario } from "../src/lib/zusik/memory/account";
import { purgeExpiredProfiles } from "../src/lib/zusik/memory/retention";
import { withMemoryTransaction } from "../src/lib/zusik/memory/repository";
import { type EvidenceFact, type FactInput, type MemoryRepository, type Patch } from "../src/lib/zusik/memory/contract";

// A named disposable database on a local UNIX socket keeps these tests off deployed databases.
const socket = process.env.MEMORY_TEST_SOCKET;
const db = socket ? new Pool({host:socket,port:Number(process.env.MEMORY_TEST_PORT??5432),database:"memory_b_test",user:"zusik_runtime"}) : null;
const pay: FactInput = { subjectId:"A",field:"monthlyGrossPay",value:{kind:"money",currency:"PLN",grosze:600000},
  validFrom:"2026-02-01",validTo:"2026-02-28",payerRef:"P",titleRef:"T",source:{kind:"declaration",referenceId:"statement-A"} };
const initial: Patch = {changes:[{action:"add_subject",subjectId:"A",role:"parent"},{action:"add_fact",fact:pay}]};
const changed = (grosze: number): FactInput => ({...pay,value:{kind:"money",grosze,currency:"PLN"}});

describe.skipIf(!db)("memory repository on PostgreSQL", () => {
  let owner: string, profileId: string, caseId: string, first: EvidenceFact;
  function tx<T>(work: (r: MemoryRepository)=>Promise<T>, who=owner) {
    if (!db || !socket?.startsWith("/")) throw new Error("local_test_socket_required");
    return withMemoryTransaction(db,who,work);
  }
  beforeEach(async () => {
    owner=randomUUID();
    await tx(async r => {
      profileId=(await r.createProfile({mode:"case_import"})).id;
      caseId=(await r.createCase(profileId)).id;
      expect((await r.patchProfile(profileId,1,initial)).revision).toBe(2);
      first=(await r.listFacts(profileId)).items[0];
    });
  });
  afterAll(async () => { await db?.end(); });

  it("fresh reads reproduce both revisions and endpoints of the February interval",async () => {
    const facts=await tx(r=>r.listFacts(profileId,{validAt:"2026-02-28"}));
    expect(facts.items).toEqual([first]);
    expect((await tx(r=>r.listFacts(profileId,{validAt:"2026-03-01"}))).items).toHaveLength(0);
    expect(await tx(r=>r.patchProfile(profileId,2,{changes:[{action:"correct_fact",previousFactId:first.factId,fact:changed(650000)}]}))).toMatchObject({revision:3});
    expect((await tx(r=>r.listFacts(profileId,{knownAt:first.recordedAt,validAt:"2026-02-01"}))).items).toEqual([first]);
    expect((await tx(r=>r.listFacts(profileId))).items).toMatchObject([{version:2,supersedes:first.factId,fact:{value:{grosze:650000}}}]);
  });

  it("splits change_from and rolls back an invalid final operation",async () => {
    const change = {action:"change_from",previousFactId:first.factId,fact:{...changed(0),validFrom:"2026-02-15"}} as const;
    await expect(tx(r=>r.patchProfile(profileId,2,{changes:[change,{action:"withdraw_fact",previousFactId:"missing"}]}))).rejects.toMatchObject({status:422});
    expect((await tx(r=>r.getProfile(profileId))).revision).toBe(2);
    await tx(r=>r.patchProfile(profileId,2,{changes:[change]}));
    for (const [day,amount] of [["2026-02-14",600000],["2026-02-15",0]] as const) {
      expect((await tx(r=>r.listFacts(profileId,{validAt:day}))).items).toMatchObject([{fact:{value:{grosze:amount}}}]);
    }
    const page=await tx(r=>r.listFacts(profileId,{}, {limit:1}));
    expect(page.nextAfterId).toBeTruthy();
    const rest=await tx(r=>r.listFacts(profileId,{}, {limit:1,afterId:page.nextAfterId??undefined}));
    expect(rest.nextAfterId).toBeNull();
    expect(rest.items[0].factId).not.toBe(page.items[0].factId);
  });

  it("requires a registered document and preserves both sources through a disputed correction",async () => {
    const input={clientDocumentId:"local-1",kind:"payroll",pages:2} as const;
    const doc=await tx(r=>r.registerDocument(caseId,input));
    expect(await tx(r=>r.registerDocument(caseId,input))).toEqual(doc);
    const fact: FactInput={...changed(650000),source:{kind:"document",referenceId:doc.id,page:2}};
    await tx(r=>r.patchProfile(profileId,2,{changes:[{action:"add_fact",fact}]},caseId));
    expect((await tx(r=>r.listFacts(profileId))).items[0].verification).toBe("disputed");
    const proposal=(await tx(r=>r.listProposals(profileId))).items[0];
    expect(proposal).toMatchObject({fact,status:"pending"});
    await tx(r=>r.patchProfile(profileId,3,{changes:[{action:"accept_proposal",proposalId:proposal.id}]}));
    expect((await tx(r=>r.listFacts(profileId))).items).toMatchObject([{fact,verification:"confirmed",version:2}]);
    expect((await tx(r=>r.listFacts(profileId,{knownAt:first.recordedAt}))).items).toEqual([first]);
    await tx(r=>r.deleteCase(caseId,2));
    expect((await tx(r=>r.listFacts(profileId))).items).toHaveLength(0);
    expect((await tx(r=>r.listProposals(profileId))).items).toHaveLength(0);
  });

  it("isolates owners, imported families and case documents, including raw SQL through runtime RLS",async () => {
    const other=randomUUID();
    await expect(tx(r=>r.getCase(caseId),other)).rejects.toMatchObject({status:404});
    await expect(tx(r=>r.listFacts(profileId),other)).rejects.toMatchObject({status:404});
    if (!db) throw new Error("missing_db");
    const raw=await withMemoryTransaction(db,other,async (_,c)=>c.query("select id from zusik.v1_facts where id=$1",[first.factId]));
    expect(raw.rowCount).toBe(0);
    const second=await tx(r=>r.createProfile({mode:"family"}));
    expect((await tx(r=>r.listFacts(second.id))).items).toEqual([]);
    const secondCase=await tx(r=>r.createCase(second.id));
    const {id}=await tx(r=>r.registerDocument(secondCase.id,{kind:"payroll",pages:1,clientDocumentId:"doc"}));
    await expect(tx(r=>r.patchProfile(profileId,2,{changes:[{action:"add_fact",fact:{...pay,source:{kind:"document",referenceId:id,page:1}}}]}))).rejects.toMatchObject({status:404});
    await expect(tx(r=>r.patchProfile(profileId,2,{changes:[{action:"add_fact",fact:{...pay,source:{kind:"simulated_zus",referenceId:"claimed"}}}]}))).rejects.toMatchObject({status:422});
  });

  it("preserves mixed page metadata, protects decision pages and accepts legacy documents", async () => {
    const input: import("../src/lib/zusik/memory/contract").DocInput = {
      clientDocumentId:"mixed",pages:2,kind:"decision",pageKinds:["payroll","decision"],
    };
    const doc=await tx(r=>r.registerDocument(caseId,input));
    expect(await tx(r=>r.getDocument(caseId,doc.id))).toEqual({id:doc.id,metadata:input});
    await expect(tx(r=>r.registerDocument(caseId,{...input,pageKinds:["other","decision"]}))).rejects.toMatchObject({status:409});
    await expect(tx(r=>r.registerDocument(caseId,{...input,pageKinds:["payroll"]}))).rejects.toThrow();
    const patch = (page:number): Patch => ({changes:[{action:"correct_fact",previousFactId:first.factId,
      fact:{...changed(650000),source:{kind:"document",referenceId:doc.id,page}}}]});
    await expect(tx(r=>r.patchProfile(profileId,2,patch(2)))).rejects.toMatchObject({code:"decision_explanation_only"});
    await expect(tx(r=>r.patchProfile(profileId,2,patch(1)))).resolves.toMatchObject({revision:3});
  });

  it("scopes two simulated accounts, two insurance titles, balances and source confirmation",async () => {
    if (!db) throw new Error("missing_db");
    const pool=db;
    await tx(r=>r.patchProfile(profileId,2,{changes:[{action:"add_subject",subjectId:"B",role:"parent"}]}));
    const link=(subject:string,scenario:AccountScenario,revision:number)=>withMemoryTransaction(pool,owner,(r,c)=>
      linkSimulatedAccount(r,c,caseId,subject,scenario,revision));
    const read=(subjectId:string,day:string,who=owner)=>withMemoryTransaction(pool,who,(r,c)=>readSimulatedAccount(r,c,{
      caseId,subjectId,from:day,to:day,areas:["insurance","balance","e_zla","benefits","contributions"]}));
    expect((await read("A","2026-05-10")).coverage[0].status).toBe("no_register");
    await link("A","employment-transition",1);
    await link("B","business-settlement",2);
    const on10=await read("A","2026-05-10");
    expect(on10.facts.map(f=>f.titleRef)).toContain("title-employee");
    expect((await read("A","2026-05-11")).facts.filter(f=>f.field==="sicknessCoverage")).toEqual([]);
    expect((await read("A","2026-05-12")).facts.filter(f=>f.field==="sicknessCoverage")).toEqual([]);
    const coverage=(await read("A","2026-05-15")).facts.find(f=>f.field==="sicknessCoverage");
    if (!coverage) throw new Error("missing_coverage");
    expect(coverage.titleRef).toBe("title-contract");
    expect((await read("B","2026-05-01")).facts.find(f=>f.field==="accountArrears")?.value).toMatchObject({grosze:120000});
    expect((await read("B","2026-05-19")).facts.find(f=>f.field==="accountArrears")?.value).toMatchObject({grosze:0});
    expect((await read("B","2026-05-20")).coverage.find(c=>c.area==="balance")?.status).toBe("unknown");
    await expect(read("A","2026-05-10",randomUUID())).rejects.toMatchObject({status:404});
    const patch=(fact:FactInput):Patch=>({changes:[{action:"add_fact",fact}]});
    await expect(tx(r=>r.patchProfile(profileId,3,patch({...coverage,value:{kind:"code",code:"excluded"}})))).rejects.toMatchObject({code:"unverified_source"});
    await expect(tx(r=>r.patchProfile(profileId,3,patch(coverage)))).resolves.toMatchObject({revision:4});
    expect((await tx(r=>r.listFacts(profileId,{validAt:"2026-05-15",subjectId:"A",caseId}))).items).toMatchObject([{verification:"confirmed",fact:coverage}]);
    expect((await tx(r=>r.patchProfile(profileId,4,patch(coverage)))).revision).toBe(4);
    expect((await tx(r=>r.listFacts(profileId,{validAt:"2026-05-15",subjectId:"B"}))).items).toEqual([]);
  });

  it("keeps corrected case declarations inside their original case and rejects a sibling document",async () => {
    const sibling=await tx(r=>r.createCase(profileId));
    const privateFact:FactInput={...pay,field:"employerRef",value:{kind:"code",code:"payer-first"}};
    await tx(r=>r.patchProfile(profileId,2,{changes:[{action:"add_fact",fact:privateFact}]},caseId));
    const row=(await tx(r=>r.listFacts(profileId,{caseId}))).items.find(f=>f.fact.field==="employerRef");
    if (!row) throw new Error("missing_case_declaration");
    const doc=await tx(r=>r.registerDocument(sibling.id,{kind:"payroll",pages:1,clientDocumentId:"sibling"}));
    await expect(tx(r=>r.patchProfile(profileId,3,{changes:[{action:"correct_fact",previousFactId:row.factId,
      fact:{...privateFact,source:{kind:"document",referenceId:doc.id,page:1}}}]}))).rejects.toMatchObject({status:404});
    await tx(r=>r.patchProfile(profileId,3,{changes:[{action:"correct_fact",previousFactId:row.factId,
      fact:{...privateFact,value:{kind:"code",code:"payer-corrected"}}}]}));
    expect((await tx(r=>r.listFacts(profileId,{caseId:sibling.id}))).items.some(f=>f.fact.field==="employerRef")).toBe(false);
  });

  it("purges expired profiles for absent owners, their private evidence and cases",async () => {
    if (!db) throw new Error("missing_db");
    const remaining=await tx(r=>r.createProfile({mode:"family"}));
    await withMemoryTransaction(db,owner,(_,c)=>c.query("update zusik.v1_profiles set expires_at=now() - interval '1 day' where owner_session=$1 and id=$2",[owner,profileId]));
    const maintenance=new Pool({host:socket,port:Number(process.env.MEMORY_TEST_PORT??5432),database:"memory_b_test",user:"memory_test"});
    try {
      expect(await purgeExpiredProfiles(maintenance)).toBeGreaterThan(0);
      for (const table of ["facts","cases","subjects"]) {
        const {rowCount}=await maintenance.query(`select 1 from zusik.v1_${table} where owner_session=$1 and profile_id=$2`,[owner,profileId]);
        expect(rowCount).toBe(0);
      }
    } finally { await maintenance.end(); }
    expect((await tx(r=>r.listProfiles())).items).toEqual([remaining]);
  });

  it("deduplicates declarations, serializes two editors and cascades deletion",async () => {
    expect((await tx(r=>r.patchProfile(profileId,2,initial))).revision).toBe(2);
    const results=await Promise.allSettled([650000,610000].map(n=>tx(r=>r.patchProfile(profileId,2,{changes:[{action:"correct_fact",previousFactId:first.factId,fact:changed(n)}]}))));
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    expect(results.find(r=>r.status==="rejected")).toMatchObject({reason:{status:412,revision:3}});
    await tx(r=>r.deleteProfile(profileId,3));
    await expect(tx(r=>r.getCase(caseId))).rejects.toMatchObject({status:404});
  });
});
