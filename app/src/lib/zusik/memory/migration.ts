import type { Pool } from "pg";

// Kept in the private zusik schema. The demo cookie is not a Supabase JWT.
export async function migrateMemory(pool: Pool, runtimeRole: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(runtimeRole)) throw new Error("invalid_runtime_role");
  const tables = ["profiles", "cases", "subjects", "documents", "facts", "proposals", "account_links"];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(169881233)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS zusik.v1_profiles (
        owner_session text NOT NULL, id text NOT NULL DEFAULT gen_random_uuid()::text,
        mode text NOT NULL CHECK (mode IN ('family','case_import')), revision integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '7 days'),
        PRIMARY KEY(owner_session,id)
      );
      CREATE INDEX IF NOT EXISTS v1_profiles_expiry ON zusik.v1_profiles(expires_at);
      CREATE TABLE IF NOT EXISTS zusik.v1_cases (
        owner_session text NOT NULL, profile_id text NOT NULL, id text NOT NULL DEFAULT gen_random_uuid()::text,
        revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY(owner_session,profile_id,id), UNIQUE(owner_session,id),
        FOREIGN KEY(owner_session,profile_id) REFERENCES zusik.v1_profiles ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS zusik.v1_subjects (
        owner_session text NOT NULL, profile_id text NOT NULL, id text NOT NULL,
        role text NOT NULL CHECK (role IN ('parent','child','other')),
        PRIMARY KEY(owner_session,profile_id,id,role),
        FOREIGN KEY(owner_session,profile_id) REFERENCES zusik.v1_profiles ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS zusik.v1_account_links (
        owner_session text NOT NULL, profile_id text NOT NULL, case_id text NOT NULL, subject_id text NOT NULL,
        scenario text NOT NULL CHECK (scenario IN ('employment-transition','business-settlement','unavailable')),
        PRIMARY KEY(owner_session,profile_id,case_id,subject_id),
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS zusik.v1_documents (
        owner_session text NOT NULL, profile_id text NOT NULL, case_id text NOT NULL,
        id text NOT NULL DEFAULT gen_random_uuid()::text, client_id text NOT NULL, metadata jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY(owner_session,profile_id,case_id,id), UNIQUE(owner_session,id),
        UNIQUE(owner_session,profile_id,case_id,client_id),
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS zusik.v1_facts (
        owner_session text NOT NULL, profile_id text NOT NULL, case_id text, document_id text,
        id text NOT NULL DEFAULT gen_random_uuid()::text, fact jsonb NOT NULL, version integer NOT NULL,
        verification text NOT NULL CHECK (verification IN ('declared','confirmed','withdrawn','disputed')),
        supersedes text, created_at timestamptz NOT NULL, retired_at timestamptz,
        PRIMARY KEY(owner_session,profile_id,id),
        FOREIGN KEY(owner_session,profile_id) REFERENCES zusik.v1_profiles ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id,case_id,document_id) REFERENCES zusik.v1_documents ON DELETE CASCADE,
        CHECK (document_id IS NULL OR case_id IS NOT NULL)
      );
      CREATE INDEX IF NOT EXISTS v1_facts_by_subject ON zusik.v1_facts(owner_session,profile_id,(fact->>'subjectId'),created_at,id);
      CREATE TABLE IF NOT EXISTS zusik.v1_proposals (
        owner_session text NOT NULL, profile_id text NOT NULL, case_id text, document_id text,
        id text NOT NULL DEFAULT gen_random_uuid()::text, fact jsonb NOT NULL, previous_id text NOT NULL,
        basis_revision integer NOT NULL, reason_code text NOT NULL, status text NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','accepted','dismissed','obsolete')),
        created_at timestamptz NOT NULL, resolved_at timestamptz,
        PRIMARY KEY(owner_session,profile_id,id),
        FOREIGN KEY(owner_session,profile_id,previous_id) REFERENCES zusik.v1_facts ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id,case_id) REFERENCES zusik.v1_cases ON DELETE CASCADE,
        FOREIGN KEY(owner_session,profile_id,case_id,document_id) REFERENCES zusik.v1_documents ON DELETE CASCADE
      );
    `);
    for (const suffix of tables) {
      const table = `zusik.v1_${suffix}`;
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      for (const operation of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const policy = `memory_${operation.toLowerCase()}`;
        const owner = "owner_session = nullif(current_setting('zusik.owner_session',true),'')";
        const using = operation === "INSERT" ? "" : `USING (${owner})`;
        const check = ["UPDATE","INSERT"].includes(operation) ? `WITH CHECK (${owner})` : "";
        await client.query(`DROP POLICY IF EXISTS ${policy} ON ${table}`);
        await client.query(`CREATE POLICY ${policy} ON ${table} FOR ${operation} TO "${runtimeRole}" ${using} ${check}`);
      }
      await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ${table} TO "${runtimeRole}"`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
