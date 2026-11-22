import type { Pool } from "pg";

// Run as the migration owner so expired profiles are purged even after the demo cookie expires.
export async function purgeExpiredProfiles(pool: Pool): Promise<number> {
  // The replay ledger is added by the separate REST migration and outlives deleted resources.
  await pool.query(`DO $purge$
    BEGIN
      IF to_regclass('zusik.v1_requests') IS NOT NULL THEN
        DELETE FROM zusik.v1_requests WHERE expires_at <= statement_timestamp();
      END IF;
    END $purge$`);
  const { rowCount } = await pool.query("DELETE FROM zusik.v1_profiles WHERE expires_at <= statement_timestamp()");
  return rowCount ?? 0;
}
