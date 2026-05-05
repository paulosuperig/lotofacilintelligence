export interface LotteryResult {
  loteria: string;
  concurso: number;
  data: string;
  dezenas: string[];
  premiacoes: {
    descricao: string;
    ganhadores: number;
    valorPremio: number;
  }[];
  acumulou: boolean;
  proximoConcurso: number;
  dataProximoConcurso: string;
  valorEstimadoProximoConcurso: number;
  valorAcumuladoProximoConcurso?: number;
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
