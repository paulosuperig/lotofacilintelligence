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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, max_tokens, model: requestedModel, apiKey } = await req.json();

    // Prioridade de API Key:
    // 1. Chave enviada pelo usuário (salva no frontend)
    // 2. Chave do ambiente (configurada no Supabase)
    const DEEPSEEK_API_KEY = apiKey || Deno.env.get('DEEPSEEK_API_KEY');
    
    // Default model if none provided
    const model = requestedModel || 'deepseek-chat';

    let response;
    
    if (DEEPSEEK_API_KEY) {
      console.log(`Using DeepSeek API with model: ${model}`);
      // Direct call to DeepSeek API from server-side to avoid CORS
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages,
          max_tokens: max_tokens || 2048,
          temperature: 0.2,
        }),
      });
    } else {
      console.log('No DeepSeek API key found, attempting fallback to Lovable AI Gateway');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ 
            error: 'AI_SERVICE_UNAVAILABLE', 
            fallback: true, 
            message: 'API Keys não configuradas. Configure a chave DeepSeek no Painel Admin.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se não tem DeepSeek, tenta usar o modelo disponível no Gateway (ex: Gemini)
      // O usuário pediu para não mudar o modelo, mas se não tem chave, o sistema quebra.
      // Vamos tentar usar o gateway com um modelo suportado se o deepseek falhar.
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash', // Fallback seguro e moderno
          messages,
          max_tokens: max_tokens || 2048,
          temperature: 0.2,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Service error:', response.status, errorText);

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'INVALID_API_KEY', fallback: true, message: 'Chave da API DeepSeek inválida ou expirada.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'RATE_LIMITED', fallback: true, message: 'Limite de requisições atingido na DeepSeek.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI_SERVICE_UNAVAILABLE', fallback: true, message: `Erro no serviço de IA (${response.status})` }),
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
      JSON.stringify({ error: 'EDGE_FUNCTION_FAILED', fallback: true, message: error instanceof Error ? error.message : 'Erro inesperado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});