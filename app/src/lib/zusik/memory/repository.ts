import type { Pool, PoolClient, QueryResultRow } from "pg";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { MemoryError, docInput, profileInput, profilePatch, type CaseDocument, type CaseFile,
  type DocInput, type EvidenceFact, type FactFilter, type MemoryRepository, type Page,
  type PageInput, type Patch, type Profile, type ProfileInput, type Proposal } from "./contract";
import { applyChanges } from "./versions";

const profileColumns = `id,mode,revision,ARRAY(
  SELECT DISTINCT s.id FROM zusik.v1_subjects s WHERE s.owner_session=t.owner_session AND s.profile_id=t.id ORDER BY s.id
) AS subjects`;
const caseColumns = 'id,profile_id AS "profileId",revision,to_char(created_at AT TIME ZONE \'UTC\',\'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"\') AS "createdAt"';
const factColumns = `id AS "factId",version,fact,
  CASE WHEN EXISTS(SELECT 1 FROM zusik.v1_proposals p WHERE p.owner_session=t.owner_session AND p.profile_id=t.profile_id
    AND p.previous_id=t.id AND p.created_at<=coalesce($3::timestamptz,'infinity'::timestamptz)
    AND (p.resolved_at IS NULL OR p.resolved_at>$3::timestamptz)
    AND ($6::text IS NULL OR p.case_id IS NULL OR p.case_id=$6)) THEN 'disputed' ELSE verification END AS verification,
  to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt",
  supersedes`;

function existing<T>(row: T | undefined): T {
  if (!row) throw new MemoryError(404, "not_found");
  return row;
}

function expectRevision(actual: number, expected: number) {
  if (actual !== expected) throw new MemoryError(412, "stale_revision", actual);
}

