import type { Pool } from "pg";

// Run as the migration owner so expired profiles are purged even after the demo cookie expires.
export async function purgeExpiredProfiles(pool: Pool): Promise<number> {
  const { rowCount } = await pool.query("DELETE FROM zusik.v1_profiles WHERE expires_at <= statement_timestamp()");
  return rowCount ?? 0;
}
