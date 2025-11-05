// Configurações da aplicação
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000',
    TOAST_DURATION: 4000,
    MIN_CHARS: 10
};

// Casos de exemplo do arquivo incidentes.txt
const SAMPLE_CASES = [
    {
        id: 1,
        ticket: "Máquina Virtual - Exclusão - RITM0209089\nMáquina Virtual - Exclusão - Após OK do time de Canais, vamos proceder com a exclusão dos servidores alocados para hospedar o Ecommerce legado.",
        analystResponse: "Realizado ajuste no monitoramento, conforme solicitado."
    },
    {
        id: 2,
        ticket: "INC0047438\nDevido a conflito com o Free-IPA estamos acessando o ambiente do Rede Unna com usuário root, porém parece que a senha está expirada.\nbrdtcjbs40 - 172.18.6.142\nbrdtcjbs41 - 172.18.6.143\nbrdtcjbs42 - 172.18.6.144\nbrdtcjbs43 - 172.18.6.145",
        analystResponse: "reset de senha nos servidores realizado com sucesso."
    },
    {
        id: 3,
        ticket: "PNG-SRVAPP3 - Cliente Rochalog\nCliente Rochalog solicita a análise detalhada para verificar a intermitência do alerta abaixo:\n\nPNG-SRVAPP3 - 172.16.0.173 - ROCHALOG | Utilização de memória acima de 95% (Total de 32 GB)",
        analystResponse: "Monitoração\n\nTask#1 - 61600 - Alterar Threshold de monitoração - Concluído em 31.10.2025\n\nTask#2 - 61603 - Solicitar ajuste na monitoração do servidor PNG-SRVAPP3, para que seja exibido os ofensores que estão consumindo mais recursos.\n\nData Alvo: 06/11/2025"
    },
    {
        id: 4,
        ticket: "Lentidão nos processos do SAP ECC Produção\nPRB sendo aberto para verificar qual foi a causa raiz que causou lentidão nos processos do SAP ECC Produção.\n\nTicket de crise: 19862\nTicket técnico: 19812",
        analystResponse: "Task #3 - SODIMAC - Análise das queries em execução no momento da ocorrência do problema.\n\nRealizar análise das queries em execução no momento da ocorrência do problema, a fim de identificar possíveis gargalos de desempenho, consultas mal otimizadas ou fatores que tenham contribuído para a instabilidade do sistema."
    },
    {
        id: 5,
        ticket: "Backlog 4biz #505 - Análise e Ajuste de Alertas de GAP Sync Delay – Hosts MRB (PRD-PSAM-PDB e PRD-PSAM-CBD)\nPrezados,\n\nFoi identificado que, diariamente, entre o período das 02:10 e 02:50, os hosts MRB - PRD-PSAM-PDB e MRB - PRD-PSAM-CBD disparam alertas de GAP sync delay in DR database.\n\nEmbora os DBAs sejam acionados e orientem a desconsiderar esses alertas, o comportamento persiste, gerando incidentes recorrentes e demandando ações desnecessárias.\n\nPara resolução da falha, sugerimos as seguintes ações:\n\nUma breve verificação técnica para confirmar se há algum impacto operacional real por trás desses alertas.\nUma análise com o objetivo de avaliar a necessidade de ajuste da criticidade dos alertas, ou a programação de uma janela de manutenção no Zabbix, nos períodos informados, caso se mostre adequado.\n\nAgradecemos pela atenção e permanecemos à disposição.",
        analystResponse: "Análise de Eficácia\n\nData Alvo: 03/11/2025\n\nAnálise de eficácia concluída com sucesso."
    },
    {
        id: 6,
        ticket: "Backlog 4biz #529 - Indisponibilidade do Proxy - Cliente Randon\nProblema aberto para análise de causa raiz relacionada à crise de Indisponibilidade do Proxy - Cliente Randon\nA análise deverá ser realizada pela equipe de Linux e Cloud",
        analystResponse: "Linux - Randon - Ajustar a memória RAM para 16GB e a memória Swap para 8/16GB conforme recomendado pelo fornecedor.\n\nAjustar a memória para comportar as requisições do Zabbix Proxy.\n\nAtividade a combinar com a Randon, pois dever gerar indisponibilidade da VM e consequentemente do monitoramento."
    }
];

// Estado da aplicação
let currentState = {
    isEvaluating: false,
    lastEvaluation: null,
    currentCaseIndex: 0
};

