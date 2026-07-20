import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCorsHeaders,
  forbiddenOrigin,
  internalError,
  isOriginAllowed,
  rateLimit,
} from "../_shared/security.ts";

const ALLOWED_MODELS = new Set(["deepseek-chat", "deepseek-reasoner"]);
const MAX_MESSAGES = 40;
const MAX_TOKENS_CAP = 4096;
const MAX_CONTENT_LEN = 12_000;

type ChatMessage = { role: string; content: string };

function validatePayload(body: unknown):
  | { ok: true; messages: ChatMessage[]; maxTokens: number; model: string }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array" };
  }
  if (b.messages.length > MAX_MESSAGES) {
    return { ok: false, error: `messages exceeds max of ${MAX_MESSAGES}` };
  }
  const messages: ChatMessage[] = [];
  for (const m of b.messages) {
    if (!m || typeof m !== "object") return { ok: false, error: "invalid message entry" };
    const mm = m as Record<string, unknown>;
    if (typeof mm.role !== "string" || !["system", "user", "assistant"].includes(mm.role)) {
      return { ok: false, error: "invalid message role" };
    }
    if (typeof mm.content !== "string" || mm.content.length === 0) {
      return { ok: false, error: "invalid message content" };
    }
    if (mm.content.length > MAX_CONTENT_LEN) {
      return { ok: false, error: "message content too long" };
    }
    messages.push({ role: mm.role, content: mm.content });
  }

  const maxTokens = Math.min(
    Math.max(Number(b.max_tokens) || 2048, 1),
    MAX_TOKENS_CAP,
  );

  const model = typeof b.model === "string" && ALLOWED_MODELS.has(b.model)
    ? b.model
    : "deepseek-chat";

  return { ok: true, messages, maxTokens, model };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);
    return new Response("ok", { headers: cors });
  }

  if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Rate limit por usuário autenticado: 20 req / 60s (protege custo da API).
    const rl = rateLimit(`ai:${user.id}`, 20, 60_000);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "RATE_LIMITED", fallback: true, message: "Muitas requisições. Aguarde alguns segundos." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const parsed = validatePayload(await req.json());
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: "INVALID_PAYLOAD", message: parsed.error }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const { messages, maxTokens, model } = parsed;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cfg } = await adminClient
      .from("system_configs")
      .select("value")
      .eq("key", "deepseek_api_key")
      .maybeSingle();

    const cfgValue = cfg?.value as { key?: string } | string | null | undefined;
    const DEEPSEEK_API_KEY =
      (typeof cfgValue === "object" && cfgValue?.key) ||
      (typeof cfgValue === "string" ? cfgValue : null) ||
      Deno.env.get("DEEPSEEK_API_KEY");

    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "AI_SERVICE_UNAVAILABLE",
          fallback: true,
          message: "Chave da API DeepSeek não configurada. Configure no Painel Admin.",
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek error:", response.status, errorText);

      const errorMap: Record<number, { error: string; message: string }> = {
        401: { error: "INVALID_API_KEY", message: "Chave da API DeepSeek inválida ou expirada." },
        429: { error: "RATE_LIMITED", message: "Limite de requisições atingido na DeepSeek." },
        402: { error: "INSUFFICIENT_CREDITS", message: "Créditos insuficientes na conta DeepSeek." },
      };
      const mapped = errorMap[response.status] || {
        error: "AI_SERVICE_UNAVAILABLE",
        message: `Erro no serviço de IA (${response.status})`,
      };

      return new Response(
        JSON.stringify({ ...mapped, fallback: true }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("intelligence-ai unexpected error:", error);
    return internalError(origin);
  }
});
