import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Page } from "../memory/contract";
import { ApiProblem } from "./http";
import { etag } from "./etag";

export { etag } from "./etag";

export function matchRevision(request: Request, id: string) {
  const match = request.headers.get("if-match");
  if (!match) throw new ApiProblem(428, "if_match_required");
  const revision = Number(match.slice(match.lastIndexOf(".") + 1, -1));
  if (!Number.isSafeInteger(revision) || revision < 1 || match !== etag(id, revision))
    throw new ApiProblem(412, "revision_conflict");
  return revision;
}

export function canonicalHash(value: unknown) {
  const json = JSON.stringify(value, (_key, v: unknown) => {
    if (v === null || typeof v !== "object" || Array.isArray(v)) return v;
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  });
  return createHash("sha256").update(json).digest("hex");
}

export function pagination(url: URL, owner: string, secret: string, facts: boolean) {
  const extra = { validAt: z.iso.date().optional(), knownAt: z.iso.datetime({ offset: true }).optional(),
    subjectId: z.string().min(1).max(128).optional() };
  const schema = z.strictObject({ ...extra, limit: z.string().regex(/^[1-9]\d{0,2}$/)
    .transform(Number).pipe(z.int().max(100)).optional(), cursor: z.string().max(128).optional() });
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
  if ((!facts && Object.keys(extra).some(key => url.searchParams.has(key))) || !parsed.success || new Set(url.searchParams.keys()).size !== url.searchParams.size) throw new ApiProblem(400, "invalid_query");
  const { limit = 25, cursor, ...filter } = parsed.data;
  const scope = canonicalHash([owner, url.pathname, filter, limit]);
  const sign = (id: string) => createHmac("sha256", secret).update(scope + ":" + id).digest("base64url");
  let afterId: string | undefined;
  if (cursor !== undefined) {
    const [id, mac, ...rest] = cursor.split(".");
    const expected = Buffer.from(sign(id));
    const supplied = Buffer.from(mac ?? "");
    if (rest.length || !id || supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) throw new ApiProblem(400, "invalid_cursor");
    afterId = id;
  }
  return { filter, page: { limit, afterId }, result: <T>(p: Page<T>) =>
    ({ items: p.items, nextCursor: p.nextAfterId && p.nextAfterId + "." + sign(p.nextAfterId) }) };
}
