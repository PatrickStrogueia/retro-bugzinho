# 🎰 Plano de Melhorias e Novas Funcionalidades — Retro Bugzinho

Este documento consolida a estratégia de evolução do **Bugzinho Retro**, organizada por fases operacionais com checklists de implementação para atuação incremental.

---

## 📌 Fase 1: Encerramento do Ciclo & Rastreabilidade (Prioridade Alta - P0)
> **Objetivo:** Garantir que a retrospectiva gere resultados práticos (Planos de Ação) e preservar o histórico dos post-its originais agrupados pela IA.

- [x] **1.1 Fase de Plano de Ação (Action Items)**
  - [x] Adicionar o status `'ACOES'` ao enum `SessaoStatus` em [`src/types/database.ts`](file:///C:/Projetos/CoE/retro-bugzinho/src/types/database.ts).
  - [x] Criar tabela `acoes_retro` no Supabase (`id`, `sessao_id`, `item_id`, `descricao`, `responsavel`, `concluido`, `created_at`).
  - [x] Criar componente `FaseAcoes` para listagem e criação de tarefas vinculadas aos cards mais votados.
  - [x] Atualizar o painel do Dealer em [`src/app/sala/[id]/page.tsx`](file:///C:/Projetos/CoE/retro-bugzinho/src/app/sala/%5Bid%5D/page.tsx) para incluir o botão "Definir Ações".

- [x] **1.2 Rastreabilidade dos Cards Agrupados (Drill-down de IA)**
  - [x] Alterar a rota [`src/app/api/agrupar/route.ts`](file:///C:/Projetos/CoE/retro-bugzinho/src/app/api/agrupar/route.ts) para não deletar os cards originais, salvando uma referência `parent_id` ou usando uma tabela relacional de agrupamento.
  - [x] Adicionar suporte a modal/tooltip nos cards das fases de Votação e Resultados para visualizar os post-its originais que compõem aquele tema e seus autores.

---

## 🧠 Fase 2: Inteligência com Google Gemini & Exportação (Prioridade Média - P1)
> **Objetivo:** Aproveitar a IA para acelerar a tomada de decisão e facilitar o compartilhamento dos resultados com a liderança e a equipe.

- [x] **2.1 Gerador Automático de Action Items por IA**
  - [x] Criar a rota `/api/gerar-acoes` utilizando o SDK `@google/genai` para ler os tópicos mais votados e sugerir propostas de ação no padrão S.M.A.R.T.
  - [x] Adicionar botão no painel do Dealer: *"🪄 Sugerir Ações com IA"*.

- [x] **2.2 Exportação e Relatório da Retro**
  - [x] Criar modal de exportação na tela de Resultados / Plano de Ação.
  - [x] Opção de copiar resumo estruturado da retrospectiva em **Markdown** (pronto para Notion / GitHub / Azure DevOps).
  - [x] Opção de exportar resumo estruturado em arquivo **.md**.

- [x] **2.3 Análise de Clima e Sentimento da Sprint**
  - [x] Adicionar um widget no topo da tela de Resultados exibindo o tom geral da sprint (ex: *"75% Positivo / Destaque para Infraestrutura"*) analisado pelo Gemini.

---

## ⏱️ Fase 3: Gestão do Tempo & Presença Real-Time (Prioridade Média - P2)
> **Objetivo:** Manter a reunião dinâmica, timeboxed e com alta percepção de presença entre os participantes.

- [x] **3.1 Cronômetro de Discussão (Lean Coffee Timer)**
  - [x] Criar componente `Timer` regressivo configurável pelo Dealer (ex: 3min, 5min) para a fase de discussão dos tópicos.
  - [x] Tocar alerta sonoro temático ao expirar o tempo com opção de estender o tempo.

- [ ] **3.2 Presença Real-time ("Jogadores na Mesa")**
  - [ ] Exibir no Header a lista de participantes conectados à sala em tempo real com indicador de estado (`Online`, `Card enviado`, `Votação concluída`).
  - [ ] Mostrar indicador visual no painel do Dealer quando todos os participantes finalizarem seus votos.

---

## 🎨 Fase 4: Polimento, Gamificação & Templates (Prioridade Baixa - P3)
> **Objetivo:** Elevar o nível de imersão no tema de cassino e permitir diferentes dinâmicas de retrospectiva.

- [ ] **4.1 Configuração Customizada pelo Dealer**
  - [ ] Permitir definir número de fichas por participante ao criar a sala (ex: 3, 5 ou 10 fichas).
  - [ ] Permitir alternar entre Voto Único por card ou Voto Acumulativo.

- [ ] **4.2 Múltiplos Templates de Retrospectiva**
  - [ ] Template *Starfish* (Keep, More, Less, Start, Stop).
  - [ ] Template *4Ls* (Liked, Learned, Lacked, Longed for).
  - [ ] Template *Sailboat* (Ventos, Âncoras, Riscos, Porto).

- [ ] **4.3 Efeitos Sonoros & Animações Visuais**
  - [ ] Efeitos sonoros (SFX) ao colocar ficha na carta e ao submeter card.
  - [ ] Efeito de chuva de fichas de ouro / confetes ao revelar os vencedores na Fase de Resultados.
