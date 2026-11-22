import type { PoolClient } from "pg";
import { ApiProblem } from "./http";
import { canonicalHash } from "./guards";

export type SavedResponse = { body: unknown; status: number; headers?: Record<string,string> };
export type WriteResult = { profileId: string; caseId?: string; response: SavedResponse };

export async function replayable(db: PoolClient, owner: string, req: Request, input: unknown, write: () => Promise<WriteResult>) {
  const key = req.headers.get("idempotency-key") || "";
  if (key.length < 8 || key.length > 128) throw new ApiProblem(400, "idempotency_key_required");
  const scope = canonicalHash([req.method, new URL(req.url).pathname, key]);
  const fingerprint = canonicalHash([input, req.headers.get("if-match")]);
  await db.query("DELETE FROM zusik.v1_requests WHERE owner_session=$1 AND expires_at <= now()", [owner]);
  const added = await db.query(`INSERT INTO zusik.v1_requests(owner_session,key_hash,fingerprint)
    VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING 1`, [owner,scope,fingerprint]);
  if (!added.rowCount) {
    const { rows } = await db.query(`SELECT k.fingerprint,r.response FROM zusik.v1_requests k
      LEFT JOIN zusik.v1_responses r USING(owner_session,key_hash)
      WHERE k.owner_session=$1 AND k.key_hash=$2`, [owner,scope]);
    const previous = rows[0];
    if (!previous?.response) throw new ApiProblem(404, "not_found");
    if (previous.fingerprint !== fingerprint) throw new ApiProblem(409, "idempotency_conflict");
    return previous.response as SavedResponse;
  }
  const { response, profileId, caseId } = await write();
  await db.query(`INSERT INTO zusik.v1_responses(owner_session,key_hash,profile_id,case_id,response)
    VALUES ($1,$2,$3,$4,$5)`, [owner,scope,profileId,caseId ?? null,response]);
  return response;
}
