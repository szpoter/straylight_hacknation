import type { Pool } from "pg";

/** Run after migrateMemory, with the private schema owner. */
export async function migrateConversation(pool: Pool, runtimeRole: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(runtimeRole)) throw new Error("invalid_runtime_role");
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(169881234)");
    await db.query(`
      CREATE TABLE IF NOT EXISTS zusik.v1_turns (
        owner_session text NOT NULL, profile_id text NOT NULL, case_id text NOT NULL,
        id text NOT NULL, kind text NOT NULL CHECK (kind IN ('message','assessment')), body jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY(owner_session,case_id,id),
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS v1_turns_order ON zusik.v1_turns(owner_session,case_id,kind,created_at,id);
      CREATE TABLE IF NOT EXISTS zusik.v1_requests (
        owner_session text NOT NULL, key_hash text NOT NULL, fingerprint text NOT NULL,
        expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
        PRIMARY KEY(owner_session,key_hash)
      );
      CREATE INDEX IF NOT EXISTS v1_requests_expiry ON zusik.v1_requests(owner_session,expires_at);
      CREATE TABLE IF NOT EXISTS zusik.v1_responses (
        owner_session text NOT NULL, key_hash text NOT NULL, profile_id text NOT NULL, case_id text,
        response jsonb NOT NULL, PRIMARY KEY(owner_session,key_hash),
        FOREIGN KEY(owner_session,key_hash) REFERENCES zusik.v1_requests ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id) REFERENCES zusik.v1_profiles ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE
      )`);
    for (const table of ["v1_turns", "v1_requests", "v1_responses"]) {
      await db.query(`ALTER TABLE zusik.${table} ENABLE ROW LEVEL SECURITY`);
      const owner = "owner_session = nullif(current_setting('zusik.owner_session',true),'')";
      for (const op of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const policy = "rest_" + op.toLowerCase();
        await db.query(`DROP POLICY IF EXISTS ${policy} ON zusik.${table}`);
        await db.query(`CREATE POLICY ${policy} ON zusik.${table} FOR ${op} TO "${runtimeRole}"
          ${op === "INSERT" ? "" : "USING (" + owner + ")"} ${["INSERT","UPDATE"].includes(op) ? "WITH CHECK (" + owner + ")" : ""}`);
      }
      await db.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON zusik.${table} TO "${runtimeRole}"`);
    }
    await db.query("COMMIT");
  } catch (error) { await db.query("ROLLBACK"); throw error; }
  finally { db.release(); }
}
