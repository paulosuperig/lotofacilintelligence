import { useState } from 'react';
import { generateSecureId } from '@/lib/security/utils';
import { lotteryService } from '@/services/lotteryService';
import { totalCotas, conferirBolao, type Bolao, type BolaoConferencia } from '@/lib/lottery/bolao';
import { gameSignature } from '@/lib/lottery/gameSignature';
import type { SavedGame } from '@/types/lottery';

export const useBolaoDetail = (bolao: Bolao, history: SavedGame[], onChange: (b: Bolao) => void, defaultConcurso?: number) => {
  const [nomeCotista, setNomeCotista] = useState('');
  const [cotasCotista, setCotasCotista] = useState('1');
  const [picker, setPicker] = useState<number[]>([]);
  const [concurso, setConcurso] = useState(defaultConcurso ? String(defaultConcurso) : '');
  const [conf, setConf] = useState<BolaoConferencia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCotista = () => {
    const cotas = Math.max(1, Math.round(parseFloat(cotasCotista.replace(',', '.')) || 1));
    onChange({ ...bolao, cotistas: [...bolao.cotistas, { id: generateSecureId(), nome: nomeCotista.trim() || `Cotista ${bolao.cotistas.length + 1}`, cotas }] });
    setNomeCotista('');
    setCotasCotista('1');
  };
  const removeCotista = (id: string) => onChange({ ...bolao, cotistas: bolao.cotistas.filter((c) => c.id !== id) });

  const addGame = (nums: number[]) => {
    if (nums.length !== 15) return;
    const sig = gameSignature(nums);
    if (bolao.jogos.some((g) => gameSignature(g) === sig)) return;
    onChange({ ...bolao, jogos: [...bolao.jogos, [...nums].sort((a, b) => a - b)] });
    setConf(null);
  };
  const removeGame = (idx: number) => { onChange({ ...bolao, jogos: bolao.jogos.filter((_, i) => i !== idx) }); setConf(null); };
  const togglePick = (n: number) => setPicker((p) => p.includes(n) ? p.filter((x) => x !== n) : p.length >= 15 ? p : [...p, n]);

  const savedNotInBolao = history.filter((g) => {
    const sig = gameSignature(g.numbers);
    return !bolao.jogos.some((j) => gameSignature(j) === sig);
  }).slice(0, 12);

  const totCotas = totalCotas(bolao);

  const handleConferir = async () => {
    if (!concurso.trim() || bolao.jogos.length === 0 || loading) return;
    setLoading(true); setError(null); setConf(null);
    try {
      const res = await lotteryService.getResultByConcurso(parseInt(concurso, 10));
      setConf(conferirBolao(bolao, res.dezenas, res.premiacoes));
    } catch {
      setError('Não foi possível conferir. Verifique o concurso e sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return { nomeCotista, setNomeCotista, cotasCotista, setCotasCotista, picker, setPicker, concurso, setConcurso, conf, setConf, loading, error, addCotista, removeCotista, addGame, removeGame, togglePick, savedNotInBolao, totCotas, handleConferir };
};