// Elementos DOM
const elements = {
    ticketInput: document.getElementById('ticket-input'),
    analystResponse: document.getElementById('analyst-response'),
    evaluateBtn: document.getElementById('evaluate-btn'),
    refreshCase: document.getElementById('refresh-case'),
    resultsSection: document.getElementById('results-section'),
    aiSuggestedResponse: document.getElementById('ai-suggested-response'),
    evaluationScore: document.getElementById('evaluation-score'),
    aiLoading: document.getElementById('ai-loading'),
    scoreLoading: document.getElementById('score-loading'),
    loadingOverlay: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Verificar se a API está online
    checkAPIHealth();
    
    // Carregar primeiro caso
    loadRandomCase();
}

function setupEventListeners() {
    // Botão avaliar
    elements.evaluateBtn.addEventListener('click', handleEvaluation);
    
    // Botão refresh
    elements.refreshCase.addEventListener('click', loadRandomCase);
    
    // Fechar loading com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !elements.loadingOverlay.classList.contains('hidden')) {
            // Não permitir fechar durante avaliação
            if (!currentState.isEvaluating) {
                hideLoadingOverlay();
            }
        }
    });
}

// Carregar caso aleatório
function loadRandomCase() {
    // Selecionar caso aleatório diferente do atual
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * SAMPLE_CASES.length);
    } while (newIndex === currentState.currentCaseIndex && SAMPLE_CASES.length > 1);
    
    currentState.currentCaseIndex = newIndex;
    const selectedCase = SAMPLE_CASES[newIndex];
    
    // Preencher campos
    elements.ticketInput.value = selectedCase.ticket;
    elements.analystResponse.value = selectedCase.analystResponse;
    
    // Ocultar resultados anteriores
    elements.resultsSection.classList.add('hidden');
    
    // Feedback visual
    showToast(`Caso ${selectedCase.id} carregado!`, 'success', 'fas fa-sync-alt');
    
    // Animação no botão refresh
    const refreshIcon = elements.refreshCase.querySelector('i');
    refreshIcon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshIcon.style.transform = 'rotate(0deg)';
    }, 300);
}

// Verificar saúde da API
async function checkAPIHealth() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('API Status:', data);
            if (data.status === 'healthy') {
                showToast('API conectada com sucesso!', 'success', 'fas fa-check-circle');
            } else {
                showToast('API com problemas de conexão', 'warning', 'fas fa-exclamation-triangle');
            }
        } else {
            throw new Error('API não respondeu');
        }
    } catch (error) {
        console.error('Erro ao conectar com API:', error);
        showToast('Erro ao conectar com a API. Verifique se o servidor está rodando.', 'error', 'fas fa-times-circle');
    }
}

