export interface LotteryResult {
  concurso: number;
  data: string;
  dezenas: string[];
  premiacao: {
    descricao: string;
    quantidade_ganhadores: number;
    valor_total: number;
  }[];
  estimativa_proximo_concurso: number;
  data_proximo_concurso: string;
  valor_estimado_proximo_concurso: number;
}

export interface SavedGame {
  id: string;
  numbers: number[];
  createdAt: string;
  userId: string;
}

export interface Statistics {
  mostDrawn: number[];
  leastDrawn: number[];
  hotNumbers: number[];
  coldNumbers: number[];
}
