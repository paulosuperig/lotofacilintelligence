import { supabase } from "@/lib/supabase";

export const aiService = {
  /**
   * Chamada principal para o serviço de IA.
   * Agora sempre passa pelo Edge Function para evitar problemas de CORS
   * e garantir o tratamento centralizado de erros.
   */
  async callAiGateway(messages: any[], maxTokens: number, apiKey?: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('intelligence-ai', {
      body: { 
        messages, 
        max_tokens: maxTokens,
        apiKey: apiKey // Se fornecido, o Edge Function usará esta chave
      },
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

  /**
   * @deprecated Utilize callAiGateway passando a apiKey no terceiro parâmetro
   */
  async callDeepSeekDirect(messages: any[], apiKey: string, maxTokens: number): Promise<string> {
    return this.callAiGateway(messages, maxTokens, apiKey);
  }
};