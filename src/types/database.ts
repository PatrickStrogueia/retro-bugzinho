export type SessaoStatus = 'LOBBY' | 'COLETA' | 'PROCESSANDO' | 'VOTACAO' | 'RESULTADOS' | 'ACOES';

export type ItemType = 'good' | 'bad' | 'improve';

export interface Sessao {
  id: string;
  created_at: string;
  status: SessaoStatus;
  clima?: any | null;
  timer_state?: any | null;
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
  parent_id?: string | null;
}

export interface AcaoRetro {
  id: string;
  sessao_id: string;
  item_id?: string | null;
  descricao: string;
  responsavel?: string | null;
  concluido: boolean;
  created_at?: string;
}