// Função principal de avaliação
async function handleEvaluation() {
    const ticket = elements.ticketInput.value.trim();
    const analystResponse = elements.analystResponse.value.trim();
    
    // Validações
    if (!ticket) {
        showToast('Por favor, descreva o ticket/incidente', 'warning', 'fas fa-exclamation-triangle');
        elements.ticketInput.focus();
        return;
    }
    
    if (!analystResponse) {
        showToast('Por favor, insira a resposta do analista', 'warning', 'fas fa-exclamation-triangle');
        elements.analystResponse.focus();
        return;
    }
    
    if (ticket.length < CONFIG.MIN_CHARS) {
        showToast(`Ticket deve ter no mínimo ${CONFIG.MIN_CHARS} caracteres`, 'warning', 'fas fa-exclamation-triangle');
        return;
    }
    
    if (analystResponse.length < CONFIG.MIN_CHARS) {
        showToast(`Resposta do analista deve ter no mínimo ${CONFIG.MIN_CHARS} caracteres`, 'warning', 'fas fa-exclamation-triangle');
        return;
    }
    
    // Iniciar avaliação
    currentState.isEvaluating = true;
    showLoadingOverlay();
    disableForm();
    
    try {
        // Mostrar seção de resultados e loadings
        elements.resultsSection.classList.remove('hidden');
        elements.aiLoading.classList.remove('hidden');
        elements.scoreLoading.classList.remove('hidden');
        
        // Limpar resultados anteriores
        elements.aiSuggestedResponse.innerHTML = '';
        elements.evaluationScore.innerHTML = '';
        
        // Fazer requisição para a API
        const response = await fetch(`${CONFIG.API_BASE_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticket: ticket,
                analyst_response: analystResponse
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro na API');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar resultados
            displayResults(data);
            showToast('Avaliação concluída com sucesso!', 'success', 'fas fa-check-circle');
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('Erro na avaliação:', error);
        showToast(`Erro na avaliação: ${error.message}`, 'error', 'fas fa-times-circle');
        
        // Ocultar seção de resultados em caso de erro
        elements.resultsSection.classList.add('hidden');
        
    } finally {
        currentState.isEvaluating = false;
        hideLoadingOverlay();
        enableForm();
        
        // Ocultar loadings
        elements.aiLoading.classList.add('hidden');
        elements.scoreLoading.classList.add('hidden');
    }
}

// Exibir resultados da avaliação
function displayResults(data) {
    // Resposta sugerida pela IA
    elements.aiSuggestedResponse.innerHTML = `
        <div style="line-height: 1.6; color: #495057; font-size: 14px;">
            ${data.ai_suggested_response.replace(/\n/g, '<br>')}
        </div>
    `;
    
    // Score e avaliação
    const evaluation = data.evaluation;
    const scoreColor = getScoreColor(evaluation.score);
    const evaluationFormatted = formatEvaluation(evaluation.detailed_evaluation);
    
    elements.evaluationScore.innerHTML = `
        <div class="score-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <div class="score-value" style="color: ${scoreColor}; font-size: 28px; font-weight: 700;">
                ${evaluation.score}/100
            </div>
            <div>
                <div style="font-weight: 600; color: #495057;">Nível de Qualidade</div>
                <div style="color: ${scoreColor}; font-weight: 500;">${evaluation.quality_level}</div>
            </div>
        </div>
        
        <div class="evaluation-breakdown">
            ${evaluationFormatted}
        </div>
    `;
    
    // Salvar última avaliação
    currentState.lastEvaluation = data;
}

// Formatar avaliação de forma visual
function formatEvaluation(evaluationText) {
    const lines = evaluationText.split('\n').filter(line => line.trim());
    let formatted = '';
    
    lines.forEach(line => {
        if (line.includes('PRECISÃO:') || line.includes('COMPLETUDE:') || 
            line.includes('CLAREZA:') || line.includes('ADEQUAÇÃO:')) {
            const parts = line.split(' - ');
            const criterion = parts[0].trim();
            const description = parts[1] ? parts[1].trim() : '';
            
            // Extrair score do critério
            const scoreMatch = criterion.match(/(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            const maxScore = 25;
            const percentage = (score / maxScore) * 100;
            const barColor = getScoreColor(percentage * 4); // Converter para escala 0-100
            
            formatted += `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500; font-size: 13px;">${criterion.split(':')[0]}</span>
                        <span style="font-weight: 600; color: ${barColor};">${score}/25</span>
                    </div>
                    <div style="background: #e9ecef; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="background: ${barColor}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                    ${description ? `<div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${description}</div>` : ''}
                </div>
            `;
        } else if (line.includes('RESUMO:')) {
            const summary = line.replace('RESUMO:', '').trim();
            formatted += `
                <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #4299e1;">
                    <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px;">Resumo:</div>
                    <div style="font-size: 13px; color: #495057; line-height: 1.4;">${summary}</div>
                </div>
            `;
        }
    });
    
    return formatted || `<div style="color: #6c757d; font-style: italic;">Avaliação processada</div>`;
}

// Determinar cor do score
function getScoreColor(score) {
    if (score >= 90) return '#38a169';      // Verde
    if (score >= 80) return '#4299e1';      // Azul
    if (score >= 70) return '#d69e2e';      // Amarelo
    if (score >= 60) return '#ed8936';      // Laranja
    return '#e53e3e';                       // Vermelho
}

// Controles de loading
function showLoadingOverlay() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    elements.loadingOverlay.classList.add('hidden');
}

function disableForm() {
    elements.ticketInput.disabled = true;
    elements.analystResponse.disabled = true;
    elements.evaluateBtn.disabled = true;
    elements.evaluateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Avaliando...';
}

function enableForm() {
    elements.ticketInput.disabled = false;
    elements.analystResponse.disabled = false;
    elements.evaluateBtn.disabled = false;
    elements.evaluateBtn.innerHTML = '<i class="fas fa-search"></i> Avaliar';
}

function showToast(message, type = 'info', icon = 'fas fa-info-circle') {
    const toast = elements.toast;
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Configurar conteúdo
    toastIcon.className = `toast-icon ${icon}`;
    toastMessage.textContent = message;
    
    // Configurar tipo
    toast.className = `toast ${type}`;
    
    // Mostrar toast
    toast.classList.remove('hidden');
    
    // Auto-hide após duração configurada
    setTimeout(() => {
        toast.classList.add('hidden');
    }, CONFIG.TOAST_DURATION);
}

// Utilitários para debug
window.debugApp = {
    state: currentState,
    config: CONFIG,
    cases: SAMPLE_CASES,
    checkAPI: checkAPIHealth,
    loadCase: (index) => {
        if (index >= 0 && index < SAMPLE_CASES.length) {
            currentState.currentCaseIndex = index;
            const selectedCase = SAMPLE_CASES[index];
            elements.ticketInput.value = selectedCase.ticket;
            elements.analystResponse.value = selectedCase.analystResponse;
            showToast(`Caso ${selectedCase.id} carregado manualmente!`, 'success', 'fas fa-code');
        }
    },
    lastEvaluation: () => currentState.lastEvaluation
};
