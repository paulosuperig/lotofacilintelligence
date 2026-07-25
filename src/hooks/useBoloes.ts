import { useState, useEffect, useCallback } from 'react';
import { generateSecureId } from '@/lib/security/utils';
import { bolaoService } from '@/services/bolaoService';
import type { Bolao } from '@/lib/lottery/bolao';

/** Estado + operações CRUD dos bolões (persistidos em localStorage). */
export const useBoloes = () => {
  const [boloes, setBoloes] = useState<Bolao[]>([]);

  useEffect(() => {
    setBoloes(bolaoService.list());
  }, []);

  const createBolao = useCallback((nome: string, precoPorJogo: number): Bolao => {
    const bolao: Bolao = {
      id: generateSecureId(),
      nome: nome.trim() || 'Novo bolão',
      precoPorJogo: Math.max(0, precoPorJogo || 0),
      cotistas: [],
      jogos: [],
      createdAt: Date.now(),
    };
    setBoloes(bolaoService.upsert(bolao));
    return bolao;
  }, []);

  const updateBolao = useCallback((bolao: Bolao) => {
    setBoloes(bolaoService.upsert(bolao));
  }, []);

  const deleteBolao = useCallback((id: string) => {
    setBoloes(bolaoService.remove(id));
  }, []);

  return { boloes, createBolao, updateBolao, deleteBolao };
};
