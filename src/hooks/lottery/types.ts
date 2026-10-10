import { GenStrategy } from '@/lib/lottery/generator';

/** Filtros avançados (faixas soft) escolhidos pelo usuário. */
export interface SmartFilters {
  sumMin?: number;
  sumMax?: number;
  paresMin?: number;
  paresMax?: number;
  primosMin?: number;
  primosMax?: number;
  seqMax?: number;
}

/** Opções de composição escolhidas na UI (estratégia + restrições + filtros). */
export interface SmartOptions extends SmartFilters {
  strategy?: GenStrategy;
  fixed?: number[];
  excluded?: number[];
}

export interface LotteryHookOptions {
  realtime?: boolean;
  analysis?: boolean;
}
