/** Mensagem no formato do gateway de chat (papéis system/user/assistant). */
export type AiGatewayMessage = { role: 'system' | 'user' | 'assistant'; content: string };
