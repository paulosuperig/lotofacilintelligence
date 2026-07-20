import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCorsHeaders,
  clientIpFrom,
  forbiddenOrigin,
  internalError,
  isOriginAllowed,
  normalizeUserDataForMeta,
  rateLimit,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);
    return new Response("ok", { headers: cors });
  }

  if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);

  // Rate limit per IP: 60 req / 60s
  const ip = clientIpFrom(req);
  const rl = rateLimit(`capi:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "RATE_LIMITED" }), {
      status: 429,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Retry-After": String(rl.retryAfterSec),
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      event_name,
      event_id,
      event_time,
      user_data = {},
      custom_data = {},
      event_source_url,
    } = await req.json();

    const { data: configs } = await supabase
      .from("system_configs")
      .select("key, value")
      .in("key", ["meta_pixel_id", "meta_capi_token", "meta_test_event_code"]);

    const pixelId = configs?.find((c) => c.key === "meta_pixel_id")?.value?.id;
    const capiToken = configs?.find((c) => c.key === "meta_capi_token")?.value?.token;
    const testCode = configs?.find((c) => c.key === "meta_test_event_code")?.value?.code;

    if (!pixelId || !capiToken) {
      console.error("[CAPI] Configurações ausentes (Pixel ID ou Token)");
      return new Response(JSON.stringify({ error: "CAPI_NOT_CONFIGURED" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userAgent = req.headers.get("user-agent");
    const hashedUserData = await normalizeUserDataForMeta(user_data);

    const payload = {
      data: [{
        event_name,
        event_time: event_time || Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id,
        event_source_url,
        user_data: {
          client_ip_address: ip,
          client_user_agent: userAgent,
          ...hashedUserData,
        },
        custom_data,
      }],
      ...(testCode ? { test_event_code: testCode } : {}),
    };

    console.log(`[CAPI] Enviando evento: ${event_name} (ID: ${event_id})`);

    const metaUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`;
    const response = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Erro na API do Meta:", result);
      return new Response(JSON.stringify({ error: "META_API_ERROR" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CAPI] Erro interno:", error);
    return internalError(origin);
  }
});
