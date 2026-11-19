# EAM SENAI — Sistema de Gestão de Manutenção e Chamados Internos

**Situação de Aprendizagem SENAI**  
**Projeto:** MVP Funcional do EAM (*Enterprise Asset Management*) para Gestão de Chamados Internos  
**Inspiração Visual:** BEEGA BOT (Design corporativo limpo, moderno, acessível e responsivo)

---

## 1. Contexto e Objetivo

Tradicionalmente, diversas organizações industriais e prediais realizam a comunicação de reparos, manutenções, tarefas de zeladoria e situações de risco por meio de canais informais, como grupos de WhatsApp ou bilhetes físicos.

Essa prática acarreta problemas operacionais críticos:
- Perda de informações, contexto e histórico dos incidentes;
- Abertura de chamados duplicados para a mesma falha;
- Falta de acompanhamento dos atendimentos e ausência de responsáveis individuais definidos;
- Dificuldade para priorizar ocorrências de risco e emergências;
- Ausência de indicadores quantitativos de desempenho (TMA, TMR, taxas de resolução).

O **EAM SENAI** centraliza essas operações em uma aplicação web estruturada, organizada e aderente às regras de governança, garantindo rastreabilidade dos registros e proteção à privacidade operacional (LGPD).

---

## 2. Tecnologias e Arquitetura

O projeto foi concebido estritamente com tecnologias web nativas, sem dependência de bibliotecas ou frameworks pesados (como React, Angular ou Vue):

- **HTML5 Semântico:** Estruturação orientada a acessibilidade, marcos de navegação e componentes nativos.
- **CSS3:** Estilização com variáveis customizadas, Flexbox, CSS Grid, tipografia legível (*Plus Jakarta Sans*) e adaptação para desktop, tablets e monitores de parede (*Modo Telão/Kiosk*).
- **JavaScript Puro (Vanilla JS):** Arquitetura modular separando manipulação de DOM, regras de negócio e camada de dados.
- **Camada de Persistência Desacoplada (`storage.js`):** Abstração das operações de leitura e escrita em `LocalStorage`, concebida para permitir substituição futura por um banco relacional (SQLite ou API REST) sem refatoração da camada de visualização.

### Estrutura de Arquivos
```
BEEGABOT/
├── index.html        # Estrutura semântica e interface única com 6 visões e modais
├── style.css         # Identidade visual corporativa, responsividade e modo telão
├── storage.js        # Camada de persistência, modelo de dados e mock inicial
├── utils.js          # Funções utilitárias, cálculos de TMA/TMR, duplicidades e sanitização
├── app.js            # Orquestração da interface, fluxo de eventos, filtros e navegação
├── assets/
│   └── logo.png      # Identidade visual oficial (BEEGA BOT)
└── README.md         # Documentação técnica e operacional do projeto
```

---

## 3. Como Executar

### Forma Preferencial: Execução via Servidor Local (Live Server)
Recomenda-se executar o projeto por meio de um servidor HTTP local para assegurar a correta resolução de caminhos de arquivos e evitar políticas restritivas do protocolo `file://`:

1. No **VS Code**, clique com o botão direito sobre `index.html` e selecione **Open with Live Server**;
2. Ou via terminal com Python:
   ```bash
   python -m http.server 8000
   ```
   E acesse no navegador: `http://localhost:8000`

### Execução Direta:
- É possível abrir o arquivo `index.html` diretamente em qualquer navegador moderno com suporte a LocalStorage e JavaScript ES6.

---

## 4. Status de Implementação das Funcionalidades

Para garantir clareza perante a banca avaliadora, a tabela a seguir diferencia o que foi planejado, o que está implementado no código e o que foi efetivamente testado:

