# 🗺️ Roadmap de Desenvolvimento: Bugzinho

Este documento detalha o plano de ação passo a passo para o desenvolvimento do projeto **Bugzinho**, garantindo entregas contínuas, testes isolados de funcionalidades complexas e a mitigação de bugs.

---

## 🎯 Etapa 1: A Fundação e o Visual (Design System)
**Foco:** Estruturar o projeto e criar a biblioteca de componentes visuais, sem envolver lógica complexa ou banco de dados.

- [x] **Setup Inicial:** Inicializar o projeto Next.js com as configurações padrões.
- [x] **Variáveis de Estilo (Tema Cassino):** Definir paleta de cores globais no CSS (fundo dark mode, verde feltro, vermelho, detalhes em dourado e neon).
- [x] **Componentes Base (UI):**
  - Botões customizados (normais e com aspecto de "aposta").
  - Inputs de texto.
  - Componente de "Carta de Baralho" (para os post-its da retro).
  - Componente de "Ficha de Poker" (para os votos).
- [x] **Layout Base:** Criar o esqueleto visual padrão das telas.

> **Critério de Aceite:** É possível montar telas estáticas bonitas usando os componentes criados.

---

## 🔌 Etapa 2: O Motor do Jogo (Banco de Dados e Real-Time)
**Foco:** Configurar o backend as a service (Supabase/Firebase) e validar a tecnologia de sincronização de telas.

- [x] **Modelagem do Banco de Dados:** Criar tabelas necessárias:
  - `Sessoes` (id, status_atual, criado_em)
  - `Participantes` (id, nome, sessao_id)
  - `Itens_Retro` (id, texto, categoria, sessao_id, votos)
- [x] **Conexão:** Integrar o Next.js com o SDK do banco de dados escolhido.
- [x] **Prova de Conceito (PoC) Real-time:** Criar um mecanismo simples onde a alteração do `status_atual` da sessão pelo "Admin" reflete instantaneamente na tela do "Participante" sem precisar recarregar a página (via WebSockets).

> **Critério de Aceite:** Dispositivos diferentes acessando a mesma sala recebem atualizações visuais em tempo real quando o Admin muda a fase.

---

## 🕹️ Etapa 3: O Fluxo Principal (MVP Sem IA)
**Foco:** Integrar o visual (Etapa 1) com o motor (Etapa 2) e ter o sistema funcional de ponta a ponta.

- [x] **Telas de Acesso:** Desenvolvimento das telas de "Criar Sala" (Admin) e "Entrar na Sala" (Participantes) / Lobby.
- [x] **Fase de Coleta (Apostas):** Tela para os participantes enviarem itens de "Bom", "Ruim" e "Melhorar" (salvando no banco atrelados à sessão).
- [x] **Fase de Votação (Manual):** Tela que lista todos os itens submetidos e permite aos participantes distribuir suas "fichas de poker" (votos).
- [x] **Controles do Admin:** Painel do facilitador para transitar entre as etapas (Lobby ➡️ Coleta ➡️ Votação ➡️ Resultados).

> **Critério de Aceite:** É possível rodar uma retrospectiva completa com a equipe, do login até a exibição dos itens mais votados (neste ponto, ainda com itens não agrupados).

---

## 🧠 Etapa 4: O "Dealer" Entra em Ação (Integração com Gemini)
**Foco:** Adicionar a inteligência para agrupar e resumir as dores e acertos da equipe.

- [x] **Configuração da API:** Criar a rota no backend do Next.js para se comunicar com a API do Google Gemini usando chaves seguras.
- [x] **Engenharia de Prompt:** Criar e testar o prompt perfeito para que a IA receba um JSON de itens variados e devolva um JSON com os itens agrupados, resumidos e categorizados.
- [x] **Integração no Fluxo:** Alterar o controle do Admin. Ao finalizar a "Coleta", o sistema chama a IA, atualiza o banco com os grupos consolidados, e só então libera a tela de "Votação".

> **Critério de Aceite:** A tela de votação agora exibe apenas os grandes temas sintetizados pela IA ao invés de dezenas de post-its individuais.

---

## ✨ Etapa 5: Polimento, Gamificação e Lançamento
**Foco:** Inserir a "alma" do cassino, testar e colocar o projeto no ar.

- [x] **Animações (Micro-interações):**
  - Efeito visual de "Cartas sendo distribuídas".
  - Tela de espera rodando uma roleta/caça-níqueis enquanto a IA (Gemini) processa os dados.
  - Efeitos de hover e sons (opcional).
- [ ] **Testes Finais:** Realizar testes de carga (ex: 10 pessoas acessando e votando ao mesmo tempo) e revisão de responsividade (garantir que funciona bem em celulares).
- [ ] **Deploy:** Hospedar a aplicação na plataforma Vercel.

> **Critério de Aceite:** Sistema online no ar via URL pública, com experiência rica e gamificada para os usuários.
