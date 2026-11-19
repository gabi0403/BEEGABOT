/**
 * EAM SENAI — Sistema de Gestão de Manutenção e Chamados Internos
 * Camada de Persistência e Gerenciamento de Dados (storage.js)
 * 
 * Arquitetura desacoplada para facilitar futura migração de LocalStorage para SQLite/API REST.
 */

const STORAGE_KEYS = {
    TICKETS: 'eam_tickets_v1',
    AUDIT_LOGS: 'eam_audit_logs_v1',
    SETTINGS: 'eam_settings_v1',
    LAST_ID: 'eam_last_protocol_id_v1'
};

// Dados de demonstração padrão (Mock inicial representativo e coerente com a LGPD)
const DADOS_DEMONSTRACAO = {
    tickets: [
        {
            id: 'EAM-1040',
            protocolo: '#EAM-1040',
            solicitante: 'Operador de Turno A',
            categoria: 'Zeladoria',
            setor: 'Cozinha',
            local: 'Cozinha Industrial — Pia Central de Esterilização',
            descricao: 'Vazamento contínuo sob o sifão da bancada esquerda com acúmulo de água limpa no piso.',
            prioridade: 'Média',
            status: 'Em Atendimento',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min atrás
            dataInicioAtendimento: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min atrás
            dataConclusao: null,
            responsavelAtual: 'Equipe de Hidráulica N2',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Operador de Turno A',
                    dataHora: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    justificativa: 'Abertura do chamado pelo formulário operacional.'
                },
                {
                    statusAnterior: 'Aberto',
                    novoStatus: 'Em Atendimento',
                    responsavel: 'Líder de Turno (Zeladoria)',
                    dataHora: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
                    justificativa: 'Equipe técnica deslocada ao local com kit de reparo de tubulações.'
                }
            ]
        },
        {
            id: 'EAM-1041',
            protocolo: '#EAM-1041',
            solicitante: 'Vigilante N1',
            categoria: 'Risco',
            setor: 'Guarita',
            local: 'Portão Principal de Acesso de Veículos 02',
            descricao: 'Falha grave intermitente no motor de acionamento do portão de carga pesada, risco de descarrilamento da esteira.',
            prioridade: 'Urgente/Risco',
            status: 'Aberto',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
            dataInicioAtendimento: null,
            dataConclusao: null,
            responsavelAtual: 'Plantão de Segurança & Acesso',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Vigilante N1',
                    dataHora: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    justificativa: 'Detecção de travamento de engrenagem no sensor ótico.'
                }
            ]
        },
        {
            id: 'EAM-1042',
            protocolo: '#EAM-1042',
            solicitante: 'Técnico de Manutenção N2',
            categoria: 'Manutenção',
            setor: 'Oficina',
            local: 'Oficina Mecânica — Torno Mecânico CNC 01',
            descricao: 'Aquecimento anormal no rolamento principal do eixo-árvore e ruído vibratório acima de 85dB.',
            prioridade: 'Alta',
            status: 'Em Atendimento',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // ~1h35m atrás
            dataInicioAtendimento: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h atrás
            dataConclusao: null,
            responsavelAtual: 'Especialista Eletromecânico',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Técnico de Manutenção N2',
                    dataHora: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
                    justificativa: 'Ordem de intervenção corretiva programada.'
                },
                {
                    statusAnterior: 'Aberto',
                    novoStatus: 'Em Atendimento',
                    responsavel: 'Gestor da Oficina',
                    dataHora: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    justificativa: 'Desmontagem do mancal em execução.'
                }
            ]
        },
        {
            id: 'EAM-1043',
            protocolo: '#EAM-1043',
            solicitante: 'Inspetor de Higiene',
            categoria: 'Zeladoria',
            setor: 'Cozinha',
            local: 'Refeitório Industrial — Coifa e Dutos de Exaustão',
            descricao: 'Higienização e desengorduramento preventivo trimestral do sistema de extração de vapores.',
            prioridade: 'Baixa',
            status: 'Concluído',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 180 * 60 * 1000).toISOString(), // 3h atrás
            dataInicioAtendimento: new Date(Date.now() - 140 * 60 * 1000).toISOString(), // 2h20 atrás
            dataConclusao: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
            responsavelAtual: 'Empresa Especializada de Limpeza Técnica',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Inspetor de Higiene',
                    dataHora: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
                    justificativa: 'Abertura conforme cronograma de boas práticas ANVISA.'
                },
                {
                    statusAnterior: 'Aberto',
                    novoStatus: 'Em Atendimento',
                    responsavel: 'Supervisor de Zeladoria',
                    dataHora: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
                    justificativa: 'Aplicação de sanitizantes e desengraxante térmico.'
                },
                {
                    statusAnterior: 'Em Atendimento',
                    novoStatus: 'Concluído',
                    responsavel: 'Supervisor de Zeladoria',
                    dataHora: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    justificativa: 'Serviço inspecionado e aprovado com teste de vazão concluído.'
                }
            ]
        },
        {
            id: 'EAM-1044',
            protocolo: '#EAM-1044',
            solicitante: 'Agente Patrimonial',
            categoria: 'Vigilância',
            setor: 'Guarita',
            local: 'Guarita Sul — Câmera CFTV Perimetral 04',
            descricao: 'Perda intermitente de sinal de vídeo e infravermelho no quadrante oeste do estacionamento.',
            prioridade: 'Média',
            status: 'Concluído',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 240 * 60 * 1000).toISOString(), // 4h atrás
            dataInicioAtendimento: new Date(Date.now() - 210 * 60 * 1000).toISOString(), // 3h30 atrás
            dataConclusao: new Date(Date.now() - 80 * 60 * 1000).toISOString(), // 1h20 atrás
            responsavelAtual: 'Suporte Técnico CFTV',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Agente Patrimonial',
                    dataHora: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
                    justificativa: 'Falha de sinal informada na troca de turno.'
                },
                {
                    statusAnterior: 'Aberto',
                    novoStatus: 'Em Atendimento',
                    responsavel: 'Analista de Infraestrutura',
                    dataHora: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
                    justificativa: 'Reclimpagem do conector RJ45 blindado na torre.'
                },
                {
                    statusAnterior: 'Em Atendimento',
                    novoStatus: 'Concluído',
                    responsavel: 'Analista de Infraestrutura',
                    dataHora: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
                    justificativa: 'Sinal restaurado e verificado no NVR central em full HD.'
                }
            ]
        },
        {
            id: 'EAM-1045',
            protocolo: '#EAM-1045',
            solicitante: 'Auxiliar de Limpeza',
            categoria: 'Zeladoria',
            setor: 'Cozinha',
            local: 'Cozinha Industrial — Pia Central de Esterilização',
            descricao: 'Gotejamento na conexão do sifão de água servida.',
            prioridade: 'Baixa',
            status: 'Aberto',
            imagemUrl: '',
            dataAbertura: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min atrás
            dataInicioAtendimento: null,
            dataConclusao: null,
            responsavelAtual: 'Aguardando Despacho',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: 'Auxiliar de Limpeza',
                    dataHora: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    justificativa: 'Abertura para verificação de vazamento na pia.'
                }
            ]
        }
    ],
    lastId: 1045
};

