# EAM SENAI — Sistema de Gestão de Manutenção e Chamados Internos

**Projeto:** MVP de Sistema de Gestão de Manutenção e Chamados Internos  
**Unidade Curricular:** Desenvolvimento de Soluções Web com Inteligência Artificial Generativa  
**Categoria INTEGRA SENAI:** Soluções Industriais  
**Inspiração visual:** BEEGA BOT
**Integrantes:** Ana Sofhia, Bárbara, Emily, Evelyn e Gabriela

---

## 1. Apresentação do Projeto

O EAM SENAI é um sistema web desenvolvido para centralizar o registro, o direcionamento e o acompanhamento de chamados internos relacionados à manutenção, zeladoria, vigilância e situações de risco.

A proposta surgiu da necessidade de substituir o controle informal de ocorrências, realizado principalmente por mensagens instantâneas, por um ambiente organizado, com identificação dos chamados, direcionamento por setor e histórico das operações.

O sistema busca reduzir a perda de informações, evitar duplicidades, facilitar a identificação de prioridades e fornecer indicadores para o acompanhamento das atividades.

**Objetivo:** desenvolver um MVP funcional, acessível pelo navegador e com interface responsiva, para demonstrar o gerenciamento de chamados internos.

## 2. Requisitos do Sistema

Os requisitos foram organizados conforme o planejamento técnico solicitado na Fase 1 da Situação de Aprendizagem.

### 2.1. Requisitos Funcionais (RF)

| Código | Requisito | Descrição | Situação |
|---|---|---|---|
| RF01 | Abertura de chamados | Permitir o registro simplificado de ocorrências, com geração automática de protocolo único. | Implementado e testado |
| RF02 | Direcionamento por categoria | Encaminhar automaticamente os chamados ao setor correspondente à categoria selecionada. | Implementado e testado |
| RF03 | Painéis setoriais | Disponibilizar painéis operacionais para Cozinha, Guarita e Oficina, exibindo os chamados de cada setor. | Implementado e testado |
| RF04 | Painel administrativo | Permitir a visualização e o gerenciamento centralizado dos chamados, com filtros e ações administrativas. | Implementado e testado |
| RF05 | Histórico de auditoria | Registrar as alterações de status com identificação do responsável, data, horário e justificativa. | Implementado e testado |
| RF06 | Alertas de prioridade | Destacar visualmente chamados prioritários, especialmente ocorrências classificadas como risco. | Implementado; validação específica não registrada na matriz de testes |

### 2.2. Requisitos Não Funcionais (RNF)

| Código | Requisito | Descrição | Situação |
|---|---|---|---|
| RNF01 | Privacidade dos dados | Os painéis operacionais não devem exibir dados pessoais desnecessários dos solicitantes, respeitando os princípios de privacidade da LGPD. | Implementado; testes específicos de privacidade devem ser considerados na validação |
| RNF02 | Compatibilidade e responsividade | O sistema deve funcionar em navegadores web, adaptando sua interface a computadores, tablets e monitores, sem exigir aplicativo nativo. | Implementado; testes em diferentes dispositivos e navegadores ainda são necessários |
| RNF03 | Atualização automática | Os painéis operacionais devem atualizar suas informações visualmente sem exigir o recarregamento manual da página. | Implementado e testado; atualização local a cada 5 segundos |

**Observação:** os requisitos representam o escopo planejado. A situação de implementação indica o que está disponível no MVP, sem confundir funcionalidades implementadas com validações ainda pendentes.

## 3. Regras de Negócio

O funcionamento do sistema segue as seguintes regras:

1. **Protocolo único:** todo chamado cadastrado recebe um identificador sequencial, como `#EAM-1046`.
2. **Direcionamento automático:** a categoria determina o setor inicial:
   - Manutenção → Oficina;
   - Zeladoria → Cozinha;
   - Vigilância → Guarita;
   - Risco → Guarita, com prioridade visual máxima.