| Funcionalidade | Status | Detalhes da Implementação / Validação |
|---|---|---|
| **Abertura de Chamados** | Implementado & Testado | Validação de campos obrigatórios, protocolo sequencial `#EAM-10XX` e carimbo de data/hora. |
| **Mapeamento Categoria ➔ Setor** | Implementado & Testado | Direcionamento automático para Cozinha, Guarita ou Oficina no momento da seleção. |
| **Detecção de Duplicidades** | Implementado & Testado | Algoritmo por *stopwords* e comparação de termos relevantes no mesmo local; alerta não-bloqueante funcional. |
| **Painéis Setoriais Independentes** | Implementado & Testado | 3 visões independentes (Cozinha, Guarita, Oficina) ordenadas por criticidade e data. |
| **Atualização Automática (5s)** | Implementado & Testado | `setInterval` a cada 5s atualizando o DOM sem recarregar a página. |
| **Tabela Central do Gestor** | Implementado & Testado | Filtros combinados (setor, status, prioridade) e busca textual por protocolo/local. |
| **Alteração de Status com Justificativa** | Implementado & Testado | Exigência obrigatória de justificativa e identificação do operador responsável. |
| **Cálculo de TMA e TMR** | Implementado & Testado | Médias aritméticas calculadas estritamente com os registros válidos do banco local. |
| **Taxa de Conclusão** | Implementado & Testado | Percentual dinâmico calculado com base no total de chamados concluídos vs. total geral. |
| **Modo Telão / Kiosk** | Implementado | Oculta barra lateral e expande tipografia; validação visual em monitores físicos de parede está pendente. |
| **Upload de Imagem (Base64)** | Implementado | Pré-visualização e armazenamento em string DataURL; validação de limite rígido de cota pendente. |
| **Redirecionamento de Setor** | Implementado & Testado | Permite trocar o setor responsável registrando evento com justificativa na auditoria. |
| **Reabertura de Chamados Concluídos** | Planejado | Regra documentada na arquitetura, mas a interface atual bloqueia reabertura após conclusão. |
| **Autenticação RBAC e Sessões** | Planejado | Fora do escopo do MVP; operadores são informados manualmente nas transições. |

---

## 5. Regras de Negócio Obrigatórias

1. **Protocolo Único e Rastreável:** Todo chamado recebe um identificador alfanumérico sequencial exclusivo (ex.: `#EAM-1040`).
2. **Setor Inicial Automático:** A categoria selecionada determina compulsoriamente o setor de destino inicial:
   - *Manutenção* ➔ Oficina
   - *Zeladoria* ➔ Cozinha
   - *Vigilância* ➔ Guarita
   - *Risco* ➔ Guarita, com alerta visual prioritário máximo (regra inicial de protótipo sujeita à validação da empresa parceira).
3. **Não-Bloqueio por Duplicidade:** O alerta de duplicidade orienta o usuário sobre ordens já existentes no mesmo local, mas não impede a conclusão do cadastro caso o problema seja distinto.
4. **Justificativa Obrigatória em Transições:** Nenhuma alteração de status ou cancelamento pode ser consumada sem o preenchimento de justificativa textual e identificação do responsável.
5. **Preservação de Histórico de Auditoria:** Registros de eventos anteriores são estritamente *append-only* na lógica da aplicação; não é permitido editar ou expurgar eventos passados.
6. **Carimbos de Tempo Canônicos:**
   - `dataAbertura`: gravada na criação do chamado.
   - `dataInicioAtendimento`: gravada na primeira transição para `Em Atendimento` e preservada.
   - `dataConclusao`: gravada na primeira transição para `Concluído`.
7. **Privacidade Operacional (LGPD):** Os painéis operacionais públicos exibem apenas dados técnicos da ocorrência (local, ativo, descrição e equipe), ocultando dados pessoais desnecessários de solicitantes.

---

## 6. Estrutura de Dados

O modelo de dados opera com entidades desacopladas serializadas em JSON no LocalStorage:

### 6.1. Entidade Chamado (`Ticket`)
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador interno sem formatação (ex.: `"EAM-1046"`). |
| `protocolo` | `string` | Identificador canônico formatado (ex.: `"#EAM-1046"`). |
| `solicitante` | `string` | Nome ou função do operador que registrou a ocorrência. |
| `categoria` | `string` | `"Manutenção"` \| `"Zeladoria"` \| `"Vigilância"` \| `"Risco"`. |
| `setor` | `string` | Setor responsável atual (`"Cozinha"` \| `"Guarita"` \| `"Oficina"`). |
| `local` | `string` | Localização física, sala ou máquina (ex.: `"Oficina — Torno CNC 01"`). |
| `descricao` | `string` | Detalhamento do problema técnico relatado. |
| `prioridade` | `string` | `"Baixa"` \| `"Média"` \| `"Alta"` \| `"Urgente/Risco"`. |
| `status` | `string` | `"Aberto"` \| `"Em Atendimento"` \| `"Concluído"` \| `"Cancelado"`. |
| `imagemUrl` | `string` | String em formato Base64 (DataURL) da imagem anexada (ou vazia). |
| `dataAbertura` | `string (ISO)` | Carimbo de data/hora de abertura da ocorrência. |
| `dataInicioAtendimento` | `string (ISO) \| null` | Carimbo do primeiro atendimento; `null` enquanto aberto. |
| `dataConclusao` | `string (ISO) \| null` | Carimbo de conclusão definitiva; `null` se não finalizado. |
| `responsavelAtual` | `string` | Nome individual ou equipe técnica designada para a execução. |
| `historico` | `Array<EventoAuditoria>` | Lista sequencial dos eventos de ciclo de vida do chamado. |

