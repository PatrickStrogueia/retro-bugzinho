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

-- Alteração para a Fase 1.2: Adicionar rastreabilidade (parent_id) aos itens da retrospectiva
ALTER TABLE itens_retro ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES itens_retro(id) ON DELETE CASCADE;

-- Alteração para a Fase 2.3: Adicionar análise de clima na sessão
ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS clima JSONB;

-- Alteração para a Fase 3.1: Adicionar estado do cronômetro
ALTER TABLE sessoes ADD COLUMN IF NOT EXISTS timer_state JSONB DEFAULT '{"status": "IDLE", "endsAt": null, "duration": 0}'::jsonb;
