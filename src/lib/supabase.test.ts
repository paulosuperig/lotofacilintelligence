import { describe, expect, it } from 'vitest';
import { isSupabaseEnabled, supabase } from './supabase';

describe('Supabase compartilhado', () => {
  it('mantém os serviços de dados ativos com a mesma conexão da autenticação', () => {
    expect(isSupabaseEnabled()).toBe(true);
    expect(supabase).toBeDefined();
  });
});