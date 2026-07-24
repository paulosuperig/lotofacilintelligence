/**
 * Presets de filtros avançados de geração (soma, paridade, primos) e o mapeamento
 * para as faixas soft consumidas pelo gerador. Lógica pura e testável — a UI
 * (`GenerationFilters`) apenas renderiza estes dados.
 */
import type { SmartFilters } from '@/hooks/useLottery';

/** Seleção de presets por dimensão (chave do preset ativo em cada grupo). */
export interface FilterSelection {
  soma: string;
  paridade: string;
  primos: string;
}

export const EMPTY_FILTER_SELECTION: FilterSelection = {
  soma: 'any',
  paridade: 'any',
  primos: 'any',
};

export interface FilterPreset {
  key: string;
  label: string;
  filter: SmartFilters;
}

export const FILTER_GROUPS: {
  id: keyof FilterSelection;
  label: string;
  presets: FilterPreset[];
}[] = [
  {
    id: 'soma',
    label: 'Soma',
    presets: [
      { key: 'any', label: 'Qualquer', filter: {} },
      { key: 'baixa', label: 'Baixa', filter: { sumMax: 190 } },
      { key: 'ideal', label: 'Ideal', filter: { sumMin: 180, sumMax: 210 } },
      { key: 'alta', label: 'Alta', filter: { sumMin: 200 } },
    ],
  },
  {
    id: 'paridade',
    label: 'Paridade',
    presets: [
      { key: 'any', label: 'Qualquer', filter: {} },
      { key: 'equilibrio', label: 'Equilíbrio', filter: { paresMin: 7, paresMax: 8 } },
      { key: 'pares', label: '+ Pares', filter: { paresMin: 8 } },
      { key: 'impares', label: '+ Ímpares', filter: { paresMax: 7 } },
    ],
  },
  {
    id: 'primos',
    label: 'Primos',
    presets: [
      { key: 'any', label: 'Qualquer', filter: {} },
      { key: 'ideal', label: 'Ideal (4–6)', filter: { primosMin: 4, primosMax: 6 } },
    ],
  },
];

/** Converte a seleção de presets nas faixas soft consumidas pelo gerador. */
export const filtersFromSelection = (sel: FilterSelection): SmartFilters => {
  let out: SmartFilters = {};
  for (const g of FILTER_GROUPS) {
    const preset = g.presets.find((p) => p.key === sel[g.id]);
    if (preset) out = { ...out, ...preset.filter };
  }
  return out;
};

/** True se algum grupo está fora de "Qualquer". */
export const hasActiveFilters = (sel: FilterSelection): boolean =>
  sel.soma !== 'any' || sel.paridade !== 'any' || sel.primos !== 'any';
