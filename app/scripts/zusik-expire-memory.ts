import { Pool } from "pg";
import { purgeExpiredProfiles } from "../src/lib/zusik/memory/retention";

async function main() {
  const url = process.env.MIGRATION_DATABASE_URL?.trim();
  if (!url || process.env.VERCEL_ENV === "production") throw new Error("preview_database_required");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    console.log(`Expired memory profiles removed: ${await purgeExpiredProfiles(pool)}`);
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error("Memory retention failed. Verify the Preview migration connection.");
  process.exitCode = 1;
});