3. **Status obrigatório:** todo chamado possui um status identificável: Aberto, Em Atendimento, Concluído ou Cancelado.
4. **Responsabilidade setorial:** todo chamado recebe inicialmente um setor responsável. A atribuição de um responsável individual ocorre no início do atendimento.
5. **Justificativa obrigatória:** alterações de status e redirecionamentos exigem justificativa e identificação do operador.
6. **Histórico preservado:** as operações anteriores são mantidas no histórico da aplicação, sem edição ou exclusão pela interface.
7. **Alerta de duplicidade:** possíveis ocorrências repetidas são identificadas por comparação do local e de palavras relevantes na descrição. O alerta não impede o cadastro.
8. **Priorização de riscos:** ocorrências classificadas como risco recebem destaque visual para facilitar sua identificação.

## 4. Funcionalidades Complementares

Além dos seis requisitos funcionais prioritários, o MVP possui recursos complementares:

- Identificação de possíveis chamados duplicados.
- Filtros administrativos por setor, status e prioridade.
- Pesquisa por protocolo e local.
- Atribuição de responsável individual pelo atendimento.
- Redirecionamento de chamados entre setores, com justificativa.
- Anexos de imagem com pré-visualização.
- Indicadores gerenciais de atendimento e resolução.
- Modo Telão/Kiosk para visualização operacional.

## 5. Indicadores Gerenciais

O dashboard apresenta indicadores calculados a partir dos registros armazenados no sistema.

**TMA — Tempo Médio de Atendimento**

Calcula o tempo médio entre a abertura do chamado e o início do atendimento.

\[
TMA = \frac{\sum (dataInicioAtendimento-dataAbertura)}{N_{atendidos}}
\]

**TMR — Tempo Médio de Resolução**

Calcula o tempo médio entre a abertura e a conclusão dos chamados.

\[
TMR = \frac{\sum (dataConclusao-dataAbertura)}{N_{concluidos}}
\]

**Taxa de Conclusão**

Representa o percentual de chamados concluídos em relação ao total de chamados.

\[
Taxa = \frac{Chamados\ Concluídos}{Total\ de\ Chamados}\times100
\]

**Distribuição operacional:** apresenta a quantidade de chamados por setor e por nível de prioridade.

Chamados que ainda não possuem os registros necessários para determinado cálculo não são considerados na respectiva média. Quando não existem dados suficientes, o sistema deve informar essa condição.

## 6. Modelo de Dados

### 6.1. Modelo relacional proposto — SQLite

Como solicitado na Fase 1, o planejamento prevê um modelo relacional com três tabelas principais:

**Tabela `setores`**

| Campo | Tipo SQLite | Descrição |
|---|---|---|
| id | INTEGER PRIMARY KEY | Identificador do setor |
| nome | TEXT NOT NULL | Nome do setor |

**Tabela `chamados`**

| Campo | Tipo SQLite | Descrição |
|---|---|---|
| id | INTEGER PRIMARY KEY | Identificador interno |
| protocolo | TEXT UNIQUE NOT NULL | Protocolo do chamado |
| solicitante | TEXT NOT NULL | Nome ou identificação do solicitante |
| categoria | TEXT NOT NULL | Categoria da ocorrência |
| setor_id | INTEGER NOT NULL | Setor responsável |
| local | TEXT NOT NULL | Local da ocorrência |
| descricao | TEXT NOT NULL | Descrição do problema |
| prioridade | TEXT NOT NULL | Prioridade do chamado |
| status | TEXT NOT NULL | Situação atual |
| responsavel | TEXT | Responsável individual pelo atendimento |
| imagem | TEXT | Referência ou conteúdo do anexo |
| data_abertura | TEXT NOT NULL | Data e horário de abertura |
| data_inicio_atendimento | TEXT | Data e horário do início do atendimento |
| data_conclusao | TEXT | Data e horário da conclusão |

**Tabela `logs_auditoria`**

| Campo | Tipo SQLite | Descrição |
|---|---|---|
| id | INTEGER PRIMARY KEY | Identificador do evento |
| chamado_id | INTEGER NOT NULL | Chamado relacionado ao evento |
| status_anterior | TEXT | Status anterior à alteração |
| novo_status | TEXT NOT NULL | Novo status |
| setor_id | INTEGER | Setor relacionado à operação |
| responsavel | TEXT NOT NULL | Operador responsável pela ação |
| data_hora | TEXT NOT NULL | Data e horário do evento |
| justificativa | TEXT NOT NULL | Motivo da alteração |

**Relacionamentos:**

