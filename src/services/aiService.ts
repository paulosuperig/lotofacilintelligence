import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// DeepSeek pode levar > 60s em respostas longas. Usamos fetch direto (bypassa
// timeouts internos do supabase-js) com AbortController de 3min para evitar
// o erro "Failed to send a request to the Edge Function".
const REQUEST_TIMEOUT_MS = 180_000;

export const aiService = {
  async callAiGateway(messages: any[], maxTokens: number): Promise<string> {
    if (!supabase) throw new Error("Supabase não inicializado.");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Configuração Supabase ausente.");
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages, max_tokens: maxTokens }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        throw new Error("A IA demorou muito para responder. Tente novamente.");
      }
      throw new Error("Falha de rede ao contactar a IA. Verifique sua conexão.");
    }
    clearTimeout(timeoutId);

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // ignore parse error; será tratado abaixo
    }

    if (!response.ok) {
      const msg = data?.message || data?.error || `Erro HTTP ${response.status}`;
      throw new Error(msg);
    }

    if (data?.error) {
      throw new Error(data.message || "Erro no serviço de IA.");
    }

    return data?.choices?.[0]?.message?.content || "";
  },
};
