/**
 * EAM SENAI — Sistema de Gestão de Manutenção e Chamados Internos
 * Funções Utilitárias, Cálculos e Validações (utils.js)
 */

const STOP_WORDS_PT = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
    'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'pro',
    'com', 'sem', 'sob', 'sobre', 'ante', 'apos', 'ate', 'desde',
    'e', 'ou', 'mas', 'porem', 'contudo', 'todavia', 'que', 'se',
    'ao', 'aos', 'foi', 'tem', 'esta', 'estao', 'ha', 'muito', 'muita',
    'pelo', 'nosso', 'nossa', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela'
]);

// Lista de Operadores Fictícios Organizados por Setor (Prioridade 2)
const OPERADORES_POR_SETOR = {
    'Cozinha': [
        'Carlos Alberto — Zeladoria e Limpeza Predial',
        'Mariana Souza — Inspetora de Higiene Técnica',
        'Lucas Ferraz — Apoio Operacional Refeitório',
        'Equipe de Higienização e Desengraxe'
    ],
    'Guarita': [
        'Marcos Vinícius — Vigilante Patrimonial N1',
        'Roberto Almeida — Operador de CFTV e Perímetro',
        'Sgt. Silva — Líder de Pronta Resposta',
        'Plantão de Segurança Eletrônica'
    ],
    'Oficina': [
        'João Paulo — Eletromecânico N2',
        'Ricardo Mendes — Técnico de Usinagem e CNC',
        'Fernando Costa — Especialista Hidráulico N2',
        'Equipe de Manutenção Geral e Reparos'
    ]
};

