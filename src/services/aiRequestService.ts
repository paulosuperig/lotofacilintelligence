import { aiService, type AiGatewayMessage } from './aiService';

const MAX_RETRIES = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const callAiGateway = async (messages: AiGatewayMessage[], maxTokens: number, signal: AbortSignal, attempt = 0): Promise<string> => {
    if (signal.aborted) throw new DOMException('Consulta cancelada.', 'AbortError');
    try {
      const content = await aiService.callAiGateway(messages, maxTokens, signal);
      if ((!content || !content.trim()) && attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt));
        return callAiGateway(messages, maxTokens, signal, attempt + 1);
      }
      return content;
    } catch (err) {
      if (signal.aborted) throw err;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt));
        return callAiGateway(messages, maxTokens, signal, attempt + 1);
      }
      throw err;
    }
};
