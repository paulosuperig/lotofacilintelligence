import type { Bolao } from '@/lib/lottery/bolao';

/**
 * Persistência local dos bolões (localStorage). Bolões são a ferramenta de
 * gestão do organizador — ficam no dispositivo, sem depender de backend.
 */
const STORAGE_KEY = 'lf_boloes_v1';

const isBolao = (b: unknown): b is Bolao => {
  const x = b as Partial<Bolao> | null;
  return (
    !!x &&
    typeof x.id === 'string' &&
    typeof x.nome === 'string' &&
    Array.isArray(x.cotistas) &&
    Array.isArray(x.jogos)
  );
};

export const bolaoService = {
  list(): Bolao[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isBolao) : [];
    } catch {
      return [];
    }
  },

  saveAll(boloes: Bolao[]): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boloes));
    } catch {
      /* quota/serialização — não-fatal */
    }
  },

  upsert(bolao: Bolao): Bolao[] {
    const all = this.list();
    const idx = all.findIndex((b) => b.id === bolao.id);
    if (idx >= 0) all[idx] = bolao;
    else all.unshift(bolao);
    this.saveAll(all);
    return all;
  },

  remove(id: string): Bolao[] {
    const all = this.list().filter((b) => b.id !== id);
    this.saveAll(all);
    return all;
  },
};
