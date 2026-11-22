import type { PoolClient } from "pg";
import { isDeepStrictEqual } from "node:util";
import { verifyAccountFact } from "./account";
import { MemoryError, type FactInput, type Patch, type Profile } from "./contract";

type Row = { id: string; fact: FactInput; version: number; case_id: string | null; document_id: string | null;
  verification: "declared" | "confirmed" | "withdrawn" };
type SourceScope = { caseId: string | null; documentId: string | null };
const start = (f: FactInput) => (f.validFrom ?? f.asOf) as string;
const end = (f: FactInput) => f.validTo ?? (f.validFrom ? "9999-12-31" : start(f));
const overlap = (a: FactInput,b: FactInput) => start(a) <= end(b) && start(b) <= end(a);
const sameKey = (a: FactInput,b: FactInput) => a.subjectId === b.subjectId && a.field === b.field &&
  a.payerRef === b.payerRef && a.titleRef === b.titleRef;
function adjacent(day: string, delta: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0,10);
}

export async function applyChanges(db: PoolClient, owner: string, profile: Profile, changes: Patch["changes"], caseId?: string) {
  const scope = [owner,profile.id];
  // One visible instant per atomic patch, including successive revisions in the same millisecond.
  const { rows: times } = await db.query(`SELECT greatest(date_trunc('milliseconds',clock_timestamp()),
    (SELECT max(created_at)+interval '1 millisecond' FROM zusik.v1_facts WHERE owner_session=$1 AND profile_id=$2),
    (SELECT greatest(max(created_at),max(resolved_at))+interval '1 millisecond' FROM zusik.v1_proposals WHERE owner_session=$1 AND profile_id=$2)) AS instant`,scope);
  const time: Date = times[0].instant;
  let dirty = false;

  async function source(fact: FactInput): Promise<SourceScope> {
    const { rows } = await db.query("SELECT 1 FROM zusik.v1_subjects WHERE owner_session=$1 AND profile_id=$2 AND id=$3", [...scope,fact.subjectId]);
    if (!rows.length) throw new MemoryError(422,"unknown_subject");
    if (fact.source.kind === "declaration" && fact.source.page === undefined) return { caseId: caseId??null,documentId:null };
    if (fact.source.kind === "simulated_zus") {
      return { caseId:await verifyAccountFact(db,owner,profile.id,caseId,fact),documentId:null };
    }
    if (fact.source.kind !== "document") throw new MemoryError(422,"unverified_source");
    const doc = await db.query(`SELECT metadata,case_id FROM zusik.v1_documents
      WHERE owner_session=$1 AND profile_id=$2 AND id=$3 AND ($4::text IS NULL OR case_id=$4)`,
    [...scope,fact.source.referenceId,caseId??null]);
    if (!doc.rowCount) throw new MemoryError(404,"not_found");
    if (!fact.source.page || fact.source.page > doc.rows[0].metadata.pages) throw new MemoryError(422,"invalid_evidence_page");
    const metadata = doc.rows[0].metadata;
    if ((metadata.pageKinds?.[fact.source.page - 1] ?? metadata.kind) === "decision") throw new MemoryError(422,"decision_explanation_only");
    return { caseId:doc.rows[0].case_id,documentId:fact.source.referenceId };
  }

  async function previous(id: string) {
    const { rows } = await db.query<Row>(`SELECT * FROM zusik.v1_facts WHERE owner_session=$1 AND profile_id=$2 AND id=$3
      AND ($4::text IS NULL OR case_id IS NULL OR case_id=$4) AND retired_at IS NULL AND verification<>'withdrawn'`,[...scope,id,caseId??null]);
    if (!rows.length) throw new MemoryError(422,"inactive_fact");
    return rows[0];
  }

  async function insert(fact: FactInput, origin: SourceScope, prior?: Row, withdraw = false) {
    const verification = withdraw ? "withdrawn" : fact.source.kind === "declaration" ? "declared" : "confirmed";
    await db.query(`INSERT INTO zusik.v1_facts(owner_session,profile_id,fact,case_id,document_id,verification,version,supersedes,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[...scope,fact,origin.caseId,origin.documentId,verification,(prior?.version??0)+1,prior?.id??null,time]);
    dirty = true;
  }

  async function retire(row: Row) {
    await db.query("UPDATE zusik.v1_facts SET retired_at=$4 WHERE owner_session=$1 AND profile_id=$2 AND id=$3",[...scope,row.id,time]);
    await db.query(`UPDATE zusik.v1_proposals SET status='obsolete',resolved_at=$4
      WHERE owner_session=$1 AND profile_id=$2 AND previous_id=$3 AND status='pending'`,[...scope,row.id,time]);
  }

  function keepCase(row: Row, origin: SourceScope): SourceScope {
    if (row.case_id && origin.caseId && row.case_id !== origin.caseId) throw new MemoryError(404,"not_found");
    return { ...origin,caseId:origin.caseId ?? row.case_id };
  }

  async function proposals(row: Row, fact: FactInput, source: SourceScope) {
    const origin = keepCase(row,source);
    const result = await db.query(`INSERT INTO zusik.v1_proposals(owner_session,profile_id,previous_id,fact,case_id,document_id,basis_revision,reason_code,created_at)
      SELECT $1,$2,$3,$4,$5,$6,$7,'source_conflict',$8 WHERE NOT EXISTS (
      SELECT 1 FROM zusik.v1_proposals WHERE owner_session=$1 AND profile_id=$2 AND previous_id=$3 AND fact=$4::jsonb
        AND case_id IS NOT DISTINCT FROM $5 AND status='pending')`,[...scope,row.id,fact,origin.caseId,origin.documentId,profile.revision,time]);
    if (result.rowCount) dirty = true;
  }

  async function overlaps(fact: FactInput, origin: SourceScope, exclude?: string) {
    const { rows } = await db.query<Row>(`SELECT * FROM zusik.v1_facts WHERE owner_session=$1 AND profile_id=$2
      AND fact->>'subjectId'=$3 AND fact->>'field'=$4 AND retired_at IS NULL AND verification<>'withdrawn'
      AND ($5::text IS NULL OR case_id IS NULL OR case_id=$5)`,[...scope,fact.subjectId,fact.field,origin.caseId]);
    return rows.filter(row => row.id !== exclude && sameKey(row.fact,fact) && overlap(row.fact,fact));
  }

  async function replace(prior: Row, fact: FactInput, source: SourceScope, preserveOutside: boolean) {
    const origin = keepCase(prior,source);
    if ((await overlaps(fact,origin,prior.id)).length) throw new MemoryError(422,"overlapping_facts");
    await retire(prior);
    const oldOrigin = { caseId:prior.case_id,documentId:prior.document_id };
    if (preserveOutside && start(prior.fact) < start(fact)) {
      await insert({ ...prior.fact, validFrom:start(prior.fact), validTo:adjacent(start(fact),-1) },oldOrigin,prior);
    }
    if (preserveOutside && end(prior.fact) > end(fact)) {
      await insert({ ...prior.fact, validFrom:adjacent(end(fact),1) },oldOrigin,prior);
    }
    await insert(fact,origin,prior);
  }

  for (const change of changes) {
    if (change.action === "add_subject") {
      const result = await db.query("INSERT INTO zusik.v1_subjects(owner_session,profile_id,id,role) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [...scope,change.subjectId,change.role]);
      if (result.rowCount) dirty = true;
    } else if (change.action === "accept_proposal" || change.action === "dismiss_proposal") {
      const { rows } = await db.query(`SELECT * FROM zusik.v1_proposals WHERE owner_session=$1 AND profile_id=$2
        AND id=$3 AND ($4::text IS NULL OR case_id IS NULL OR case_id=$4)`,[...scope,change.proposalId,caseId??null]);
      if (!rows.length) throw new MemoryError(404,"not_found");
      const p = rows[0];
      if (p.status !== "pending") throw new MemoryError(409,"proposal_closed");
      const accept = change.action === "accept_proposal";
      await db.query("UPDATE zusik.v1_proposals SET status=$4,resolved_at=$5 WHERE owner_session=$1 AND profile_id=$2 AND id=$3",
        [...scope,p.id,accept?"accepted":"dismissed",time]);
      if (accept) await replace(await previous(p.previous_id),p.fact,{caseId:p.case_id,documentId:p.document_id},true);
      dirty = true;
    } else if (change.action === "withdraw_fact") {
      const row = await previous(change.previousFactId);
      await retire(row);
      await insert(row.fact,{caseId:row.case_id,documentId:row.document_id},row,true);
    } else if ("fact" in change) {
      const fact = change.fact;
      const origin = await source(fact);
      if (change.action === "add_fact") {
        const candidates = await overlaps(fact,origin);
        if (candidates.some(row => isDeepStrictEqual(row.fact,fact))) continue;
        const matching = candidates.length === 1 && isDeepStrictEqual(candidates[0].fact.value,fact.value) &&
          start(candidates[0].fact) === start(fact) && end(candidates[0].fact) === end(fact);
        if (matching) {
          if (candidates[0].verification === "declared" && fact.source.kind !== "declaration") {
            const pending = await db.query(`SELECT 1 FROM zusik.v1_proposals WHERE owner_session=$1 AND profile_id=$2
              AND previous_id=$3 AND status='pending' LIMIT 1`,[...scope,candidates[0].id]);
            if (pending.rowCount) continue;
            await replace(candidates[0],fact,origin,false);
          }
          continue;
        }
        if (!candidates.length) await insert(fact,origin);
        else for (const row of candidates) await proposals(row,fact,origin);
      } else {
        const prior = await previous(change.previousFactId);
        if (prior.fact.subjectId !== fact.subjectId || prior.fact.field !== fact.field) throw new MemoryError(422,"fact_identity_changed");
        if (change.action === "change_from" && (!fact.validFrom || start(fact)<=start(prior.fact) || start(fact)>end(prior.fact))) {
          throw new MemoryError(422,"invalid_change_date");
        }
        if (prior.verification === "confirmed" && fact.source.kind === "declaration" && overlap(prior.fact,fact)) {
          await proposals(prior,fact,origin);
        } else {
          await replace(prior,fact,origin,change.action === "change_from");
        }
      }
    }
  }
  return dirty;
}
