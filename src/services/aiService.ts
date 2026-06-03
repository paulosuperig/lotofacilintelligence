import { supabase } from "@/lib/supabase";

export const aiService = {
  /**
   * Chamada centralizada via Edge Function.
   * A chave da API DeepSeek é gerenciada exclusivamente no Supabase
   * (system_configs) e nunca trafega pelo cliente.
   */
  async callAiGateway(messages: any[], maxTokens: number): Promise<string> {
    const { data, error } = await supabase.functions.invoke('intelligence-ai', {
      body: { messages, max_tokens: maxTokens },
    });

    if (error) {
      console.error("[AI Service] Invoke error:", error);
      throw error;
    }

    if (data?.error) {
      console.error("[AI Service] Business error:", data.error, data.message);
      throw new Error(data.message || 'Erro no serviço de IA');
    }

    return data?.choices?.[0]?.message?.content || '';
  },
};
