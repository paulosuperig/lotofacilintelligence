// Shared security helpers for edge functions.
// - Origin allowlist + reflective CORS
// - PII hashing (SHA-256 hex lowercase) for Meta CAPI
// - Generic error responder to avoid leaking internals

const ALLOWED_EXACT = new Set<string>([
  "https://lotofacilintelligence.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
]);

// Preview/deploy hosts used by Lovable and Vercel. Auth/JWT still gates protected APIs.
const ALLOWED_SUFFIX = [".lovable.app", ".lovableproject.com", ".vercel.app"];

function getConfiguredOrigins(): string[] {
  return (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_EXACT.has(origin)) return true;
  if (getConfiguredOrigins().includes(origin)) return true;
  try {
    const u = new URL(origin);
    const host = u.hostname;
    return ALLOWED_SUFFIX.some((s) => host === s.slice(1) || host.endsWith(s));
  } catch {
    return false;
  }
}

export function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/** 403 response when Origin is not allowed. */
export function forbiddenOrigin(origin: string | null): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN_ORIGIN" }), {
    status: 403,
    headers: { ...buildCorsHeaders(origin), "Content-Type": "application/json" },
  });
}

/** Generic error responder — never leaks internal error messages. */
export function internalError(origin: string | null, status = 500): Response {
  return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
    status,
    headers: { ...buildCorsHeaders(origin), "Content-Type": "application/json" },
  });
}

const HEX64 = /^[a-f0-9]{64}$/i;

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash value only if not already a 64-char hex digest. */
export async function maybeHash(value: unknown): Promise<string | undefined> {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  if (HEX64.test(s)) return s.toLowerCase();
  return await sha256Hex(s);
}

/** Hash the PII fields Meta expects hashed. Arrays supported. */
export async function normalizeUserDataForMeta(
  user_data: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...user_data };
  const piiKeys = ["em", "ph", "fn", "ln", "ge", "db", "ct", "st", "zp", "country"];
  for (const k of piiKeys) {
    const v = out[k];
    if (v == null) continue;
    if (Array.isArray(v)) {
      out[k] = (await Promise.all(v.map((x) => maybeHash(x)))).filter(Boolean);
    } else {
      const h = await maybeHash(v);
      if (h) out[k] = h;
      else delete out[k];
    }
  }
  return out;
}

// --- In-memory rate limiting (per isolate) ---
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count++;
  if (b.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIpFrom(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}
