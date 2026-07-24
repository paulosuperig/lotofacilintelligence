import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCorsHeaders,
  forbiddenOrigin,
  internalError,
  isOriginAllowed,
} from "../_shared/security.ts";

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

    const { messages, max_tokens, model: requestedModel } = await req.json();

    // Validação de entrada: evita repassar payloads malformados/abusivos ao upstream.
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "INVALID_REQUEST", message: "Requisição inválida: 'messages' ausente." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cfg } = await adminClient
      .from("system_configs")
      .select("value")
      .eq("key", "deepseek_api_key")
      .maybeSingle();

    const DEEPSEEK_API_KEY =
      (cfg?.value as any)?.key ||
      (typeof cfg?.value === "string" ? cfg.value : null) ||
      Deno.env.get("DEEPSEEK_API_KEY");

    // DeepSeek depreciou "deepseek-chat" — aceita apenas deepseek-v4-pro | deepseek-v4-flash.
    const ALLOWED_MODELS = new Set(["deepseek-v4-pro", "deepseek-v4-flash"]);
    const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : "deepseek-v4-pro";

    // Filtra mensagens inválidas (content vazio/nulo ou papel desconhecido) que o upstream rejeita.
    const validRoles = new Set(["system", "user", "assistant"]);
    const cleanMessages = messages.filter(
      (m: { role?: string; content?: string }) =>
        m && validRoles.has(m.role ?? "") && typeof m.content === "string" && m.content.trim().length > 0,
    );
    if (cleanMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "INVALID_REQUEST", message: "Nenhuma mensagem válida para enviar à IA." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

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

    // Timeout defensivo: sem isto, um upstream travado penduraria a função até
    // o limite de plataforma. 55s deixa margem para responder antes disso.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    let response: Response;
    try {
      response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: cleanMessages,
          max_tokens: Math.min(max_tokens || 2048, 4096),
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = (err as Error)?.name === "AbortError";
      console.error("DeepSeek fetch failed:", aborted ? "timeout" : err);
      return new Response(
        JSON.stringify({
          error: aborted ? "AI_TIMEOUT" : "AI_SERVICE_UNAVAILABLE",
          fallback: true,
          message: aborted
            ? "A IA demorou demais para responder. Tente novamente em instantes."
            : "Falha ao contactar o serviço de IA. Tente novamente.",
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek error:", response.status, errorText);

      const errorMap: Record<number, { error: string; message: string }> = {
        400: { error: "BAD_REQUEST", message: "Requisição inválida ao provedor de IA — parâmetros ajustados." },
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
