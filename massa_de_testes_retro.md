# Massa de Testes - Retrospectiva Bugzinho

Aqui está um conjunto de dados projetado estrategicamente para testar a inteligência de agrupamento do Gemini. O objetivo é simular 3 pessoas (Alice, Bruno e Carlos) inserindo post-its. 

Observe que alguns cards têm o **mesmo tema raiz, mas foram escritos de formas muito diferentes**, enquanto outros são assuntos completamente isolados. Isso permitirá testar se a IA consegue fazer associações semânticas corretas.

---

## 🟢 O que foi bom (Good)

**Alice (Frontend - Projeto A)**
> "O uso do novo Design System com Tailwind acelerou muito a criação das telas."

**Bruno (Backend - Projeto A)**
> "A decisão técnica de separar os microsserviços pagou dividendos. O banco de dados está super rápido agora."

**Carlos (QA - Projeto B)**
> "A suíte de testes de regressão automatizados no Cypress não teve nenhum falso positivo (flaky test) nesta sprint. Muito estável!"

**Alice (Frontend - Projeto A)**
> "Entregamos a tela de Dashboard dois dias antes do prazo. O time mandou bem demais!"

---

## 🔴 O que foi ruim (Bad)

**Alice (Frontend - Projeto A)**
> "Tive muitos bloqueios porque os contratos e a documentação da API do backend não refletiam as mudanças reais."

**Bruno (Backend - Projeto A)**
> "Passei muito tempo em call com o frontend explicando os retornos da API porque a nossa wiki estava desatualizada."

**Carlos (QA - Projeto B)**
> "O ambiente de homologação caiu umas três vezes essa semana, isso me impediu de avançar com os testes E2E."

**Alice (Frontend - Projeto A)**
> "A esteira de CI/CD demorou quase 30 minutos para rodar em cada PR. Um gargalo enorme."

**Bruno (Backend - Projeto A)**
> "Tivemos um retrabalho chato porque a regra de negócio da 'task de pagamentos' não estava clara na planning."

---

## 🔵 O que pode melhorar (Improve)

**Alice (Frontend - Projeto A)**
> "Deveríamos automatizar a geração de documentação de API usando ferramentas como o Swagger."

**Bruno (Backend - Projeto A)**
> "Precisamos alinhar os contratos de dados (JSON) logo no começo da sprint para não bloquear o front."

**Carlos (QA - Projeto B)**
> "É urgente criar um script de health check ou dar um up nas máquinas de homologação, a instabilidade lá está crítica."

**Bruno (Backend - Projeto A)**
> "Acho que as nossas dailies estão passando muito do tempo. Poderíamos focar mais nas dependências em vez de status de tarefa."

---

### 🧐 O que esperar que a IA faça com isso:
- **Grupo: Documentação / Contratos de API:** Deve juntar as dores de Alice e Bruno sobre a documentação desatualizada e contratos da API, junto com as soluções propostas (usar Swagger, alinhar JSON).
- **Grupo: Infraestrutura / Homologação:** Deve agrupar as queixas do Carlos sobre a queda de homologação com a melhoria sugerida por ele mesmo.
- **Grupo: CI/CD:** A lentidão na esteira apontada pela Alice pode ser agrupada com Homologação (Infra) ou virar um grupo isolado.
- Os cards de **Good (O que foi bom)** provavalmente ficarão isolados (Design System, Banco de Dados rápido, Cypress estável) por serem conquistas distintas, mas a IA pode surpreender criando um grupo "Boas Práticas Técnicas" ou "Produtividade".
