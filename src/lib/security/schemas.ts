import { z } from 'zod';

/**
 * Skill: Defensive Programming
 * Strict schema validation for all incoming and outgoing data.
 */

export const UserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'demo']),
  token: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export const SavedGameSchema = z.object({
  id: z.string().uuid().or(z.string()),
  numbers: z.array(z.number().min(1).max(25)).min(15).max(25),
  timestamp: z.number(),
  sum: z.number().optional(),
  model: z.string().optional(),
  type: z.string().optional(),
});

export const LotteryResultSchema = z.object({
  concurso: z.number().or(z.string()),
  data: z.string(),
  dezenas: z.array(z.string().or(z.number())),
  acumulou: z.boolean().optional(),
  proximoConcurso: z.number().or(z.string()).optional(),
  valorEstimadoProximoConcurso: z.number().optional(),
  valor_estimado: z.number().optional(),
});

export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedSavedGame = z.infer<typeof SavedGameSchema>;
export type ValidatedLotteryResult = z.infer<typeof LotteryResultSchema>;