const StorageService = {
    /**
     * Inicializa o armazenamento com dados mock se estiver vazio.
     */
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
            this.resetarDados();
        }
    },

    /**
     * Restaura os dados padrão de demonstração.
     */
    resetarDados() {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(DADOS_DEMONSTRACAO.tickets));
        localStorage.setItem(STORAGE_KEYS.LAST_ID, DADOS_DEMONSTRACAO.lastId.toString());
        this.sincronizarLogsGlobais();
    },

    /**
     * Retorna todos os chamados salvos.
     * @returns {Array} Lista de chamados
     */
    obterTodosChamados() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao ler chamados do LocalStorage:', error);
            return [];
        }
    },

    /**
     * Busca um chamado pelo ID ou protocolo.
     * @param {string} idOuProtocolo 
     * @returns {Object|null}
     */
    obterChamadoPorId(idOuProtocolo) {
        const tickets = this.obterTodosChamados();
        const limpo = idOuProtocolo.replace('#', '').trim().toUpperCase();
        return tickets.find(t => t.id.toUpperCase() === limpo || t.protocolo.toUpperCase() === `#${limpo}`) || null;
    },

    /**
     * Gera o próximo número de protocolo sequencial (#EAM-1046, etc.)
     * @returns {string}
     */
    gerarProximoProtocolo() {
        let lastId = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ID) || '1045', 10);
        lastId += 1;
        localStorage.setItem(STORAGE_KEYS.LAST_ID, lastId.toString());
        return `#EAM-${lastId}`;
    },

    /**
     * Salva um novo chamado na base de dados.
     * @param {Object} novoChamado 
     * @returns {Object} Chamado salvo com protocolo gerado
     */
    salvarChamado(novoChamado) {
        const tickets = this.obterTodosChamados();
        const protocolo = this.gerarProximoProtocolo();
        const id = protocolo.replace('#', '');
        const dataAgora = new Date().toISOString();

        const registroCompleto = {
            id,
            protocolo,
            solicitante: novoChamado.solicitante.trim(),
            categoria: novoChamado.categoria,
            setor: novoChamado.setor,
            local: novoChamado.local.trim(),
            descricao: novoChamado.descricao.trim(),
            prioridade: novoChamado.prioridade,
            status: 'Aberto',
            imagemUrl: novoChamado.imagemUrl || '',
            dataAbertura: dataAgora,
            dataInicioAtendimento: null,
            dataConclusao: null,
            responsavelAtual: 'Aguardando Despacho',
            historico: [
                {
                    statusAnterior: null,
                    novoStatus: 'Aberto',
                    responsavel: novoChamado.solicitante.trim() || 'Colaborador Anônimo',
                    dataHora: dataAgora,
                    justificativa: novoChamado.justificativaInicial || 'Registro inicial do chamado no sistema EAM.'
                }
            ]
        };

        try {
            tickets.unshift(registroCompleto);
            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            this.sincronizarLogsGlobais();
            return registroCompleto;
        } catch (error) {
            console.error('Falha de armazenamento no LocalStorage ao salvar chamado:', error);
            // Reverte a inserção na memória para manter a integridade
            tickets.shift();
            if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
                throw new Error('A cota de armazenamento do navegador foi excedida. Remova anexos pesados ou restaure os dados para prosseguir.');
            }
            throw new Error('Não foi possível salvar o chamado no armazenamento local: ' + (error.message || 'Erro de gravação.'));
        }
    },

    /**
     * Atualiza o status e/ou setor de um chamado com histórico imutável obrigatório.
     * @param {string} id 
     * @param {Object} alteracoes { novoStatus, novoSetor, responsavel, justificativa }
     * @returns {Object|null}
     */
    atualizarStatusChamado(id, alteracoes) {
        const tickets = this.obterTodosChamados();
        const index = tickets.findIndex(t => t.id === id);

        if (index === -1) {
            console.error(`Chamado ${id} não encontrado.`);
            return null;
        }

        const chamado = tickets[index];
        const statusAnterior = chamado.status;
        const dataAgora = new Date().toISOString();

        // Regra de timestamps:
        // 1. Primeira vez que vai para "Em Atendimento", grava dataInicioAtendimento
        if (alteracoes.novoStatus === 'Em Atendimento' && !chamado.dataInicioAtendimento) {
            chamado.dataInicioAtendimento = dataAgora;
        }

        // 2. Primeira vez que conclui, grava dataConclusao
        if (alteracoes.novoStatus === 'Concluído' && !chamado.dataConclusao) {
            chamado.dataConclusao = dataAgora;
        }

        // Se houver alteração de setor (redirecionamento)
        if (alteracoes.novoSetor && alteracoes.novoSetor !== chamado.setor) {
            chamado.setor = alteracoes.novoSetor;
        }

        if (alteracoes.novoStatus) {
            chamado.status = alteracoes.novoStatus;
        }

        if (alteracoes.responsavel) {
            chamado.responsavelAtual = alteracoes.responsavel;
        }

        // Registro de Auditoria Imutável (Regra de Negócio 6, 8 e 15)
        const novoEventoAuditoria = {
            statusAnterior: statusAnterior,
            novoStatus: chamado.status,
            setor: chamado.setor,
            responsavel: alteracoes.responsavel || 'Gestor Operacional',
            dataHora: dataAgora,
            justificativa: alteracoes.justificativa.trim()
        };

        if (!chamado.historico) {
            chamado.historico = [];
        }

        // Adiciona ao histórico mantendo integridade
        chamado.historico.push(novoEventoAuditoria);

        try {
            tickets[index] = chamado;
            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            this.sincronizarLogsGlobais();
            return chamado;
        } catch (error) {
            console.error('Falha de armazenamento no LocalStorage ao atualizar chamado:', error);
            // Reverte a alteração em memória
            chamado.historico.pop();
            chamado.status = statusAnterior;
            if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
                throw new Error('A cota do navegador foi excedida ao salvar a atualização.');
            }
            throw new Error('Não foi possível gravar a alteração de status no armazenamento local.');
        }
    },

    /**
     * Coleta todos os logs de auditoria de todos os chamados para a tela de Auditoria Geral.
     * @returns {Array}
     */
    sincronizarLogsGlobais() {
        const tickets = this.obterTodosChamados();
        const logs = [];

        tickets.forEach(ticket => {
            if (Array.isArray(ticket.historico)) {
                ticket.historico.forEach(item => {
                    logs.push({
                        chamadoId: ticket.id,
                        protocolo: ticket.protocolo,
                        local: ticket.local,
                        setor: ticket.setor,
                        prioridade: ticket.prioridade,
                        ...item
                    });
                });
            }
        });

        // Ordenar por data decrescente (mais recente primeiro)
        logs.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
        } catch (e) {
            console.warn('Aviso de cota ao sincronizar logs globais secundários:', e);
        }
        return logs;
    },

    /**
     * Retorna a lista completa de auditoria do sistema.
     * @returns {Array}
     */
    obterLogsAuditoria() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
            return data ? JSON.parse(data) : this.sincronizarLogsGlobais();
        } catch (e) {
            return this.sincronizarLogsGlobais();
        }
    }
};

// Exporta globalmente para compatibilidade com navegadores e testes
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}
if (typeof global !== 'undefined') {
    global.StorageService = StorageService;
}

// Inicializa automaticamente no carregamento do script
StorageService.init();
