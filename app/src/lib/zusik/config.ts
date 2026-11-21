/**
 * Server-side configuration. Every value is read lazily, so `next build`
 * needs none of them. A missing variable fails the request with its name.
 */
export class ConfigError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing server configuration: ${variable}`);
    this.name = "ConfigError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ConfigError(name);
  return value;
}

export const DEFAULT_EMBED_MODEL = "intfloat/multilingual-e5-small";
export const CHECKPOINT_SCHEMA = "zusik";

/** Shorter than the route's maxDuration (30 s), see app/api/zusik/route.ts. */
export const SHERLOCK_TIMEOUT_MS = 8_000;
export const QDRANT_TIMEOUT_MS = 5_000;
/** Lease outlives the longest possible invocation (maxDuration 30 s). */
export const LEASE_SECONDS = 90;
