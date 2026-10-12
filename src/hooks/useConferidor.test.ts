import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConferidor } from './useConferidor';
import { writeCache } from '@/lib/cache/localCache';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
describe('checker controller compatibility', () => {
  it('keeps selection, cached official lookup and prize results consistent', async () => {
    writeCache('lf_concurso_3000', { concurso: 3000, data: '10/10/2026', dezenas: numbers.map(String), premiacoes: [{ descricao: '15 acertos', ganhadores: 2, valorPremio: 1000 }] });
    const { result, unmount } = renderHook(() => useConferidor(3000));
    expect(result.current.canConferir).toBe(false);
    act(() => result.current.fillFromSaved({ id: 'game', numbers: [...numbers].reverse(), timestamp: 1 }));
    expect(result.current.selected).toEqual(numbers);
    expect(result.current.canConferir).toBe(true);
    await act(async () => result.current.handleConferir());
    expect(result.current.result).toMatchObject({ concurso: 3000, hits: 15, awarded: true, prizeValor: 1000, ganhadores: 2, matched: numbers, missed: [] });
    expect(result.current.loading).toBe(false);
    act(() => result.current.toggle(1));
    expect(result.current.result).toBeNull();
    expect(result.current.canConferir).toBe(false);
    unmount();
  });
  it('handles empty input and lookup failure without a stuck loading state', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { result, unmount } = renderHook(() => useConferidor());
    await act(async () => result.current.handleConferir());
    expect(fetch).not.toHaveBeenCalled();
    act(() => { result.current.fillFromSaved({ id: 'game', numbers, timestamp: 1 }); result.current.setConcurso('-1'); });
    await act(async () => result.current.handleConferir());
    expect(result.current.error).not.toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    unmount();
  });
});