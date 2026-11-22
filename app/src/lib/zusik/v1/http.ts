import { randomUUID } from "node:crypto";
import { z } from "zod";

const headers = { "Cache-Control": "private, no-store" };

export class ApiProblem extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

export function problem(error: unknown) {
  const { status, code } = error instanceof ApiProblem ? error :
    error instanceof z.ZodError ? new ApiProblem(422, "invalid_input") : new ApiProblem(503, "service_unavailable");
  return Response.json({ type: "about:blank", title: code, status, code, requestId: randomUUID() }, {
    status, headers: { ...headers, "Content-Type": "application/problem+json", ...(status === 429 ? { "Retry-After": code === "public_request_busy" ? "2" : "60" } : {}) },
  });
}

export function requireOrigin(request: Request) {
  const expected = process.env.ZUSIK_APP_ORIGIN || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  const origin = request.headers.get("origin");
  if (!origin || (origin !== (expected || new URL(request.url).origin) &&
      !(process.env.VERCEL_BRANCH_URL && origin === `https://${process.env.VERCEL_BRANCH_URL}`))) {
    throw new ApiProblem(403, "forbidden_origin");
  }
}

export async function readJson(request: Request) {
  const limit = 64 * 1024;
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    throw new ApiProblem(415, "json_required");
  if (Number(request.headers.get("content-length")) > limit) throw new ApiProblem(413, "body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiProblem(400, "invalid_json");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new ApiProblem(413, "body_too_large");
    }
    chunks.push(value);
  }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) as unknown; }
  catch { throw new ApiProblem(400, "invalid_json"); }
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...headers, ...extra } });
}