### 6.2. Entidade Registro de Auditoria (`EventoAuditoria`)
| Campo | Tipo | Descrição |
|---|---|---|
| `statusAnterior` | `string \| null` | Estado do chamado antes da transição (`null` na criação). |
| `novoStatus` | `string` | Estado do chamado após a validação da transição. |
| `setor` | `string` | Setor em que o chamado se encontrava no momento da ação. |
| `responsavel` | `string` | Nome do operador ou gestor que executou a transição. |
| `dataHora` | `string (ISO)` | Carimbo temporal exato da operação. |
| `justificativa` | `string` | Justificativa técnica e contextual obrigatória da mudança. |

---

## 7. Atribuição de Responsáveis: Setor vs. Responsável Individual

Para sanar a falta de acompanhamento apontada no problema de negócio, o sistema diferencia formalmente dois conceitos:

1. **Setor Responsável:** A área física ou departamento corporativo encarregado da gerência do chamado (*Cozinha/Zeladoria*, *Guarita/Vigilância* ou *Oficina/Manutenção*). O setor é definido inicialmente pela categoria e pode ser modificado por redirecionamento.
2. **Responsável Individual pelo Atendimento:** O profissional, técnico ou líder operacional especificamente atribuído para a execução física do serviço (ex.: `"Técnico Silva - Matrícula N2-772"` ou `"Equipe Hidráulica N2"`). A atribuição individual é exigida no início do atendimento e registrada em cada passo da trilha de auditoria.

---

## 8. Governança e Regras de Auditoria

A rastreabilidade dos chamados obedece a um fluxo sequencial auditado para cada etapa do ciclo de vida:

- **Abertura:** O sistema registra o chamado com status inicial `Aberto`, gravando solicitante, categoria, setor mapeado e a justificativa de abertura.
- **Início do Atendimento:** A mudança para `Em Atendimento` exige a indicação do responsável individual pelo atendimento e justificativa técnica, fixando a `dataInicioAtendimento` (utilizada no cálculo de TMA).
- **Redirecionamento:** O gestor pode alterar o setor responsável caso constate desvio de escopo (ex.: vazamento hidráulico que afeta o quadro elétrico), exigindo justificativa e registrando novo setor na trilha.
- **Conclusão:** A transição para `Concluído` exige parecer de liberação do serviço e fixa a `dataConclusao` (utilizada no cálculo de TMR).
- **Cancelamento:** Chamados abertos indevidamente ou cancelados pelo solicitante exigem justificativa mandatória; não é permitida a exclusão do registro, mantendo a integridade histórica.
- **Eventual Reabertura (Regra de Negócio Documentada):** Caso o problema reincida após a conclusão, o sistema deve registrar a reabertura como um novo evento na trilha de auditoria, sem sobrescrever os timestamps históricos de abertura e primeira conclusão, viabilizando métricas de reincidência.

> [!WARNING]
> **Esclarecimento sobre a Imutabilidade no MVP:**  
> A lógica da aplicação impede a edição ou deleção do histórico através dos formulários e botões da interface de usuário (*read-only* para o operador comum). Contudo, **o armazenamento em LocalStorage não oferece imutabilidade criptográfica real**, visto que os dados residem desprotegidos no navegador do cliente e podem ser inspecionados ou adulterados via DevTools (F12). Em ambiente corporativo final, essa garantia deve ser fornecida por um banco de dados relacional com controle de transações no servidor.

---

## 9. Indicadores Gerenciais — TMA, TMR e Desempenho Operacional

Os indicadores refletem estritamente as operações registradas no armazenamento local, sem preenchimento por valores aleatórios fictícios:

1. **TMA (Tempo Médio de Atendimento):**
   $$\text{TMA} = \frac{\sum (\text{dataInicioAtendimento} - \text{dataAbertura})}{N_{\text{atendidos}}}$$
   *Chamados ainda não iniciados não entram no cômputo.*

2. **TMR (Tempo Médio de Resolução):**
   $$\text{TMR} = \frac{\sum (\text{dataConclusao} - \text{dataAbertura})}{N_{\text{concluidos}}}$$
   *Chamados não finalizados não entram no cômputo.*

3. **Taxa de Conclusão Operacional:**
   $$\text{Taxa de Conclusão} = \left( \frac{\text{Chamados Concluídos}}{\text{Total de Chamados}} \right) \times 100$$