const Utils = {
    /**
     * Mapeamento de Categoria para Setor Inicial (Regra de Negócio 4.1)
     */
    mapearSetorInicial(categoria) {
        switch (categoria) {
            case 'Manutenção':
                return 'Oficina';
            case 'Zeladoria':
                return 'Cozinha';
            case 'Vigilância':
                return 'Guarita';
            case 'Risco':
                return 'Guarita'; // Direcionamento inicial do protótipo com alerta máximo
            default:
                return 'Oficina';
        }
    },

    /**
     * Remove acentos e converte para minúsculas.
     */
    normalizarTexto(texto) {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Extrai palavras relevantes (tokens de mais de 3 letras excluindo stop words).
     */
    extrairPalavrasRelevantes(texto) {
        const textoNormalizado = this.normalizarTexto(texto);
        return textoNormalizado
            .split(' ')
            .filter(palavra => palavra.length >= 3 && !STOP_WORDS_PT.has(palavra));
    },

    /**
     * Detecção de Possíveis Duplicidades (Seção 6 dos Requisitos)
     * Critérios:
     * 1. Comparar chamados que ainda estejam abertos ou em atendimento.
     * 2. Verificar se possuem o mesmo local (ou contêm o mesmo local).
     * 3. Comparar palavras relevantes das descrições.
     * 4. Considerar duplicidade quando houver pelo menos 2 palavras relevantes em comum.
     * 5. Ignorar palavras comuns.
     * 6. Retorna lista de chamados duplicados com seus protocolos.
     *
     * @param {string} localInformado
     * @param {string} descricaoInformada
     * @param {Array} listaChamados
     * @param {string} [ignorarId] - Se for edição, ignora a si mesmo
     * @returns {Array} Chamados com possível duplicidade
     */
    detectarDuplicidades(localInformado, descricaoInformada, listaChamados, ignorarId = null) {
        if (!localInformado || !descricaoInformada || !Array.isArray(listaChamados)) {
            return [];
        }

        const localNorm = this.normalizarTexto(localInformado);
        const palavrasDescricao = new Set(this.extrairPalavrasRelevantes(descricaoInformada));

        if (palavrasDescricao.size === 0) return [];

        const duplicados = [];

        listaChamados.forEach(ticket => {
            // Regra 1: Apenas chamados 'Aberto' ou 'Em Atendimento'
            if (ticket.status !== 'Aberto' && ticket.status !== 'Em Atendimento') {
                return;
            }

            if (ignorarId && ticket.id === ignorarId) {
                return;
            }

            // Regra 2: Mesmo local (ou correspondência mútua de substrings)
            const localExistenteNorm = this.normalizarTexto(ticket.local);
            const mesmoLocal = localExistenteNorm.includes(localNorm) || localNorm.includes(localExistenteNorm);

            if (!mesmoLocal) {
                return;
            }

            // Regra 3, 4 e 5: Pelo menos 2 palavras relevantes em comum
            const palavrasExistentes = this.extrairPalavrasRelevantes(ticket.descricao);
            const palavrasEmComum = palavrasExistentes.filter(p => palavrasDescricao.has(p));

            if (palavrasEmComum.length >= 2) {
                duplicados.push({
                    ticket,
                    palavrasEmComum: [...new Set(palavrasEmComum)]
                });
            }
        });

        return duplicados;
    },

    /**
     * Calcula o TMA (Tempo Médio de Atendimento)
     * Intervalo entre a abertura e o início do atendimento.
     * TMA = média de (dataInicioAtendimento - dataAbertura)
     * Descarta registros cancelados, sem início ou com datas corrompidas.
     * @param {Array} chamados 
     * @returns {{ minutos: number|null, textoFormatado: string }}
     */
    calcularTMA(chamados) {
        if (!Array.isArray(chamados) || chamados.length === 0) {
            return { minutos: null, textoFormatado: 'Sem dados suficientes' };
        }

        const chamadosValidos = chamados.filter(t => {
            if (!t || t.status === 'Cancelado') return false;
            if (!t.dataAbertura || !t.dataInicioAtendimento) return false;
            const inicio = new Date(t.dataInicioAtendimento).getTime();
            const abertura = new Date(t.dataAbertura).getTime();
            return !isNaN(inicio) && !isNaN(abertura) && inicio >= abertura;
        });

        if (chamadosValidos.length === 0) {
            return { minutos: null, textoFormatado: 'Sem dados suficientes' };
        }

        const somaMinutos = chamadosValidos.reduce((acum, t) => {
            const inicio = new Date(t.dataInicioAtendimento).getTime();
            const abertura = new Date(t.dataAbertura).getTime();
            const diffMinutos = (inicio - abertura) / (1000 * 60);
            return acum + diffMinutos;
        }, 0);

        const mediaMinutos = Math.round(somaMinutos / chamadosValidos.length);
        return {
            minutos: mediaMinutos,
            textoFormatado: this.formatarDuracao(mediaMinutos)
        };
    },

    /**
     * Calcula o TMR (Tempo Médio de Resolução)
     * Intervalo entre a abertura e a conclusão.
     * TMR = média de (dataConclusao - dataAbertura)
     * Apenas chamados efetivamente concluídos com datas válidas entram no cômputo.
     * @param {Array} chamados 
     * @returns {{ minutos: number|null, textoFormatado: string }}
     */
    calcularTMR(chamados) {
        if (!Array.isArray(chamados) || chamados.length === 0) {
            return { minutos: null, textoFormatado: 'Sem dados suficientes' };
        }

        const chamadosValidos = chamados.filter(t => {
            if (!t || t.status !== 'Concluído') return false;
            if (!t.dataAbertura || !t.dataConclusao) return false;
            const conclusao = new Date(t.dataConclusao).getTime();
            const abertura = new Date(t.dataAbertura).getTime();
            return !isNaN(conclusao) && !isNaN(abertura) && conclusao >= abertura;
        });

        if (chamadosValidos.length === 0) {
            return { minutos: null, textoFormatado: 'Sem dados suficientes' };
        }

        const somaMinutos = chamadosValidos.reduce((acum, t) => {
            const conclusao = new Date(t.dataConclusao).getTime();
            const abertura = new Date(t.dataAbertura).getTime();
            const diffMinutos = (conclusao - abertura) / (1000 * 60);
            return acum + diffMinutos;
        }, 0);

        const mediaMinutos = Math.round(somaMinutos / chamadosValidos.length);
        return {
            minutos: mediaMinutos,
            textoFormatado: this.formatarDuracao(mediaMinutos)
        };
    },

    /**
     * Formata minutos em string humanizada legível (ex: "1h 45min" ou "25 min").
     */
    formatarDuracao(minutosTotais) {
        if (minutosTotais === null || isNaN(minutosTotais)) {
            return 'Sem dados suficientes';
        }

        if (minutosTotais < 1) {
            return '< 1 min';
        }

        const horas = Math.floor(minutosTotais / 60);
        const minutos = minutosTotais % 60;

        if (horas === 0) {
            return `${minutos} min`;
        }

        return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    },

    /**
     * Retorna o tempo decorrido relativo amigável (ex: "há 15 min", "há 2 horas").
     */
    tempoRelativo(dataIso) {
        if (!dataIso) return '-';
        const diffMs = Date.now() - new Date(dataIso).getTime();
        const diffSeg = Math.floor(diffMs / 1000);

        if (diffSeg < 60) return 'há instantes';
        const diffMin = Math.floor(diffSeg / 60);
        if (diffMin < 60) return `há ${diffMin} min`;
        const diffHoras = Math.floor(diffMin / 60);
        if (diffHoras < 24) return `há ${diffHoras}h ${diffMin % 60 > 0 ? `${diffMin % 60}m` : ''}`;
        const diffDias = Math.floor(diffHoras / 24);
        return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
    },

    /**
     * Formata data para exibição completa em pt-BR.
     */
    formatarDataHora(dataIso) {
        if (!dataIso) return '-';
        const data = new Date(dataIso);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Escapa caracteres perigosos para proteção contra XSS (LGPD / Segurança).
     */
    sanitizarHtml(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Retorna a cor/classe de badge associada à prioridade.
     */
    obterEstiloPrioridade(prioridade) {
        switch (prioridade) {
            case 'Urgente/Risco':
                return {
                    classe: 'badge-urgente',
                    rotulo: '🚨 Urgente / Risco',
                    icone: 'crisis_alert'
                };
            case 'Alta':
                return {
                    classe: 'badge-alta',
                    rotulo: 'Alta',
                    icone: 'priority_high'
                };
            case 'Média':
                return {
                    classe: 'badge-media',
                    rotulo: 'Média',
                    icone: 'remove'
                };
            case 'Baixa':
            default:
                return {
                    classe: 'badge-baixa',
                    rotulo: 'Baixa',
                    icone: 'arrow_downward'
                };
        }
    },

    /**
     * Retorna a cor/classe de badge associada ao status.
     */
    obterEstiloStatus(status) {
        switch (status) {
            case 'Aberto':
                return { classe: 'badge-aberto', rotulo: 'Aberto', icone: 'fiber_new' };
            case 'Em Atendimento':
                return { classe: 'badge-atendimento', rotulo: 'Em Atendimento', icone: 'sync' };
            case 'Concluído':
                return { classe: 'badge-concluido', rotulo: 'Concluído', icone: 'check_circle' };
            case 'Cancelado':
                return { classe: 'badge-cancelado', rotulo: 'Cancelado', icone: 'cancel' };
            default:
                return { classe: 'badge-default', rotulo: status, icone: 'info' };
        }
    },

    /**
     * Retorna a lista de operadores fictícios disponíveis para um determinado setor.
     * @param {string} setor 
     * @returns {Array<string>}
     */
    obterOperadoresPorSetor(setor) {
        return OPERADORES_POR_SETOR[setor] || [
            'Equipe Técnica Geral',
            'Plantão de Manutenção'
        ];
    },

    /**
     * Valida se a URL de imagem é estritamente segura e permitida (Base64 JPEG, PNG, WebP).
     * Previne injeções de javascript:, data:html, scripts ou URLs inseguras.
     * @param {string} url 
     * @returns {boolean}
     */
    validarUrlImagemSegura(url) {
        if (!url || typeof url !== 'string') return false;
        const urlLimpa = url.trim();
        // Permite estritamente Data URLs nos formatos MIME seguros e válidos
        const padraoSeguro = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
        return padraoSeguro.test(urlLimpa);
    }
};

// Exporta globalmente para compatibilidade com navegadores e testes
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.OPERADORES_POR_SETOR = OPERADORES_POR_SETOR;
}
if (typeof global !== 'undefined') {
    global.Utils = Utils;
    global.OPERADORES_POR_SETOR = OPERADORES_POR_SETOR;
}