export async function withMemoryTransaction<T>(pool: Pool, owner: string,
  run: (repo: MemoryRepository, client: PoolClient) => Promise<T>,
  timeouts?: {lockMs: number; idleMs: number}): Promise<T> {
  if (!owner) throw new Error("verified_owner_required");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (timeouts) {
      await client.query("SELECT set_config('lock_timeout',$1,true), set_config('idle_in_transaction_session_timeout',$2,true)",
        [String(timeouts.lockMs), String(timeouts.idleMs)]);
    }
    await client.query("SELECT set_config('zusik.owner_session',$1,true)", [owner]);
    await client.query("DELETE FROM zusik.v1_profiles WHERE owner_session=$1 AND expires_at<=now()", [owner]);
    const result = await run(new Repository(client, owner), client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

class Repository implements MemoryRepository {
  constructor(private db: PoolClient, private owner: string) {}

  // Cursor resolution uses the same authorization and filters as the page itself.
  private async page<T extends QueryResultRow>(table: string, columns: string, condition: string,
    filters: unknown[], page: PageInput = {}): Promise<Page<T>> {
    const limit = page.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new MemoryError(400, "invalid_limit");
    const args = [this.owner, ...filters];
    if (page.afterId) {
      args.push(page.afterId);
      const anchor = `SELECT t.created_at,t.id FROM zusik.v1_${table} t WHERE t.owner_session=$1 ${condition} AND t.id=$${args.length}`;
      const found = await this.db.query(anchor, args);
      if (!found.rowCount) throw new MemoryError(400, "invalid_cursor");
      condition += ` AND (t.created_at,t.id)>(${anchor})`;
    }
    args.push(limit + 1);
    const { rows } = await this.db.query<T>(`SELECT ${columns}
      FROM zusik.v1_${table} t WHERE t.owner_session=$1 ${condition}
      ORDER BY t.created_at,t.id LIMIT $${args.length}`, args);
    const nextAfterId = rows.length > limit ? (rows[limit - 1].id ?? rows[limit - 1].factId) as string : null;
    return { items: rows.slice(0,limit), nextAfterId };
  }

  async createProfile(input: ProfileInput) {
    const { mode } = profileInput.parse(input);
    const { rows } = await this.db.query<Profile>("INSERT INTO zusik.v1_profiles(owner_session,mode) VALUES($1,$2) RETURNING id,mode,revision,ARRAY[]::text[] AS subjects", [this.owner,mode]);
    return rows[0];
  }

  async getProfile(id: string, lock = false) {
    const { rows } = await this.db.query<Profile>(`SELECT ${profileColumns} FROM zusik.v1_profiles t
      WHERE owner_session=$1 AND id=$2 AND expires_at>now() ${lock ? "FOR UPDATE" : ""}`, [this.owner,id]);
    return existing(rows[0]);
  }

  listProfiles(page?: PageInput) {
    return this.page<Profile>("profiles",profileColumns,"AND expires_at>now()",[],page);
  }

  async patchProfile(id: string, expected: number, patch: Patch, caseId?: string) {
    const profile = await this.getProfile(id,true);
    expectRevision(profile.revision,expected);
    if (caseId && (await this.getCase(caseId)).profileId !== id) throw new MemoryError(404,"not_found");
    const { changes } = profilePatch.parse(patch);
    if (await applyChanges(this.db,this.owner,profile,changes,caseId)) {
      await this.db.query("UPDATE zusik.v1_profiles SET revision=revision+1 WHERE owner_session=$1 AND id=$2",[this.owner,id]);
    }
    return this.getProfile(id);
  }

  async deleteProfile(id: string, expected: number) {
    expectRevision((await this.getProfile(id,true)).revision,expected);
    await this.db.query("DELETE FROM zusik.v1_profiles WHERE owner_session=$1 AND id=$2",[this.owner,id]);
  }

  async listFacts(id: string, filter: FactFilter = {}, page?: PageInput) {
    await this.getProfile(id);
    if (filter.caseId && (await this.getCase(filter.caseId)).profileId !== id) throw new MemoryError(404,"not_found");
    if ((filter.validAt && !z.iso.date().safeParse(filter.validAt).success) ||
        (filter.knownAt && !z.iso.datetime({offset:true}).safeParse(filter.knownAt).success)) throw new MemoryError(400,"invalid_date");
    const result = await this.page<EvidenceFact>("facts",factColumns,`AND profile_id=$2
      AND t.created_at <= coalesce($3::timestamptz,'infinity'::timestamptz)
      AND (t.retired_at IS NULL OR t.retired_at > $3::timestamptz)
      AND verification <> 'withdrawn' AND ($4::text IS NULL OR
        (coalesce(fact->>'validFrom',fact->>'asOf') <= $4 AND coalesce(fact->>'validTo',
          CASE WHEN fact->>'validFrom' IS NULL THEN fact->>'asOf' END,'9999-12-31') >= $4))
      AND ($5::text IS NULL OR fact->>'subjectId'=$5) AND ($6::text IS NULL OR case_id IS NULL OR case_id=$6)`,
      [id,filter.knownAt??null,filter.validAt??null,filter.subjectId??null,filter.caseId??null],page);
    for (const item of result.items) if (!item.supersedes) delete item.supersedes;
    return result;
  }

  async listProposals(id: string, page?: PageInput) {
    await this.getProfile(id);
    return this.page<Proposal>("proposals",'id,fact,basis_revision AS "basisRevision",reason_code AS "reasonCode",status',
      "AND profile_id=$2",[id],page);
  }

  async createCase(profileId: string) {
    await this.getProfile(profileId,true);
    const { rows } = await this.db.query(`INSERT INTO zusik.v1_cases(owner_session,profile_id) VALUES($1,$2) RETURNING id`, [this.owner,profileId]);
    return this.getCase(rows[0].id);
  }

  async getCase(id: string, lock = false) {
    const { rows } = await this.db.query<CaseFile>(`SELECT ${caseColumns} FROM zusik.v1_cases t WHERE owner_session=$1 AND id=$2
      AND EXISTS (SELECT 1 FROM zusik.v1_profiles p WHERE p.owner_session=t.owner_session AND p.id=t.profile_id AND p.expires_at>now())
      ${lock ? "FOR UPDATE OF t" : ""}`, [this.owner,id]);
    return existing(rows[0]);
  }

  listCases(page?: PageInput) {
    return this.page<CaseFile>("cases",caseColumns,`AND EXISTS (SELECT 1 FROM zusik.v1_profiles p
      WHERE p.owner_session=t.owner_session AND p.id=t.profile_id AND p.expires_at>now())`,[],page);
  }

  async deleteCase(id: string, expected: number) {
    const { profileId } = await this.getCase(id);
    await this.getProfile(profileId,true);
    expectRevision((await this.getCase(id,true)).revision,expected);
    const affected = await this.db.query(`SELECT 1 FROM zusik.v1_facts WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3
      UNION ALL SELECT 1 FROM zusik.v1_proposals WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 LIMIT 1`,[this.owner,profileId,id]);
    await this.db.query("DELETE FROM zusik.v1_cases WHERE owner_session=$1 AND profile_id=$2 AND id=$3",[this.owner,profileId,id]);
    if (affected.rowCount) await this.db.query("UPDATE zusik.v1_profiles SET revision=revision+1 WHERE owner_session=$1 AND id=$2",[this.owner,profileId]);
  }

  async registerDocument(caseId: string, input: DocInput) {
    const metadata = docInput.parse(input);
    const { profileId } = await this.getCase(caseId,true);
    const args = [this.owner,profileId,caseId,metadata.clientDocumentId];
    const prior = await this.db.query<CaseDocument>(`SELECT id,metadata FROM zusik.v1_documents
      WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND client_id=$4`,args);
    if (prior.rowCount) {
      const previous = prior.rows[0];
      if (!isDeepStrictEqual(previous.metadata, metadata)) throw new MemoryError(409,"document_metadata_changed");
      return previous;
    }
    const { rows } = await this.db.query<CaseDocument>(`INSERT INTO zusik.v1_documents(owner_session,profile_id,case_id,client_id,metadata)
      VALUES($1,$2,$3,$4,$5) RETURNING id,metadata`,[...args,metadata]);
    await this.db.query("UPDATE zusik.v1_cases SET revision=revision+1 WHERE owner_session=$1 AND profile_id=$2 AND id=$3",args.slice(0,3));
    return rows[0];
  }

  async getDocument(caseId: string, id: string) {
    const { profileId } = await this.getCase(caseId);
    const { rows } = await this.db.query<CaseDocument>("SELECT id,metadata FROM zusik.v1_documents WHERE owner_session=$1 AND profile_id=$2 AND case_id=$3 AND id=$4",[this.owner,profileId,caseId,id]);
    return existing(rows[0]);
  }

  async listDocuments(caseId: string, page?: PageInput) {
    const { profileId } = await this.getCase(caseId);
    return this.page<CaseDocument>("documents","id,metadata","AND profile_id=$2 AND case_id=$3",[profileId,caseId],page);
  }
}
