import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBolaoDetail } from './useBolaoDetail';
import type { Bolao } from '@/lib/lottery/bolao';
import { writeCache } from '@/lib/cache/localCache';

afterEach(() => localStorage.clear());
const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
const pool: Bolao = { id: 'pool', nome: 'Grupo', precoPorJogo: 3, cotistas: [{ id: 'a', nome: 'A', cotas: 1 }, { id: 'b', nome: 'B', cotas: 2 }], jogos: [numbers], createdAt: 1 };
describe('pool detail controller compatibility', () => {
  it('rejects duplicate combinations without mutation and adds a sorted new game', () => {
    const change = vi.fn();
    const { result, unmount } = renderHook(() => useBolaoDetail(pool, [], change));
    act(() => result.current.addGame([...numbers].reverse()));
    expect(change).not.toHaveBeenCalled();
    const newNumbers = [...numbers.slice(1), 16].reverse();
    act(() => result.current.addGame(newNumbers));
    expect(change.mock.calls[0]?.[0].jogos[1]).toEqual([...numbers.slice(1), 16]);
    expect(pool.jogos).toEqual([numbers]);
    unmount();
  });
  it('keeps cached prize checks and proportional distribution', async () => {
    writeCache('lf_concurso_3000', { concurso: 3000, dezenas: numbers.map(String), premiacoes: [{ descricao: '15 acertos', ganhadores: 1, valorPremio: 300 }] });
    const { result, unmount } = renderHook(() => useBolaoDetail(pool, [], vi.fn(), 3000));
    await act(async () => result.current.handleConferir());
    expect(result.current.conf).toMatchObject({ totalPremio: 300, premiados: 1, melhorAcerto: 15 });
    expect(result.current.conf?.rateio.map((share) => share.valor)).toEqual([100, 200]);
    expect(result.current.loading).toBe(false);
    unmount();
  });
  it('preserves empty-group no-op and cotista field reset', async () => {
    const change = vi.fn();
    const { result, unmount } = renderHook(() => useBolaoDetail({ ...pool, jogos: [] }, [], change, 3000));
    await act(async () => result.current.handleConferir());
    expect(result.current.conf).toBeNull();
    act(() => { result.current.setNomeCotista(' C '); result.current.setCotasCotista('2'); });
    act(() => result.current.addCotista());
    expect(change.mock.calls[0]?.[0].cotistas[2]).toMatchObject({ nome: 'C', cotas: 2 });
    expect(result.current.nomeCotista).toBe('');
    expect(result.current.cotasCotista).toBe('1');
    unmount();
  });
});