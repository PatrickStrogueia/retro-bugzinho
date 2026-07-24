-- Script de criação da tabela de Planos de Ação para o Supabase
-- Execute este script no SQL Editor do seu projeto no Supabase

CREATE TABLE IF NOT EXISTS acoes_retro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id TEXT NOT NULL,
  item_id UUID NULL REFERENCES itens_retro(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  responsavel TEXT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar a publicação Realtime do Supabase para acoes_retro
ALTER PUBLICATION supabase_realtime ADD TABLE acoes_retro;
