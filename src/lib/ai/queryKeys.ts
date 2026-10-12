export const aiChatKey = (userId: string | null) => ['ai_chat_history', userId] as const;
export const aiConfigurationKey = (userId: string | null) => ['ai_config', 'configured', userId] as const;
