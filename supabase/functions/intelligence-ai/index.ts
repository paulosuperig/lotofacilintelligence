import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, max_tokens, model: requestedModel } = await req.json();

    // Source of truth para a chave DeepSeek = system_configs (Supabase).
    // Fallback: env var. Nunca aceitar chave vinda do cliente.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cfg } = await adminClient
      .from('system_configs')
      .select('value')
      .eq('key', 'deepseek_api_key')
      .maybeSingle();

    const DEEPSEEK_API_KEY =
      (cfg?.value as any)?.key ||
      (typeof cfg?.value === 'string' ? cfg.value : null) ||
      Deno.env.get('DEEPSEEK_API_KEY');

    const model = requestedModel || 'deepseek-chat';

    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI_SERVICE_UNAVAILABLE',
          fallback: true,
          message: 'Chave da API DeepSeek não configurada. Configure no Painel Admin.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: max_tokens || 2048,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek error:', response.status, errorText);

      const errorMap: Record<number, { error: string; message: string }> = {
        401: { error: 'INVALID_API_KEY', message: 'Chave da API DeepSeek inválida ou expirada.' },
        429: { error: 'RATE_LIMITED', message: 'Limite de requisições atingido na DeepSeek.' },
        402: { error: 'INSUFFICIENT_CREDITS', message: 'Créditos insuficientes na conta DeepSeek.' },
      };
      const mapped = errorMap[response.status] || {
        error: 'AI_SERVICE_UNAVAILABLE',
        message: `Erro no serviço de IA (${response.status})`,
      };

      return new Response(
        JSON.stringify({ ...mapped, fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'EDGE_FUNCTION_FAILED',
        fallback: true,
        message: error instanceof Error ? error.message : 'Erro inesperado',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
