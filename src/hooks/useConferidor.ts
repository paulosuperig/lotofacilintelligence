import { useMemo, useState } from 'react';
import { lotteryService } from '@/services/lotteryService';
import { checkGame } from '@/lib/lottery/checker';
import { prizeLabel } from '@/lib/lottery/prizes';
import { prizeForHits } from '@/lib/lottery/prizeValue';
import type { SavedGame } from '@/types/lottery';

interface ConferResult {
  concurso: number;
  data?: string;
  hits: number;
  matched: number[];
  missed: number[];
  prizeText: string;
  ganhadores: number | null;
  prizeValor: number | null;
  awarded: boolean;
}

export const useConferidor = (defaultConcurso?: number, history: SavedGame[] = []) => {
  const [concurso, setConcurso] = useState<string>(defaultConcurso ? String(defaultConcurso) : '');
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConferResult | null>(null);

  const toggle = (n: number) => {
    setResult(null);
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length >= 15 ? prev : [...prev, n].sort((a, b) => a - b)
    );
  };

  const fillFromSaved = (g: SavedGame) => {
    setResult(null);
    setSelected([...g.numbers].sort((a, b) => a - b).slice(0, 15));
  };

  const canConferir = selected.length === 15 && concurso.trim() !== '' && !loading;

  const savedOptions = useMemo(() => history.slice(0, 8), [history]);

  const handleConferir = async () => {
    if (!canConferir) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const n = parseInt(concurso, 10);
      const res = await lotteryService.getResultByConcurso(n);
      const check = checkGame(selected, res.dezenas);
      const prize = prizeForHits(res.premiacoes, check.hits);
      setResult({
        concurso: typeof res.concurso === 'number' ? res.concurso : n,
        data: res.data,
        hits: check.hits,
        matched: check.matched,
        missed: check.missed,
        prizeText: prizeLabel(check.hits),
        ganhadores: prize?.ganhadores ?? null,
        prizeValor: prize?.valor ?? null,
        awarded: check.awarded,
      });
    } catch {
      setError('Não foi possível conferir. Verifique o número do concurso e sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return { concurso, setConcurso, selected, setSelected, loading, error, result, setResult, toggle, fillFromSaved, canConferir, savedOptions, handleConferir };
};
