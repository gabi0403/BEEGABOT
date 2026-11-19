/**
 * EAM SENAI — Sistema de Gestão de Manutenção e Chamados Internos
 * Controle Principal e Interação com a Interface (app.js)
 */

const App = {
    // Estado da Aplicação
    estado: {
        visaoAtual: 'dashboard',
        setorPainelAtivo: 'Cozinha',
        chamadoSelecionadoId: null,
        chamadoRecemCriadoId: null,
        imagemAnexoBase64: '',
        temporizadorAutoRefresh: null,
        isModoTelao: false
    },

    /**
     * Inicialização do Sistema
     */
    init() {
        this.configurarRelogio();
        this.iniciarAutoRefresh();
        this.navegarPara('dashboard');
        this.atualizarContadoresMenu();
    },

    /**
     * Atualização do Relógio em Tempo Real no Header
     */
    configurarRelogio() {
        const elRelogio = document.getElementById('live-clock');
        const atualizar = () => {
            const agora = new Date();
            if (elRelogio) {
                elRelogio.textContent = agora.toLocaleTimeString('pt-BR', { hour12: false });
            }
        };
        atualizar();
        setInterval(atualizar, 1000);
    },

    /**
     * Atualização Automática dos Painéis a cada 5 segundos sem recarregar a página (Requisito 4.2)
     */
    iniciarAutoRefresh() {
        if (this.estado.temporizadorAutoRefresh) {
            clearInterval(this.estado.temporizadorAutoRefresh);
        }
        this.estado.temporizadorAutoRefresh = setInterval(() => {
            this.atualizarContadoresMenu();
            if (this.estado.visaoAtual === 'paineis-operacionais') {
                this.renderizarPainelSetorial();
            } else if (this.estado.visaoAtual === 'dashboard') {
                this.renderizarDashboard();
            }
        }, 5000);
    },

    /**
     * Controle de Navegação entre as Telas
     * @param {string} viewId 
     */
    navegarPara(viewId) {
        this.estado.visaoAtual = viewId;

        // Atualiza classes ativas no menu lateral
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        // Alterna seções ativas
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const secaoAlvo = document.getElementById(`view-${viewId}`);
        if (secaoAlvo) {
            secaoAlvo.classList.add('active');
        }

        // Atualiza títulos do cabeçalho
        this.atualizarTituloPagina(viewId);

        // Renderiza conteúdo específico da tela
        switch (viewId) {
            case 'dashboard':
                this.renderizarDashboard();
                break;
            case 'todos-chamados':
                this.renderizarTabelaGestao();
                break;
            case 'paineis-operacionais':
                this.renderizarPainelSetorial();
                break;
            case 'indicadores':
                this.renderizarIndicadores();
                break;
            case 'auditoria':
                this.renderizarAuditoriaGlobal();
                break;
            case 'abrir-chamado':
                this.resetarFormularioAbertura();
                break;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Define títulos dinâmicos no Header
     */
    atualizarTituloPagina(viewId) {
        const titulos = {
            'dashboard': ['Visão Geral da Operação', 'Monitoramento e indicadores em tempo real'],
            'abrir-chamado': ['Abertura de Chamado', 'Registro rápido com auto-triagem e validação de duplicidade'],
            'todos-chamados': ['Painel Administrativo do Gestor', 'Gerenciamento centralizado, filtros e despacho'],
            'paineis-operacionais': ['Painéis Operacionais Setoriais', 'Visão operacional para Cozinha, Guarita e Oficina'],
            'indicadores': ['Indicadores Gerenciais (SLA)', 'Métricas de TMA e TMR calculadas a partir de dados reais'],
            'auditoria': ['Trilha de Auditoria & LGPD', 'Histórico imutável de transições e conformidade regulatória']
        };

        const config = titulos[viewId] || ['EAM SENAI', 'Gestão de Manutenção'];
        const elTitulo = document.getElementById('page-current-title');
        const elSub = document.getElementById('page-current-subtitle');
        if (elTitulo) elTitulo.textContent = config[0];
        if (elSub) elSub.textContent = config[1];
    },

    /**
     * Atualiza contadores numéricos na barra lateral
     */
    atualizarContadoresMenu() {
        const chamados = StorageService.obterTodosChamados();
        const elContador = document.getElementById('nav-count-todos');
        if (elContador) {
            elContador.textContent = chamados.length;
        }
    },

    /* ======================================================================
       TELA 1: DASHBOARD / VISÃO GERAL
       ====================================================================== */
    renderizarDashboard() {
        const chamados = StorageService.obterTodosChamados();

        // Cálculo de KPIs
        const total = chamados.length;
        const abertos = chamados.filter(t => t.status === 'Aberto').length;
        const atendimento = chamados.filter(t => t.status === 'Em Atendimento').length;
        const concluidos = chamados.filter(t => t.status === 'Concluído').length;
        const urgentes = chamados.filter(t => t.prioridade === 'Urgente/Risco' && t.status !== 'Concluído' && t.status !== 'Cancelado');

        // Atualizar valores nos cards
        this.definirTextoSeguro('kpi-total', total);
        this.definirTextoSeguro('kpi-abertos', abertos);
        this.definirTextoSeguro('kpi-atendimento', atendimento);
        this.definirTextoSeguro('kpi-concluidos', concluidos);
        this.definirTextoSeguro('kpi-urgentes', urgentes.length);

        // Banner de Alerta Urgente no topo do dashboard
        const areaAlerta = document.getElementById('dashboard-urgent-alert-area');
        if (areaAlerta) {
            areaAlerta.innerHTML = '';
            if (urgentes.length > 0) {
                const banner = document.createElement('div');
                banner.className = 'urgent-banner';
                banner.innerHTML = `
                    <div class="urgent-content">
                        <div class="urgent-icon-box">
                            <span class="material-symbols-outlined">crisis_alert</span>
                        </div>
                        <div class="urgent-text">
                            <h3>Atenção: ${urgentes.length} Ocorrência(s) com Grau de Risco / Urgência Ativa!</h3>
                            <p>Prioridade de atendimento imediato acionada para Guarita/Oficina. Protocolo mais crítico: <strong>${Utils.sanitizarHtml(urgentes[0].protocolo)}</strong> (${Utils.sanitizarHtml(urgentes[0].local)})</p>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="App.abrirModalDetalhes('${urgentes[0].id}')" style="background-color: var(--risk-highlight); font-size: 13px;">
                        Ver Ocorrência Crítica
                    </button>
                `;
                areaAlerta.appendChild(banner);
            }
        }

        // Renderizar lista de chamados recentes
        this.renderizarChamadosRecentesDashboard(chamados.slice(0, 5));

        // Renderizar barras setoriais
        this.renderizarBarrasSetoriaisDashboard(chamados);
    },

    renderizarChamadosRecentesDashboard(recentes) {
        const container = document.getElementById('dashboard-recent-tickets-list');
        if (!container) return;
        container.innerHTML = '';

        if (recentes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); font-size: 13px; text-align: center; padding: 16px;">Nenhum chamado registrado.</p>';
            return;
        }

        const lista = document.createElement('div');
        lista.style.display = 'flex';
        lista.style.flexDirection = 'column';
        lista.style.gap = '10px';

        recentes.forEach(ticket => {
            const estiloStatus = Utils.obterEstiloStatus(ticket.status);
            const estiloPrioridade = Utils.obterEstiloPrioridade(ticket.prioridade);

            const item = document.createElement('div');
            item.className = 'ticket-card-meta-row';
            item.style.padding = '12px 14px';
            item.style.backgroundColor = 'var(--surface-low)';
            item.style.borderRadius = 'var(--radius-md)';
            item.style.cursor = 'pointer';
            item.onclick = () => App.abrirModalDetalhes(ticket.id);

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <span class="protocol-badge">${Utils.sanitizarHtml(ticket.protocolo)}</span>
                    <div style="min-width: 0;">
                        <div style="font-size: 13px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 380px;">
                            ${Utils.sanitizarHtml(ticket.local)}
                        </div>
                        <div style="font-size: 11px; color: var(--text-light);">
                            ${Utils.sanitizarHtml(ticket.setor)} • ${Utils.tempoRelativo(ticket.dataAbertura)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${estiloPrioridade.classe}">${estiloPrioridade.rotulo}</span>
                    <span class="badge ${estiloStatus.classe}">${estiloStatus.rotulo}</span>
                </div>
            `;
            lista.appendChild(item);
        });

        container.appendChild(lista);
    },

    renderizarBarrasSetoriaisDashboard(chamados) {
        const container = document.getElementById('dashboard-sector-bars');
        if (!container) return;
        container.innerHTML = '';

        const total = chamados.length || 1;
        const setores = [
            { nome: 'Cozinha — Zeladoria', chave: 'Cozinha', classe: 'fill-cozinha' },
            { nome: 'Guarita — Vigilância', chave: 'Guarita', classe: 'fill-guarita' },
            { nome: 'Oficina — Manutenção', chave: 'Oficina', classe: 'fill-oficina' }
        ];

        setores.forEach(setor => {
            const qtd = chamados.filter(t => t.setor === setor.chave).length;
            const pct = Math.round((qtd / total) * 100);

            const div = document.createElement('div');
            div.className = 'sector-progress-item';
            div.innerHTML = `
                <div class="sector-progress-label">
                    <span>${setor.nome}</span>
                    <span>${qtd} chamados (${pct}%)</span>
                </div>
                <div class="sector-progress-bar-bg">
                    <div class="sector-progress-bar-fill ${setor.classe}" style="width: ${pct}%;"></div>
                </div>
            `;
            container.appendChild(div);
        });
    },

    /* ======================================================================
       TELA 2: ABERTURA DE CHAMADOS & DUPLICIDADES
       ====================================================================== */
    selecionarCategoria(categoria, elementoCard) {
        document.querySelectorAll('.category-radio-card').forEach(c => c.classList.remove('active'));
        if (elementoCard) {
            elementoCard.classList.add('active');
            const input = elementoCard.querySelector('input');
            if (input) input.checked = true;
        }

        // Mapeamento automático para o setor inicial (Requisito 4.1)
        const setorMapeado = Utils.mapearSetorInicial(categoria);
        const elBadge = document.getElementById('form-auto-route-badge');
        if (elBadge) {
            if (categoria === 'Risco') {
                elBadge.innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 16px; color: var(--risk-highlight);">crisis_alert</span>
                    <span style="color: var(--risk-highlight);">Setor Inicial: <strong>Guarita com Alerta Máximo</strong> (Regra inicial do protótipo)</span>
                `;
            } else {
                elBadge.innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 16px;">alt_route</span>
                    <span>Setor Inicial: <strong>${setorMapeado}</strong> (Direcionamento Automático)</span>
                `;
            }
        }

        // Se a categoria for Risco, define automaticamente prioridade para Urgente/Risco
        if (categoria === 'Risco') {
            const selPrioridade = document.getElementById('form-prioridade');
            if (selPrioridade) selPrioridade.value = 'Urgente/Risco';
        }
    },

    preencherLocal(valor) {
        const inputLocal = document.getElementById('form-local');
        if (inputLocal) {
            inputLocal.value = valor;
            inputLocal.focus();
            this.verificarDuplicidadeAoDigitar();
        }
    },

    atualizarContadorDescricao(el) {
        const counter = document.getElementById('form-desc-counter');
        if (counter) {
            counter.textContent = `${el.value.length} / 400`;
        }
    },

    alterarPrioridadeForm(prioridade) {
        // Ajuste auxiliar se necessário
    },

    handleUploadImagem(e) {
        const arquivo = e.target.files[0];
        if (!arquivo) return;

        // 1. Validação de Formato MIME estrito (JPEG, PNG, WebP)
        const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!formatosPermitidos.includes(arquivo.type)) {
            this.mostrarToast('Formato não suportado. Utilize apenas imagens JPEG, PNG ou WebP.');
            this.removerImagemAnexo();
            return;
        }

        // 2. Validação de Tamanho Máximo Estrito (500 KB = 500 * 1024 bytes)
        const LIMITE_BYTES = 500 * 1024;
        if (arquivo.size > LIMITE_BYTES) {
            const tamanhoKB = Math.round(arquivo.size / 1024);
            this.mostrarToast(`Arquivo muito pesado (${tamanhoKB} KB). O limite máximo permitido é de 500 KB.`);
            this.removerImagemAnexo();
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            // Valida se a string gerada é segura antes de aplicar
            if (!Utils.validarUrlImagemSegura(base64)) {
                this.mostrarToast('Erro ao processar imagem: codificação inválida ou insegura.');
                this.removerImagemAnexo();
                return;
            }

            this.estado.imagemAnexoBase64 = base64;
            const previewArea = document.getElementById('form-image-preview-area');
            const previewImg = document.getElementById('form-image-preview');
            if (previewArea && previewImg) {
                previewImg.src = this.estado.imagemAnexoBase64;
                previewArea.style.display = 'block';
            }
        };
        reader.onerror = () => {
            this.mostrarToast('Erro na leitura do arquivo local.');
            this.removerImagemAnexo();
        };
        reader.readAsDataURL(arquivo);
    },

    removerImagemAnexo() {
        this.estado.imagemAnexoBase64 = '';
        const previewArea = document.getElementById('form-image-preview-area');
        const inputHidden = document.getElementById('form-file-hidden');
        if (previewArea) previewArea.style.display = 'none';
        if (inputHidden) inputHidden.value = '';
    },

    /**
     * Detecção de Duplicidades em Tempo Real (Requisito 6)
     * Não bloqueia o envio, apenas exibe aviso proativo com chips.
     */
    verificarDuplicidadeAoDigitar() {
        const inputLocal = document.getElementById('form-local');
        const inputDesc = document.getElementById('form-descricao');
        const banner = document.getElementById('duplicate-warning-banner');
        const chipsContainer = document.getElementById('duplicate-chips-container');

        if (!inputLocal || !inputDesc || !banner || !chipsContainer) return;

        const local = inputLocal.value.trim();
        const desc = inputDesc.value.trim();

        if (local.length < 3 || desc.length < 5) {
            banner.classList.remove('show');
            return;
        }

        const chamados = StorageService.obterTodosChamados();
        const duplicados = Utils.detectarDuplicidades(local, desc, chamados);

        if (duplicados.length > 0) {
            chipsContainer.innerHTML = '';
            duplicados.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'duplicate-chip';
                chip.textContent = `${item.ticket.protocolo} (${item.palavrasEmComum.join(', ')})`;
                chip.title = 'Clique para ver o chamado já existente';
                chip.onclick = () => App.abrirModalDetalhes(item.ticket.id);
                chipsContainer.appendChild(chip);
            });

            banner.classList.add('show');
        } else {
            banner.classList.remove('show');
        }
    },

    /**
     * Submissão do Formulário de Abertura de Chamado
     */
    salvarNovoChamado(e) {
        e.preventDefault();

        const solicitante = document.getElementById('form-solicitante').value.trim();
        const local = document.getElementById('form-local').value.trim();
        const descricao = document.getElementById('form-descricao').value.trim();
        const prioridade = document.getElementById('form-prioridade').value;

        const radioCategoria = document.querySelector('input[name="form-categoria"]:checked');
        const categoria = radioCategoria ? radioCategoria.value : 'Manutenção';
        const setor = Utils.mapearSetorInicial(categoria);

        if (!solicitante || !local || !descricao) {
            this.mostrarToast('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Salvar via StorageService com tratamento de QuotaExceededError
        try {
            const novoChamado = StorageService.salvarChamado({
                solicitante,
                categoria,
                setor,
                local,
                descricao,
                prioridade,
                imagemUrl: this.estado.imagemAnexoBase64
            });

            this.estado.chamadoRecemCriadoId = novoChamado.id;

            // Exibir modal de confirmação
            const elProtocolo = document.getElementById('sucesso-protocolo-exibicao');
            if (elProtocolo) elProtocolo.textContent = novoChamado.protocolo;

            const modalSucesso = document.getElementById('modal-sucesso-abertura');
            if (modalSucesso) modalSucesso.classList.add('show');

            this.resetarFormularioAbertura();
            this.atualizarContadoresMenu();
            this.mostrarToast(`Chamado ${novoChamado.protocolo} registrado com sucesso!`);
        } catch (err) {
            console.error('Falha ao salvar chamado:', err);
            // Preserva os dados do formulário sem resetar para evitar retrabalho do usuário!
            this.mostrarToast(err.message || 'Erro ao registrar chamado no armazenamento local.');
            alert(err.message || 'Erro ao salvar dados.');
        }
    },

    resetarFormularioAbertura() {
        const form = document.getElementById('ticket-registration-form');
        if (form) form.reset();
        this.removerImagemAnexo();
        const banner = document.getElementById('duplicate-warning-banner');
        if (banner) banner.classList.remove('show');
        this.selecionarCategoria('Manutenção', document.querySelector('.category-radio-card'));
        const counter = document.getElementById('form-desc-counter');
        if (counter) counter.textContent = '0 / 400';
    },

    fecharModalSucesso() {
        const modalSucesso = document.getElementById('modal-sucesso-abertura');
        if (modalSucesso) modalSucesso.classList.remove('show');
        this.navegarPara('todos-chamados');
    },

    verChamadoRecemCriado() {
        this.fecharModalSucesso();
        if (this.estado.chamadoRecemCriadoId) {
            this.abrirModalDetalhes(this.estado.chamadoRecemCriadoId);
        }
    },

    /* ======================================================================
       TELA 3: PAINÉIS OPERACIONAIS SETORIAIS (Cozinha, Guarita, Oficina)
       ====================================================================== */
    selecionarAbaSetorial(setor) {
        this.estado.setorPainelAtivo = setor;
        document.querySelectorAll('.sector-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sector === setor);
        });

        const nomesFormatados = {
            'Cozinha': 'Painel: Cozinha — Zeladoria & Higiene Predial',
            'Guarita': 'Painel: Guarita — Vigilância & Risco Imediato',
            'Oficina': 'Painel: Oficina — Manutenção Industrial & Reparos'
        };

        const elLabel = document.getElementById('sector-active-name-label');
        if (elLabel) elLabel.textContent = nomesFormatados[setor] || `Painel: ${setor}`;

        this.renderizarPainelSetorial();
    },

    renderizarPainelSetorial() {
        const setor = this.estado.setorPainelAtivo;
        const container = document.getElementById('sector-cards-container');
        if (!container) return;

        const todosChamados = StorageService.obterTodosChamados();
        // Filtrar por setor ativo e excluir concluídos/cancelados do monitor operacional imediato (ou mantê-los no fim)
        let chamadosDoSetor = todosChamados.filter(t => t.setor === setor);

        // Regra de Ordenação (Requisito 4.2): Prioridade máxima primeiro (Urgente/Risco > Alta > Média > Baixa) e data de abertura
        const pesosPrioridade = { 'Urgente/Risco': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        chamadosDoSetor.sort((a, b) => {
            const pesoA = pesosPrioridade[a.prioridade] || 0;
            const pesoB = pesosPrioridade[b.prioridade] || 0;
            if (pesoB !== pesoA) {
                return pesoB - pesoA;
            }
            return new Date(b.dataAbertura) - new Date(a.dataAbertura);
        });

        // Atualiza contador da aba
        const elCount = document.getElementById('sector-active-count-label');
        if (elCount) elCount.textContent = `${chamadosDoSetor.length} chamados`;

        container.innerHTML = '';

        if (chamadosDoSetor.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--surface-card); border-radius: var(--radius-lg); border: 1px solid var(--surface-border);">
                    <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-light); margin-bottom: 8px;">check_circle</span>
                    <h3 style="color: var(--text-main);">Nenhum chamado pendente no setor ${setor}</h3>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Todas as ordens de serviço deste setor foram atendidas ou concluídas.</p>
                </div>
            `;
            return;
        }

        chamadosDoSetor.forEach(ticket => {
            const estiloStatus = Utils.obterEstiloStatus(ticket.status);
            const estiloPrioridade = Utils.obterEstiloPrioridade(ticket.prioridade);
            const isUrgent = ticket.prioridade === 'Urgente/Risco';

            const card = document.createElement('div');
            card.className = `ticket-operational-card ${isUrgent ? 'is-urgent' : ''}`;

            // LGPD: Não expor nomes completos ou dados sensíveis de pessoas nos painéis públicos
            card.innerHTML = `
                <div class="ticket-card-top">
                    <span class="protocol-badge">${Utils.sanitizarHtml(ticket.protocolo)}</span>
                    <div style="display: flex; gap: 6px;">
                        <span class="badge ${estiloPrioridade.classe}">${estiloPrioridade.rotulo}</span>
                        <span class="badge ${estiloStatus.classe}">${estiloStatus.rotulo}</span>
                    </div>
                </div>

                <div>
                    <h4 class="ticket-card-title">${Utils.sanitizarHtml(ticket.local)}</h4>
                    <p class="ticket-card-desc" style="margin-top: 6px;">${Utils.sanitizarHtml(ticket.descricao)}</p>
                </div>

                <div class="ticket-card-meta">
                    <div class="ticket-card-meta-row">
                        <span><strong>Categoria:</strong> ${Utils.sanitizarHtml(ticket.categoria)}</span>
                        <span><strong>Tempo:</strong> ${Utils.tempoRelativo(ticket.dataAbertura)}</span>
                    </div>
                    <div class="ticket-card-meta-row" style="margin-top: 4px;">
                        <span><strong>Equipe:</strong> ${Utils.sanitizarHtml(ticket.responsavelAtual || 'Não atribuído')}</span>
                        <span style="font-size: 11px; color: var(--text-light);">LGPD Protegido</span>
                    </div>
                </div>

                <div class="ticket-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="App.abrirModalDetalhes('${ticket.id}')">
                        <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                        <span>Detalhes</span>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="App.abrirModalAlterarStatus('${ticket.id}')">
                        <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                        <span>Atendimento</span>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /* ======================================================================
       TELA 4: TODOS OS CHAMADOS (TABELA DO GESTOR)
       ====================================================================== */
    renderizarTabelaGestao() {
        const tbody = document.getElementById('tickets-table-tbody');
        if (!tbody) return;

        const todosChamados = StorageService.obterTodosChamados();
        const filtrados = this.obterChamadosFiltrados(todosChamados);

        tbody.innerHTML = '';

        if (filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-light);">
                        Nenhum chamado corresponde aos filtros selecionados.
                    </td>
                </tr>
            `;
            return;
        }

        filtrados.forEach(ticket => {
            const estiloStatus = Utils.obterEstiloStatus(ticket.status);
            const estiloPrioridade = Utils.obterEstiloPrioridade(ticket.prioridade);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong class="protocol-badge">${Utils.sanitizarHtml(ticket.protocolo)}</strong></td>
                <td>${Utils.sanitizarHtml(ticket.categoria)}</td>
                <td><span style="font-weight: 600;">${Utils.sanitizarHtml(ticket.local)}</span></td>
                <td><span class="badge" style="background-color: var(--surface-low); color: var(--text-main);">${Utils.sanitizarHtml(ticket.setor)}</span></td>
                <td><span class="badge ${estiloPrioridade.classe}">${estiloPrioridade.rotulo}</span></td>
                <td>${Utils.formatarDataHora(ticket.dataAbertura)}</td>
                <td><span class="badge ${estiloStatus.classe}">${estiloStatus.rotulo}</span></td>
                <td style="text-align: right;">
                    <div class="table-action-btns" style="justify-content: flex-end;">
                        <button class="btn-icon-table" title="Visualizar Detalhes" onclick="App.abrirModalDetalhes('${ticket.id}')">
                            <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
                        </button>
                        <button class="btn-icon-table" title="Alterar Status / Redirecionar" onclick="App.abrirModalAlterarStatus('${ticket.id}')">
                            <span class="material-symbols-outlined" style="font-size: 18px;">sync_alt</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    obterChamadosFiltrados(chamados) {
        const setor = document.getElementById('filtro-setor') ? document.getElementById('filtro-setor').value : 'TODOS';
        const status = document.getElementById('filtro-status') ? document.getElementById('filtro-status').value : 'TODOS';
        const prioridade = document.getElementById('filtro-prioridade') ? document.getElementById('filtro-prioridade').value : 'TODOS';
        const busca = document.getElementById('filtro-busca') ? document.getElementById('filtro-busca').value.toLowerCase().trim() : '';

        return chamados.filter(t => {
            if (setor !== 'TODOS' && t.setor !== setor) return false;
            if (status !== 'TODOS' && t.status !== status) return false;
            if (prioridade !== 'TODOS' && t.prioridade !== prioridade) return false;
            if (busca) {
                const buscaEm = (t.protocolo + ' ' + t.local + ' ' + t.descricao).toLowerCase();
                if (!buscaEm.includes(busca)) return false;
            }
            return true;
        });
    },

    aplicarFiltrosTabela() {
        this.renderizarTabelaGestao();
    },

    /* ======================================================================
       TELA 5: INDICADORES GERENCIAIS (TMA, TMR, MÉTRICAS REAIS)
       ====================================================================== */
    renderizarIndicadores() {
        const chamados = StorageService.obterTodosChamados();

        // 1. Cálculo real de TMA e TMR
        const tmaResult = Utils.calcularTMA(chamados);
        const tmrResult = Utils.calcularTMR(chamados);

        this.definirTextoSeguro('indicador-tma-valor', tmaResult.textoFormatado);
        this.definirTextoSeguro('indicador-tmr-valor', tmrResult.textoFormatado);

        // 2. Gráfico/Lista por Prioridade
        const prioridadesList = document.getElementById('indicadores-prioridade-list');
        if (prioridadesList) {
            prioridadesList.innerHTML = '';
            const niveis = ['Urgente/Risco', 'Alta', 'Média', 'Baixa'];
            const total = chamados.length || 1;

            niveis.forEach(nivel => {
                const qtd = chamados.filter(t => t.prioridade === nivel).length;
                const pct = Math.round((qtd / total) * 100);
                const estilo = Utils.obterEstiloPrioridade(nivel);

                const item = document.createElement('div');
                item.className = 'sector-progress-item';
                item.innerHTML = `
                    <div class="sector-progress-label">
                        <span><span class="badge ${estilo.classe}">${estilo.rotulo}</span></span>
                        <span>${qtd} ocorrências (${pct}%)</span>
                    </div>
                    <div class="sector-progress-bar-bg">
                        <div class="sector-progress-bar-fill" style="width: ${pct}%; background-color: var(--primary-container);"></div>
                    </div>
                `;
                prioridadesList.appendChild(item);
            });
        }

        // 3. Taxa de Conclusão / Eficiência
        const concluidos = chamados.filter(t => t.status === 'Concluído').length;
        const taxa = chamados.length > 0 ? Math.round((concluidos / chamados.length) * 100) : 0;
        this.definirTextoSeguro('indicador-taxa-resolucao', `${taxa}%`);
        const elBarra = document.getElementById('indicador-taxa-bar');
        if (elBarra) elBarra.style.width = `${taxa}%`;
    },

    /* ======================================================================
       TELA 6: HISTÓRICO DE AUDITORIA (LOGS IMUTÁVEIS)
       ====================================================================== */
    renderizarAuditoriaGlobal() {
        const container = document.getElementById('audit-timeline-global');
        if (!container) return;

        const logs = StorageService.obterLogsAuditoria();
        container.innerHTML = '';

        if (logs.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); padding: 24px; text-align: center;">Nenhum registro de auditoria disponível.</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'audit-item';

            item.innerHTML = `
                <div class="audit-node-dot"></div>
                <div class="audit-header">
                    <div>
                        <span class="protocol-badge">${Utils.sanitizarHtml(log.protocolo)}</span>
                        <strong style="margin-left: 8px; color: var(--text-main); font-size: 14px;">
                            ${log.statusAnterior ? `Transição: ${Utils.sanitizarHtml(log.statusAnterior)} ➔ ${Utils.sanitizarHtml(log.novoStatus)}` : `Criação do Chamado: ${Utils.sanitizarHtml(log.novoStatus)}`}
                        </strong>
                    </div>
                    <span class="audit-date">${Utils.formatarDataHora(log.dataHora)}</span>
                </div>
                <div class="audit-body">
                    <p><strong>Local:</strong> ${Utils.sanitizarHtml(log.local)} • <strong>Setor:</strong> ${Utils.sanitizarHtml(log.setor)}</p>
                    <p><strong>Responsável pela Operação:</strong> ${Utils.sanitizarHtml(log.responsavel)}</p>
                    <div class="audit-justification-box">
                        "${Utils.sanitizarHtml(log.justificativa)}"
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    },

    /* ======================================================================
       MODAIS E AÇÕES: ALTERAÇÃO DE STATUS & DETALHES
       ====================================================================== */
    abrirModalAlterarStatus(id) {
        const chamado = StorageService.obterChamadoPorId(id);
        if (!chamado) return;

        this.estado.chamadoSelecionadoId = chamado.id;
        document.getElementById('modal-ticket-id-hidden').value = chamado.id;
        document.getElementById('modal-status-protocol-title').textContent = `Atualizar ${chamado.protocolo}`;
        document.getElementById('modal-novo-status').value = chamado.status;
        document.getElementById('modal-novo-setor').value = '';
        document.getElementById('modal-justificativa').value = '';

        // Preenche o select de responsáveis com os operadores do setor atual
        this.atualizarOpcoesResponsavelModal(chamado.setor);

        const modal = document.getElementById('modal-alterar-status');
        if (modal) modal.classList.add('show');
    },

    /**
     * Atualiza as opções do <select id="modal-responsavel"> conforme o setor selecionado.
     * Prioridade 2 — Responsáveis organizados por setor.
     */
    atualizarOpcoesResponsavelModal(setorEscolhido) {
        const id = this.estado.chamadoSelecionadoId;
        const chamado = id ? StorageService.obterChamadoPorId(id) : null;
        const setor = setorEscolhido || (chamado ? chamado.setor : 'Oficina');
        const select = document.getElementById('modal-responsavel');
        if (!select) return;

        const operadores = Utils.obterOperadoresPorSetor(setor);
        select.innerHTML = '<option value="">Selecione o operador responsável...</option>';

        operadores.forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            if (chamado && chamado.responsavelAtual === op) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        // Opção genérica adicional identificada por setor
        const optOutro = document.createElement('option');
        optOutro.value = `Técnico de Plantão (${setor})`;
        optOutro.textContent = `Técnico de Plantão (${setor})`;
        if (chamado && chamado.responsavelAtual === optOutro.value) {
            optOutro.selected = true;
        }
        select.appendChild(optOutro);
    },

    fecharModalStatus() {
        const modal = document.getElementById('modal-alterar-status');
        if (modal) modal.classList.remove('show');
    },

    salvarAlteracaoStatus(e) {
        e.preventDefault();
        const id = document.getElementById('modal-ticket-id-hidden').value;
        const novoStatus = document.getElementById('modal-novo-status').value;
        const novoSetor = document.getElementById('modal-novo-setor').value;
        const responsavel = document.getElementById('modal-responsavel').value.trim();
        const justificativa = document.getElementById('modal-justificativa').value.trim();

        // 1. Validação de seleção obrigatória de responsável
        if (!responsavel) {
            alert('Selecione o operador ou técnico responsável pelo atendimento.');
            return;
        }

        // 2. Justificativa Obrigatória (Requisito 4.3 e Regra de Negócio 6 e 7)
        if (!justificativa) {
            alert('A justificativa da alteração de status é estritamente obrigatória para conformidade e auditoria.');
            return;
        }

        try {
            const atualizado = StorageService.atualizarStatusChamado(id, {
                novoStatus,
                novoSetor: novoSetor || undefined,
                responsavel,
                justificativa
            });

            if (atualizado) {
                this.fecharModalStatus();
                this.mostrarToast(`Chamado ${atualizado.protocolo} atualizado para "${novoStatus}"!`);
                this.atualizarContadoresMenu();

                // Re-renderizar tela ativa
                if (this.estado.visaoAtual === 'todos-chamados') this.renderizarTabelaGestao();
                if (this.estado.visaoAtual === 'paineis-operacionais') this.renderizarPainelSetorial();
                if (this.estado.visaoAtual === 'dashboard') this.renderizarDashboard();
                if (this.estado.visaoAtual === 'auditoria') this.renderizarAuditoriaGlobal();
            }
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            this.mostrarToast(err.message || 'Erro ao registrar atualização no armazenamento.');
            alert(err.message || 'Erro ao gravar dados.');
        }
    },

    abrirModalDetalhes(id) {
        const chamado = StorageService.obterChamadoPorId(id);
        if (!chamado) return;

        this.estado.chamadoSelecionadoId = chamado.id;
        const elProtocolo = document.getElementById('modal-detalhe-protocolo');
        const elCategoriaSetor = document.getElementById('modal-detalhe-categoria-setor');
        const conteudo = document.getElementById('modal-detalhes-conteudo');

        if (elProtocolo) elProtocolo.textContent = chamado.protocolo;
        if (elCategoriaSetor) elCategoriaSetor.textContent = `${chamado.categoria} • Setor: ${chamado.setor}`;

        const estiloStatus = Utils.obterEstiloStatus(chamado.status);
        const estiloPrioridade = Utils.obterEstiloPrioridade(chamado.prioridade);

        // Validação estrita da imagem antes de renderizar (Prioridade 1 — Item 6)
        let blocoImagemHtml = '';
        if (chamado.imagemUrl) {
            if (Utils.validarUrlImagemSegura(chamado.imagemUrl)) {
                blocoImagemHtml = `<div style="margin-top: 10px;"><img src="${chamado.imagemUrl}" alt="Evidência Fotográfica Validada" style="max-height: 140px; border-radius: 8px; border: 1px solid var(--surface-border); object-fit: contain;"></div>`;
            } else {
                blocoImagemHtml = `<div style="margin-top: 8px; font-size: 11px; color: var(--danger);"><span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">warning</span> Anexo bloqueado por formato ou codificação insegura.</div>`;
            }
        }

        // Construção segura do DOM para proteção contra XSS
        conteudo.innerHTML = `
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <span class="badge ${estiloPrioridade.classe}">${estiloPrioridade.rotulo}</span>
                <span class="badge ${estiloStatus.classe}">${estiloStatus.rotulo}</span>
            </div>

            <div style="background-color: var(--surface-low); padding: 16px; border-radius: var(--radius-md); margin-bottom: 18px;">
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">${Utils.sanitizarHtml(chamado.local)}</h4>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">${Utils.sanitizarHtml(chamado.descricao)}</p>
                ${blocoImagemHtml}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; margin-bottom: 20px;">
                <div><strong>Aberto em:</strong> ${Utils.formatarDataHora(chamado.dataAbertura)} (${Utils.tempoRelativo(chamado.dataAbertura)})</div>
                <div><strong>Início Atendimento:</strong> ${chamado.dataInicioAtendimento ? Utils.formatarDataHora(chamado.dataInicioAtendimento) : 'Aguardando'}</div>
                <div><strong>Concluído em:</strong> ${chamado.dataConclusao ? Utils.formatarDataHora(chamado.dataConclusao) : 'Em aberto'}</div>
                <div><strong>Equipe / Operador:</strong> ${Utils.sanitizarHtml(chamado.responsavelAtual || 'Não atribuído')}</div>
            </div>

            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid var(--surface-border-subtle); padding-bottom: 6px;">
                Linha do Tempo de Auditoria Deste Chamado
            </h4>
            <div class="audit-timeline" style="padding-left: 20px;">
                ${chamado.historico ? chamado.historico.map(h => `
                    <div class="audit-item" style="padding: 10px 14px; margin-bottom: 8px;">
                        <div class="audit-node-dot" style="left: -20px; width: 12px; height: 12px;"></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <strong>${Utils.sanitizarHtml(h.novoStatus)}</strong>
                            <span style="color: var(--text-light);">${Utils.formatarDataHora(h.dataHora)}</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Resp: ${Utils.sanitizarHtml(h.responsavel)}</p>
                        <div class="audit-justification-box" style="margin-top: 4px; font-size: 12px;">"${Utils.sanitizarHtml(h.justificativa)}"</div>
                    </div>
                `).join('') : '<p style="font-size: 12px; color: var(--text-light);">Nenhum histórico registrado.</p>'}
            </div>
        `;

        const modal = document.getElementById('modal-detalhes-chamado');
        if (modal) modal.classList.add('show');
    },

    fecharModalDetalhes() {
        const modal = document.getElementById('modal-detalhes-chamado');
        if (modal) modal.classList.remove('show');
    },

    abrirModalStatusDoDetalhe() {
        this.fecharModalDetalhes();
        if (this.estado.chamadoSelecionadoId) {
            this.abrirModalAlterarStatus(this.estado.chamadoSelecionadoId);
        }
    },

    /* ======================================================================
       MODO TELÃO / KIOSK & RESET
       ====================================================================== */
    alternarModoTelao() {
        this.estado.isModoTelao = !this.estado.isModoTelao;
        document.body.classList.toggle('kiosk-mode', this.estado.isModoTelao);

        if (this.estado.isModoTelao) {
            this.mostrarToast('Modo Telão ativado (ideal para monitores de parede)');
            if (this.estado.visaoAtual !== 'paineis-operacionais') {
                this.navegarPara('paineis-operacionais');
            }
        } else {
            this.mostrarToast('Modo Telão desativado');
        }
    },

    toggleMenuMobile() {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-open');
    },

    abrirModalReset() {
        const modal = document.getElementById('modal-reset-confirm');
        if (modal) modal.classList.add('show');
    },

    fecharModalReset() {
        const modal = document.getElementById('modal-reset-confirm');
        if (modal) modal.classList.remove('show');
    },

    confirmarResetDados() {
        StorageService.resetarDados();
        this.fecharModalReset();
        this.mostrarToast('Dados de demonstração restaurados com sucesso!');
        this.atualizarContadoresMenu();
        this.navegarPara(this.estado.visaoAtual);
    },

    /* ======================================================================
       UTILITÁRIOS DE INTERFACE
       ====================================================================== */
    definirTextoSeguro(elementId, texto) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = texto;
    },

    mostrarToast(mensagem) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--secondary-light);">info</span>
            <span>${Utils.sanitizarHtml(mensagem)}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Dispara a inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