- Um setor pode possuir vários chamados.
- Um chamado pertence a um setor responsável.
- Um chamado pode possuir vários registros de auditoria.
- Cada registro de auditoria está relacionado a um chamado.

### 6.2. Modelo utilizado no MVP

Apesar do planejamento relacional em SQLite, a versão atual do protótipo utiliza **LocalStorage** para armazenar os chamados e seus históricos no navegador.

Os registros são organizados em estruturas JSON, com entidades equivalentes a `Ticket` e `EventoAuditoria`.

Portanto, o modelo SQLite apresentado nesta documentação representa o planejamento técnico da solução e não uma integração já implementada.

## 7. Tecnologias e Arquitetura

O MVP foi desenvolvido utilizando tecnologias web nativas:

- **HTML5:** estruturação semântica das páginas.
- **CSS3:** identidade visual, responsividade e organização dos componentes.
- **JavaScript (Vanilla JS):** regras de negócio, manipulação da interface e gerenciamento dos chamados.
- **LocalStorage:** persistência local dos dados no navegador.

### 7.1. Estrutura de Arquivos

```text
BEEGABOT/
├── index.html
├── style.css
├── storage.js
├── utils.js
├── app.js
├── assets/
│   └── logo.png
└── README.md
```

- `index.html`: estrutura das telas e componentes.
- `style.css`: estilos e adaptações da interface.
- `storage.js`: armazenamento e gerenciamento dos dados.
- `utils.js`: funções auxiliares, cálculos e validações.
- `app.js`: controle da interface e execução das funcionalidades.
- `assets/`: recursos visuais utilizados pelo projeto.

## 8. Como Executar

Recomenda-se utilizar o Visual Studio Code com a extensão Live Server.

1. Abra a pasta do projeto no VS Code.
2. Localize o arquivo `index.html`.
3. Clique com o botão direito e selecione **Open with Live Server**.
4. O sistema será aberto no navegador.

Como alternativa, execute no terminal, dentro da pasta do projeto:

```bash
python -m http.server 8000
```

Depois, acesse:

`http://localhost:8000`

## 9. Testes e Validação

Os testes realizados no ambiente de desenvolvimento incluem:

| Cenário | Resultado |
|---|---|
| Cadastro de chamado com dados válidos | Aprovado |
| Validação de campos obrigatórios | Aprovado |
| Geração de protocolo único | Aprovado |
| Direcionamento automático por categoria | Aprovado |
| Identificação de possíveis duplicidades | Aprovado |
| Alteração de status sem justificativa | Aprovado: operação bloqueada |
| Registro do início do atendimento | Aprovado |
| Registro da conclusão e cálculo do TMR | Aprovado |
| Sanitização de entradas contra XSS | Aprovado |
| Restauração dos dados de demonstração | Aprovado |
| Atualização automática dos painéis | Aprovado |

### 9.1. Validações Pendentes

- Teste de estouro da cota de armazenamento do LocalStorage.
- Testes em outros navegadores e dispositivos, incluindo Safari e iOS.
- Testes de acessibilidade com leitores de tela.
- Validação visual do modo Telão em monitores físicos.

## 10. Limitações Conhecidas

O projeto é um MVP de demonstração e possui as seguintes limitações:

1. **Armazenamento local:** os dados ficam salvos no navegador utilizado e não são sincronizados entre computadores ou usuários.
2. **Ausência de autenticação real:** não existem login, controle de sessão ou perfis de acesso com permissões individuais.
3. **Identificação manual:** o nome do operador informado nas operações não representa uma identidade autenticada.
4. **Banco de dados:** a integração com SQLite está prevista no planejamento, mas não faz parte da implementação atual.
5. **Anexos:** as imagens são armazenadas localmente em formato DataURL, e o comportamento diante do esgotamento da cota ainda não foi validado.
6. **Auditoria:** a interface preserva os eventos registrados, mas o LocalStorage não garante imutabilidade real dos dados.
7. **Emergências:** o sistema não substitui os canais oficiais de emergência e socorro.
8. **Integrações:** o MVP não possui integração com WhatsApp ou sistemas externos.

A solução também não contempla módulos financeiros ou gerenciamento complexo de ativos, mantendo o foco no controle de chamados internos.

---

**EAM SENAI — Centralização de chamados, organização operacional e rastreabilidade.**
