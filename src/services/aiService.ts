import { supabase } from "@/lib/supabase";

export const aiService = {
  async callDeepSeekDirect(messages: any[], apiKey: string, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: false,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  },

  async callAiGateway(messages: any[], maxTokens: number): Promise<string> {
    const { data, error } = await supabase.functions.invoke('intelligence-ai', {
      body: { messages, max_tokens: maxTokens },
    });
    if (error) throw error;
    return data?.choices?.[0]?.message?.content || '';
  }
};
