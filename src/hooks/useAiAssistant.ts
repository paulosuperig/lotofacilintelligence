import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export const useAiAssistant = () => {
  const { toast } = useToast();
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) setDeepSeekKey(savedKey);
  }, []);

  const saveDeepSeekKey = (key: string) => {
    localStorage.setItem('deepseek_api_key', key);
    setDeepSeekKey(key);
    toast({
      title: "Configuração Salva",
      description: "A chave da API DeepSeek foi armazenada com sucesso.",
    });
  };

  const sendMessage = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;
    if (!deepSeekKey) {
      toast({
        title: "API Key Ausente",
        description: "Configure a chave da API DeepSeek nas configurações para usar a IA.",
        variant: "destructive"
      });
      return;
    }

    const newMessage = { role: 'user' as const, content: messageToSend };
    setAiChat(prev => [...prev, newMessage]);
    setAiMessage('');
    setIsAiLoading(true);

    try {
      const systemPrompt = `Você é o "Lotofácil Intelligence AI", um sistema proprietário e exclusivo de inteligência artificial de alto desempenho, especializado em estatística, probabilidade e análise de loterias brasileiras, especialmente a Lotofácil. 
      Seu objetivo é ajudar usuários a analisar tendências, sugerir números baseados em lógica matemática e fornecer insights sobre fechamentos.
      Sempre mantenha um tom profissional, técnico e encorajador. 
      Lembre-se: jogos de loteria são baseados em sorte, use termos como "probabilidades", "tendências" e "estatísticas".
      
      IMPORTANTE:
      1. NUNCA mencione o nome de empresas terceiras, modelos de linguagem externos (como DeepSeek, OpenAI, GPT, etc) ou tecnologias de base. 
      2. Se perguntado sobre quem você é, responda que você é a "Inteligência Artificial exclusiva do ecossistema Intelligence".
      3. Sempre que você sugerir jogos/números (sequências de 15 a 20 números), formate-os em blocos de código ou listas claras.
      4. Se o usuário pedir para gerar jogos, sugira de 1 a 3 opções de 15 números formatados como: 01, 02, 03...
      5. Sempre explique o "porquê" das sugestões (ex: "baseado na frequência do concurso anterior" ou "equilíbrio de quadrantes").`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepSeekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...aiChat,
            newMessage
          ],
          stream: false
        })
      });

      if (!response.ok) throw new Error('Falha na comunicação com a API');

      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.choices[0].message.content };
      setAiChat(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro na IA:", error);
      toast({
        title: "Erro na Inteligência Artificial",
        description: "Não foi possível processar sua solicitação. Verifique sua API Key.",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return {
    deepSeekKey,
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    saveDeepSeekKey,
    sendMessage,
    setAiChat
  };
};
