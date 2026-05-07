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
  timestamp: number;
  type?: string;
  model?: string;
  userId?: string;
  sum?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'demo';
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface Statistics {
  mostDrawn: number[];
  leastDrawn: number[];
  hotNumbers: number[];
  coldNumbers: number[];
}