4. **Distribuição Setorial e por Criticidade:**
   - Contabilização por setor (Cozinha, Guarita, Oficina);
   - Proporção por prioridade (Baixa, Média, Alta, Urgente/Risco).

*Caso não existam registros concluídos ou iniciados suficientes, a interface exibe explicitamente a mensagem "Sem dados suficientes", em vez de apresentar números simulados.*

---

## 10. Anexos de Imagem em Base64: Validações e Limitações

No protótipo atual, os anexos são convertidos em string DataURL (Base64) por meio da `FileReader API` no navegador.

### Impactos Técnicos e Limitações Conhecidas:
- **Sobrecarga de Armazenamento:** A codificação Base64 gera um aumento aproximado de 33% no tamanho do arquivo em comparação com o binário original.
- **Cota do LocalStorage:** O limite médio de armazenamento dos navegadores para LocalStorage varia entre 5MB e 10MB por domínio. Duas imagens em alta resolução podem esgotar completamente a cota do sistema, gerando exceções do tipo `QuotaExceededError`.
- **Recomendações e Validações Necessárias:**
  - Validação estrita de tipos MIME no front-end (`image/jpeg`, `image/png`);
  - Limite recomendado para o protótipo: arquivos de no máximo **500 KB**;
  - Para a versão final em produção, o upload deve ser transmitido via `multipart/form-data` para um servidor de armazenamento de objetos (ou gravado em disco), persistindo apenas o caminho/URI no banco de dados.

---

## 11. Limitações Conhecidas do MVP

Para alinhamento rigoroso com as expectativas da banca de avaliação:

1. **Persistência Estritamente Local:** O `LocalStorage` não sincroniza dados entre diferentes navegadores, usuários ou máquinas. Um chamado aberto no computador A não estará visível no computador B.
2. **Volatilidade do Cliente:** A limpeza de cache, cookies ou navegação anônima restaura ou expurga os dados cadastrados.
3. **Ausência de Autenticação Real:** O sistema não possui controle de sessão (login/senha) nem perfis de acesso criptografados (RBAC).
4. **Sem Integração com WhatsApp ou Telefonia:** A ferramenta foi desenvolvida para substituir esses canais informais, não para integrá-los.
5. **Canais Oficiais de Emergência:** O sistema **não substitui** o acionamento direto dos órgãos de emergência e socorro (Bombeiros 193, SAMU 192 e Brigada de Emergência Interna).

---

## 12. Matriz de Testes Realizados

Os testes a seguir foram verificados diretamente no ambiente de execução do projeto:

| Cenário de Teste | Status | Resultado Observado |
|---|---|---|
| Cadastro de novo chamado com campos válidos | **Aprovado** | Registro persistido, protocolo `#EAM-1046` gerado e refletido nas visões. |
| Validação de campos obrigatórios no formulário | **Aprovado** | O navegador bloqueia o envio caso solicitante, local ou descrição estejam em branco. |
| Mapeamento automático de setor por categoria | **Aprovado** | Manutenção ➔ Oficina, Zeladoria ➔ Cozinha, Vigilância ➔ Guarita, Risco ➔ Guarita. |
| Detecção de duplicidade por palavras-chave | **Aprovado** | Alerta exibido com chips clicáveis ao coincidir local e ao menos 2 palavras relevantes. |
| Transição de status sem justificativa | **Aprovado** | Formulário bloqueia o envio e exige preenchimento do campo de justificativa. |
| Registro de `dataInicioAtendimento` na 1ª transição | **Aprovado** | Timestamp gravado no primeiro atendimento e preservado nas transições subsequentes. |
| Registro de `dataConclusao` ao concluir | **Aprovado** | Timestamp registrado e utilizado no cálculo exato do TMR. |
| Sanitização de strings contra ataques XSS | **Aprovado** | Tags `<script>` e caracteres especiais são devidamente escapados antes da renderização. |
| Restauração dos dados mock de demonstração | **Aprovado** | Modal de confirmação restaura os 6 chamados originais e reseta o contador sequencial. |
| Atualização dinâmica a cada 5 segundos | **Aprovado** | `setInterval` atualiza cards e contadores sem acionar o reload da página. |
| Teste de estouro de cota (LocalStorage Quota) | **Pendente** | Validação de comportamento sob inclusão de múltiplas imagens grandes em lote ainda não executada. |
| Teste em múltiplos navegadores legados | **Pendente** | Execução validada em navegadores baseados em Chromium; testes em Safari/iOS pendentes. |
| Teste de acessibilidade WCAG (Leitores de tela) | **Pendente** | Navegação por teclado básica funcional; teste com NVDA/TalkBack pendente. |
