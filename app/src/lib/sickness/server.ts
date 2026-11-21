import { PgCaseStore } from "../zusik/case-store";
import { runtime } from "../zusik/server";
import { retrieveSicknessLaw } from "./law";
import { SicknessService } from "./service";

export function sicknessService() {
  const { pool, checkpointer } = runtime();
  return new SicknessService(new PgCaseStore(pool), checkpointer, retrieveSicknessLaw);
}
