import { supabase } from "@/lib/supabase";

/** Mensagem no formato do gateway de chat (papéis system/user/assistant). */
export type AiGatewayMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Resposta da Edge Function `intelligence-ai` (sucesso ou erro mapeado). */
interface AiGatewayResponse {
  error?: string;
  message?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

/** Erro do `functions.invoke`; o supabase-js embute a Response em `context`. */
interface InvokeError {
  message?: string;
  context?: { json?: () => Promise<AiGatewayResponse> };
}

/**
 * Chama a Edge Function `intelligence-ai` via supabase.functions.invoke,
 * que gerencia auth/CORS/headers automaticamente e é resiliente a
 * respostas longas do DeepSeek.
 */
export const aiService = {
  async callAiGateway(messages: AiGatewayMessage[], maxTokens: number): Promise<string> {
    if (!supabase) throw new Error("Supabase não inicializado.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    let data: AiGatewayResponse | null = null;
    let error: InvokeError | null = null;
    try {
      const res = await supabase.functions.invoke("intelligence-ai", {
        body: { messages, max_tokens: maxTokens },
      });
      data = res.data as AiGatewayResponse | null;
      error = res.error as InvokeError | null;
    } catch (err) {
      console.error("[aiService] invoke threw:", err);
      throw new Error("Falha de rede ao contactar a IA. Verifique sua conexão.");
    }

    if (error) {
      console.error("[aiService] function error:", error);
      // supabase-js embute a resposta em error.context (Response)
      let serverMsg: string | undefined;
      try {
        const ctx = error.context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          serverMsg = body?.message || body?.error;
        }
      } catch {
        /* ignore */
      }
      throw new Error(serverMsg || error.message || "Erro no serviço de IA.");
    }

    if (data?.error) {
      throw new Error(data.message || "Erro no serviço de IA.");
    }

    return data?.choices?.[0]?.message?.content || "";
  },
};
