export type SessaoStatus = 'LOBBY' | 'COLETA' | 'PROCESSANDO' | 'VOTACAO' | 'RESULTADOS';

export type ItemType = 'good' | 'bad' | 'improve';

export interface Sessao {
  id: string;
  created_at: string;
  status: SessaoStatus;
}

export interface Participante {
  id: string;
  sessao_id: string;
  nome: string;
  created_at: string;
}

export interface ItemRetro {
  id: string;
  sessao_id: string;
  texto: string;
  tipo: ItemType;
  votos: number;
  created_at: string;
}
