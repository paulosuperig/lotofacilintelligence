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
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, max_tokens, model: requestedModel } = await req.json();

    // Use external DeepSeek API as requested by user
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    // Default model if none provided
    const model = requestedModel || 'deepseek-chat';

    let response;
    
    if (DEEPSEEK_API_KEY) {
      // Direct call to DeepSeek API
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
      // Fallback to Lovable AI Gateway with deepseek/deepseek-chat
      // Note: User mentioned using external API, so we should ensure DEEPSEEK_API_KEY is set.
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'AI_SERVICE_UNAVAILABLE', fallback: true, message: 'API Keys não configuradas' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: `deepseek/${model}`,
          messages,
          max_tokens: max_tokens || 2048,
          temperature: 0.2,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'RATE_LIMITED', fallback: true, message: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'CREDITS_EXHAUSTED', fallback: true, message: 'Créditos da workspace esgotados. Adicione créditos em Settings → Workspace → Usage.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI_SERVICE_UNAVAILABLE', fallback: true, message: `AI Gateway error ${response.status}: ${errorText.slice(0, 200)}` }),
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
      JSON.stringify({ error: 'EDGE_FUNCTION_FAILED', fallback: true, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
