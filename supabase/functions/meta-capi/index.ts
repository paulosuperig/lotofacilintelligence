import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { event_name, event_id, event_time, user_data = {}, custom_data = {}, event_source_url } = await req.json();

    // 1. Buscar configurações
    const { data: configs } = await supabase
      .from("system_configs")
      .select("key, value")
      .in("key", ["meta_pixel_id", "meta_capi_token", "meta_test_event_code"]);

    const pixelId = configs?.find(c => c.key === "meta_pixel_id")?.value?.id;
    const capiToken = configs?.find(c => c.key === "meta_capi_token")?.value?.token;
    const testCode = configs?.find(c => c.key === "meta_test_event_code")?.value?.code;

    if (!pixelId || !capiToken) {
      console.error("[CAPI] Configurações ausentes (Pixel ID ou Token)");
      return new Response(JSON.stringify({ error: "CAPI not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Preparar dados para o Meta
    // O Meta exige que alguns campos de User Data estejam presentes
    const clientIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for");
    const userAgent = req.headers.get("user-agent");

    const payload = {
      data: [{
        event_name,
        event_time: event_time || Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id,
        event_source_url,
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          ...user_data,
        },
        custom_data,
      }],
      ...(testCode ? { test_event_code: testCode } : {}),
    };

    console.log(`[CAPI] Enviando evento: ${event_name} (ID: ${event_id})`);

    // 3. Chamar API do Meta
    const metaUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`;
    const response = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Erro na API do Meta:", result);
      return new Response(JSON.stringify({ error: "Meta API error", details: result }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[CAPI] Erro interno:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
