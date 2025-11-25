// ===== Financeiro.jsx (SEU CÓDIGO ORIGINAL + IMPRESSÃO) =====
import React, { useState, useEffect } from 'react';
// import './Financeiro.css'; // O estilo está no Dashboard.css
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_BASE_URL = 'http://localhost:3001';

// --- (Helpers) ---
const formatCurrency = (value) => {
    const number = parseFloat(value || 0);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const getLocalDateISOString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
// -------------------------------------------------------------------

// --- (Componentes de Card e Linhas de Relatório) ---
const ResumoCard = ({ titulo, valor, loading, cor = 'azul' }) => (
    <div className={`resumo-card ${cor}`}>
        <h4>{titulo}</h4>
        {loading ? <div className="resumo-loading-spinner"></div> : <p>{formatCurrency(valor)}</p>}
    </div>
);
const DreRow = ({ label, valor, isTotal = false, isNegative = false, className = '' }) => (
    <div className={`dre-row ${isTotal ? 'total' : ''} ${className}`}>
        <span>{label}</span>
        <span className={isNegative ? 'valor-negativo' : 'valor-positivo'}>
            {isNegative ? '- ' : ''}{formatCurrency(valor)}
        </span>
    </div>
);
const DreSubRow = ({ label, valor }) => (
    <div className="dre-sub-row">
        <span>{label}</span>
        <span className="valor-positivo">{formatCurrency(valor)}</span>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const Financeiro = ({ merceariaId, logoUrl, nomeFantasia }) => {
    // --- (Estados das Abas) ---
    const [activeTab, setActiveTab] = useState('fluxo');
    const [resumo, setResumo] = useState(null);
    const [loadingResumo, setLoadingResumo] = useState(true);
    const [errorResumo, setErrorResumo] = useState(null);
    const [relatorioDRE, setRelatorioDRE] = useState(null);
    const [loadingDRE, setLoadingDRE] = useState(false);
    const [errorDRE, setErrorDRE] = useState(null);
    const [dataInicioDRE, setDataInicioDRE] = useState(getLocalDateISOString());
    const [dataFimDRE, setDataFimDRE] = useState(getLocalDateISOString());
    const [contas, setContas] = useState([]);
    const [loadingContas, setLoadingContas] = useState(true);
    const [errorContas, setErrorContas] = useState(null);
    const [filterStatus, setFilterStatus] = useState('pendente');
    const [showFormContas, setShowFormContas] = useState(false);
    const [formDataContas, setFormDataContas] = useState({ descricao: '', valor: '', data_vencimento: '' });
    const [savingContas, setSavingContas] = useState(false);
    const [contaEmEdicao, setContaEmEdicao] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [reportProdutos, setReportProdutos] = useState([]);
    const [loadingReportProdutos, setLoadingReportProdutos] = useState(false);
    const [errorReportProdutos, setErrorReportProdutos] = useState(null);
    const [dataInicioProdutos, setDataInicioProdutos] = useState(getLocalDateISOString());
    const [dataFimProdutos, setDataFimProdutos] = useState(getLocalDateISOString());
    const [categoriaFiltro, setCategoriaFiltro] = useState('');

    // --- (Funções de Busca Iniciais) ---
    useEffect(() => {
        if (merceariaId) {
            fetchResumo();
            fetchCategorias();
        }
    }, [merceariaId]);

    // --- (Funções da Aba 1: Fluxo de Caixa) ---
    const fetchResumo = async () => {
        setLoadingResumo(true);
        setErrorResumo(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/resumo/${merceariaId}`);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();
            setResumo(data);
        } catch (err) {
            setErrorResumo(err.message);
        } finally {
            setLoadingResumo(false);
        }
    };

    const handleGerarDRE = async (e) => {
        e.preventDefault();
        setLoadingDRE(true);
        setErrorDRE(null);
        setRelatorioDRE(null);
        try {
            const params = new URLSearchParams({ data_inicio: dataInicioDRE, data_fim: dataFimDRE });
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/relatorio_dre/${merceariaId}?${params.toString()}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
            setRelatorioDRE(data);
        } catch (err) {
            setErrorDRE(err.message);
        } finally {
            setLoadingDRE(false);
        }
    };

    // --- FUNÇÃO: BAIXAR PDF DRE ---
    const handleBaixarPDF = () => {
        if (!relatorioDRE) return;

        const doc = new jsPDF();
        let startY = 15;

        // 1. Título e Logo
        if (logoUrl) {
            try {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = logoUrl;

                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    const imgHeight = 25 / aspectRatio;
                    doc.addImage(img, 'PNG', 15, 10, 25, imgHeight);
                    continuePDFGeneration(imgHeight + 15);
                };

                img.onerror = () => {
                    console.error("Falha ao carregar a logo para o PDF.");
                    continuePDFGeneration(startY);
                };

            } catch (error) {
                console.error("Erro ao processar a logo:", error);
                continuePDFGeneration(startY);
            }
        } else {
            continuePDFGeneration(startY);
        }

        const continuePDFGeneration = (currentY) => {
            // 2. Títulos
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(nomeFantasia || 'Relatório da Mercearia', 105, currentY, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80);
            doc.text("Relatório de Resultado do Exercício (DRE)", 105, currentY + 7, { align: 'center' });

            const periodo = `Período de ${formatDate(dataInicioDRE)} até ${formatDate(dataFimDRE)}`;
            doc.setFontSize(10);
            doc.text(periodo, 105, currentY + 12, { align: 'center' });

            // 3. Dados da Tabela
            const tableData = [
                { label: '(+) Receita Bruta Total', valor: formatCurrency(relatorioDRE.receita_bruta) },
                { label: '    Em Dinheiro', valor: formatCurrency(relatorioDRE.receita_dinheiro) },
                { label: '    Em Pix', valor: formatCurrency(relatorioDRE.receita_pix) },
                { label: '    Em Cartão (Débito/Crédito)', valor: formatCurrency(relatorioDRE.receita_cartao) },
                { label: '(-) Custo da Mercadoria Vendida (CMV)', valor: `- ${formatCurrency(relatorioDRE.cmv)}` },
                { label: '(=) Lucro Bruto', valor: formatCurrency(relatorioDRE.lucro_bruto) },
                { label: '(-) Despesas Operacionais (Contas Pagas)', valor: `- ${formatCurrency(relatorioDRE.despesas)}` },
                { label: '(=) Lucro Líquido', valor: formatCurrency(relatorioDRE.lucro_liquido) },
            ];

            // 4. Gerar Tabela com autoTable
            autoTable(doc, {
                startY: currentY + 20,
                head: [['Descrição', 'Valor (R$)']],
                body: tableData.map(row => [row.label, row.valor]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 'auto', halign: 'right' }
                },
                didDrawCell: (data) => {
                    const isTotalRow = data.row.raw[0].includes('(=)');
                    if (isTotalRow) {
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(0);
                    }
                    const isNegativeRow = data.row.raw[0].includes('(-)');
                    if (isNegativeRow && data.column.index === 1) {
                        doc.setTextColor(220, 53, 69); // Vermelho
                    }
                }
            });

            // 5. Salvar o PDF
            doc.save(`DRE_${nomeFantasia}_${dataInicioDRE}_a_${dataFimDRE}.pdf`);
        };
    };

    // --- (Funções da Aba 2: Contas a Pagar) ---
    useEffect(() => {
        if (merceariaId && (activeTab === 'contas' || loadingContas)) {
            fetchContas(filterStatus);
        }
    }, [filterStatus, merceariaId, activeTab]);

    const fetchContas = async (status = filterStatus) => {
        setLoadingContas(true);
        setErrorContas(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/${merceariaId}?status=${status}`);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();
            setContas(data);
        } catch (err) {
            setErrorContas(err.message);
        } finally {
            setLoadingContas(false);
        }
    };
    const handleContasFormChange = (e) => {
        const { name, value } = e.target;
        setFormDataContas(prev => ({ ...prev, [name]: value }));
    };
    const handleCancelarContasForm = () => {
        setShowFormContas(false);
        setFormDataContas({ descricao: '', valor: '', data_vencimento: '' });
        setContaEmEdicao(null);
        setErrorContas(null);
    };
    const handleContasFormSubmit = async (e) => {
        e.preventDefault();
        if (contaEmEdicao) await handleUpdateConta();
        else await handleAddConta();
    };
    const handleAddConta = async () => {
        setSavingContas(true);
        setErrorContas(null);
        try {
            const valorCorrigido = formDataContas.valor.toString().replace(',', '.');
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merceariaId: merceariaId,
                    descricao: formDataContas.descricao,
                    valor: valorCorrigido,
                    data_vencimento: formDataContas.data_vencimento
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Erro ao adicionar conta.`);
            fetchContas(filterStatus);
            handleCancelarContasForm();
        } catch (err) {
            setErrorContas(`Falha ao adicionar: ${err.message}`);
        } finally {
            setSavingContas(false);
        }
    };
    const handleUpdateConta = async () => {
        setSavingContas(true);
        setErrorContas(null);
        try {
            const valorCorrigido = formDataContas.valor.toString().replace(',', '.');
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/${contaEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merceariaId: merceariaId,
                    descricao: formDataContas.descricao,
                    valor: valorCorrigido,
                    data_vencimento: formDataContas.data_vencimento
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao atualizar conta.');
            setContas(prev => prev.map(c => c.id === contaEmEdicao ? result : c));
            handleCancelarContasForm();
        } catch (err) {
            setErrorContas(`Falha ao atualizar: ${err.message}`);
        } finally {
            setSavingContas(false);
        }
    };
    const handleEditClick = (conta) => {
        const dataFormatada = conta.data_vencimento.split('T')[0];
        setFormDataContas({
            descricao: conta.descricao,
            valor: parseFloat(conta.valor).toLocaleString('pt-BR', { useGrouping: false, minimumFractionDigits: 2 }),
            data_vencimento: dataFormatada
        });
        setContaEmEdicao(conta.id);
        setShowFormContas(true);
    };
    const handleMarcarPaga = async (contaId) => {
        setSavingContas(true);
        setErrorContas(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/${contaId}/pagar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merceariaId: merceariaId })
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Erro ao marcar como paga.');
            }
            fetchResumo();
            if (filterStatus === 'pendente' || filterStatus === 'atrasada') {
                setContas(prev => prev.filter(c => c.id !== contaId));
            } else {
                fetchContas(filterStatus);
            }
        } catch (err) {
            setErrorContas(`Falha ao pagar: ${err.message}`);
        } finally {
            setSavingContas(false);
        }
    };
    const handleDeleteConta = async (contaId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta conta pendente?")) return;
        setSavingContas(true);
        setErrorContas(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/${contaId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merceariaId: merceariaId })
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Erro ao excluir conta.');
            }
            setContas(prev => prev.filter(c => c.id !== contaId));
        } catch (err) {
            setErrorContas(`Falha ao excluir: ${err.message}`);
        } finally {
            setSavingContas(false);
        }
    };

    // --- (Funções da Aba 3: Relatório de Produtos) ---
    const fetchCategorias = async () => {
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/categorias/${merceariaId}`);
            if (!response.ok) throw new Error('Erro ao buscar categorias.');
            const data = await response.json();
            setCategorias(data);
        } catch (err) {
            console.error(err);
            setErrorReportProdutos("Falha ao carregar categorias para o filtro.");
        }
    };
    const handleGerarReportProdutos = async (e) => {
        e.preventDefault();
        setLoadingReportProdutos(true);
        setErrorReportProdutos(null);
        setReportProdutos([]);

        try {
            const params = new URLSearchParams({
                data_inicio: dataInicioProdutos,
                data_fim: dataFimProdutos
            });
            if (categoriaFiltro) {
                params.append('categoria_id', categoriaFiltro);
            }

            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/relatorio_produtos/${merceariaId}?${params.toString()}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao gerar relatório.');

            setReportProdutos(data);
        } catch (err) {
            setErrorReportProdutos(err.message);
        } finally {
            setLoadingReportProdutos(false);
        }
    };

    // 🎯 FUNÇÃO DE IMPRIMIR
    const handleImprimirTela = () => {
        window.print();
    };

 /* ===== Bloco ALTERADO NO Financeiro.jsx (Cabeçalho/Tabs) ===== */

// ... (início do componente Financeiro) ...

    // --- Renderização ---
    return (
        <div className="financeiro-container">

            {/* 🎯 WRAPPER NOVO: TABS E BOTÃO DE IMPRIMIR NA MESMA LINHA */}
            <div className="financeiro-header-row no-print" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end',
                marginBottom: '20px'
            }}>
                
                {/* 🎯 1. TABS (ESQUERDA) */}
                <div className="tabs-nav"> 
                    <button
                        className={`tab-btn ${activeTab === 'fluxo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fluxo')}
                    >
                        Fluxo de Caixa
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'contas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contas')}
                    >
                        Contas a Pagar
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'relatorios' ? 'active' : ''}`}
                        onClick={() => setActiveTab('relatorios')}
                    >
                        Relatórios de Vendas
                    </button>
                </div>

                {/* 🎯 2. BOTÃO DE IMPRIMIR (DIREITA) */}
                <button 
                    onClick={handleImprimirTela} 
                    className="btn-nova-conta" 
                    style={{ backgroundColor: '#6c757d', width: 'auto', minWidth: 'auto', padding: '10px 16px' }}
                >
                    🖨️ Imprimir Tela
                </button>
            </div>
            {/* 🎯 FIM DO NOVO WRAPPER */}

            {/* --- CONTEÚDO DAS ABAS --- */}
            <div className="tab-content">
                {/* --- ABA 1: FLUXO DE CAIXA --- */}
                {activeTab === 'fluxo' && (
                    <div className="tab-pane">
                        {/* Seção 1: Resumo do Dia */}
                        <div className="resumo-dia-header">
                            <h3>Resumo do Dia</h3>
                            <button onClick={fetchResumo} className="btn-atualizar-resumo no-print" disabled={loadingResumo}>
                                {loadingResumo ? '...' : 'Atualizar'}
                            </button>
                        </div>
                        {errorResumo && <p className="financeiro-error">Erro ao carregar resumo: {errorResumo}</p>}
                        <div className="resumo-cards-container">
                            <ResumoCard titulo="Entradas Totais (Hoje)" valor={resumo?.total_entradas_dia} loading={loadingResumo} cor="verde" />
                            <ResumoCard titulo="Entradas em Dinheiro" valor={resumo?.total_dinheiro} loading={loadingResumo} cor="azul" />
                            <ResumoCard titulo="Entradas em Pix" valor={resumo?.total_pix} loading={loadingResumo} cor="azul" />
                            <ResumoCard titulo="Entradas em Cartão" valor={resumo?.total_cartao} loading={loadingResumo} cor="azul" />
                        </div>

                        {/* Seção 2: Relatório DRE */}
                        <h3 className="section-title">Relatório de Resultado (DRE)</h3>
                        <form className="relatorio-form no-print" onSubmit={handleGerarDRE}> {/* 🎯 ADD no-print */}
                            <div className="form-group">
                                <label>Data Início</label>
                                <input type="date" value={dataInicioDRE} onChange={(e) => setDataInicioDRE(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Data Fim</label>
                                <input type="date" value={dataFimDRE} onChange={(e) => setDataFimDRE(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn-gerar-relatorio" disabled={loadingDRE}>
                                {loadingDRE ? 'Gerando...' : 'Gerar DRE'}
                            </button>
                            <button
                                type="button"
                                className="btn-pdf-relatorio"
                                onClick={handleBaixarPDF}
                                disabled={!relatorioDRE || loadingDRE}
                            >
                                Baixar PDF
                            </button>
                        </form>
                        {loadingDRE && <div className="financeiro-loading">Calculando DRE...</div>}
                        {errorDRE && <p className="financeiro-error">Erro ao gerar DRE: {errorDRE}</p>}
                        
                        {relatorioDRE && (
                            <div className="dre-card-grid">
                                {/* Card 1: Receita Bruta */}
                                <div className="dre-card dre-card-receita">
                                    <h4>(+) Receita Bruta Total</h4>
                                    <p>{formatCurrency(relatorioDRE.receita_bruta)}</p>
                                    <div className="dre-card-sub-items">
                                        <span>Dinheiro: {formatCurrency(relatorioDRE.receita_dinheiro)}</span>
                                        <span>Pix: {formatCurrency(relatorioDRE.receita_pix)}</span>
                                        <span>Cartão: {formatCurrency(relatorioDRE.receita_cartao)}</span>
                                    </div>
                                </div>

                                {/* Card 2: CMV */}
                                <div className="dre-card dre-card-despesa">
                                    <h4>(-) Custo da Mercadoria (CMV)</h4>
                                    <p>- {formatCurrency(relatorioDRE.cmv)}</p>
                                </div>

                                {/* Card 3: Lucro Bruto */}
                                <div className="dre-card dre-card-lucro-bruto">
                                    <h4>(=) Lucro Bruto</h4>
                                    <p>{formatCurrency(relatorioDRE.lucro_bruto)}</p>
                                </div>

                                {/* Card 4: Despesas */}
                                <div className="dre-card dre-card-despesa">
                                    <h4>(-) Despesas Operacionais</h4>
                                    <p>- {formatCurrency(relatorioDRE.despesas)}</p>
                                </div>

                                {/* Card 5: Lucro Líquido (O MAIS IMPORTANTE) */}
                                <div className="dre-card dre-card-lucro-liquido">
                                    <h4>(=) Lucro Líquido</h4>
                                    <p>{formatCurrency(relatorioDRE.lucro_liquido)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ABA 2: CONTAS A PAGAR (LAYOUT DE CARDS) --- */}
                {activeTab === 'contas' && (
                    <div className="tab-pane">
                        <h3 className="section-title">Gestão de Contas a Pagar</h3>
                        <div className="financeiro-controles no-print"> {/* 🎯 ADD no-print */}
                            <div className="status-filtros">
                                <button className={`btn-filtro ${filterStatus === 'pendente' ? 'active' : ''}`} onClick={() => setFilterStatus('pendente')}>Pendente</button>
                                <button className={`btn-filtro ${filterStatus === 'paga' ? 'active' : ''}`} onClick={() => setFilterStatus('paga')}>Paga</button>
                                <button className={`btn-filtro ${filterStatus === 'atrasada' ? 'active' : ''}`} onClick={() => setFilterStatus('atrasada')}>Atrasada</button>
                            </div>
                            <button className="btn-nova-conta" onClick={() => { setContaEmEdicao(null); setFormDataContas({ descricao: '', valor: '', data_vencimento: '' }); setShowFormContas(true); }}>
                                + Nova Conta a Pagar
                            </button>
                        </div>

                        {showFormContas && (
                            <div className="modal-financeiro no-print"> {/* 🎯 ADD no-print */}
                                <h4>{contaEmEdicao ? 'Editar Conta' : 'Adicionar Conta'}</h4>
                                <form onSubmit={handleContasFormSubmit}>
                                    <input type="text" placeholder="Descrição" name="descricao" value={formDataContas.descricao} required onChange={handleContasFormChange} />
                                    <input type="text" placeholder="Valor (R$)" name="valor" value={formDataContas.valor} required onChange={handleContasFormChange} />
                                    <input type="date" name="data_vencimento" value={formDataContas.data_vencimento} required onChange={handleContasFormChange} />
                                    <div className="modal-actions-financeiro">
                                        <button type="button" onClick={handleCancelarContasForm} disabled={savingContas}>Cancelar</button>
                                        <button type="submit" disabled={savingContas}>
                                            {savingContas ? 'Salvando...' : (contaEmEdicao ? 'Atualizar Conta' : 'Salvar Conta')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {errorContas && <p className="financeiro-error">Erro: {errorContas}</p>}

                        {loadingContas ? (
                            <div className="financeiro-loading">Carregando contas...</div>
                        ) : (
                            <div className="contas-card-container">
                                {!loadingContas && contas.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>Nenhuma conta encontrada para este filtro.</p>
                                ) : (
                                    contas.map(conta => (
                                        <div
                                            key={conta.id}
                                            className={`conta-card status-${conta.status}`}
                                        >
                                            <div className="conta-card-header">
                                                <h5>{conta.descricao}</h5>
                                            </div>
                                            <div className="conta-card-body">
                                                <div className="conta-card-info">
                                                    <span>Vencimento</span>
                                                    <span>{formatDate(conta.data_vencimento)}</span>
                                                </div>
                                                <div className="conta-card-info">
                                                    <span>Valor</span>
                                                    <span className="valor">{formatCurrency(conta.valor)}</span>
                                                </div>
                                            </div>
                                            {(conta.status === 'pendente' || conta.status === 'atrasada') && (
                                                <div className="conta-card-footer no-print"> {/* 🎯 ADD no-print */}
                                                    <button onClick={() => handleEditClick(conta)} disabled={savingContas} className="btn-editar">Editar</button>
                                                    <button onClick={() => handleDeleteConta(conta.id)} disabled={savingContas} className="btn-excluir">Excluir</button>
                                                    <button onClick={() => handleMarcarPaga(conta.id)} disabled={savingContas} className="btn-pagar">Pagar</button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- ABA 3: RELATÓRIOS DE VENDAS (LAYOUT DE CARDS) --- */}
                {activeTab === 'relatorios' && (
                    <div className="tab-pane">
                        <h3 className="section-title">Produtos Mais Vendidos</h3>

                        <form className="relatorio-form-produtos no-print" onSubmit={handleGerarReportProdutos}> {/* 🎯 ADD no-print */}
                            <div className="form-group">
                                <label>Data Início</label>
                                <input type="date" value={dataInicioProdutos} onChange={(e) => setDataInicioProdutos(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Data Fim</label>
                                <input type="date" value={dataFimProdutos} onChange={(e) => setDataFimProdutos(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                                    <option value="">Todas as Categorias</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn-gerar-relatorio" disabled={loadingReportProdutos}>
                                {loadingReportProdutos ? 'Gerando...' : 'Gerar Relatório'}
                            </button>
                        </form>

                        {loadingReportProdutos && <div className="financeiro-loading">Buscando dados de vendas...</div>}
                        {errorReportProdutos && <p className="financeiro-error">Erro ao gerar relatório: {errorReportProdutos}</p>}

                        {/* Container de Cards */}
                        <div className="report-card-container">
                            {!loadingReportProdutos && reportProdutos.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>Nenhum produto vendido encontrado para este período/filtro.</p>
                            ) : (
                                reportProdutos.map((prod, index) => (
                                    <div key={index} className="report-card">
                                        <h5>{prod.produto_nome}</h5>
                                        <div className="report-card-info">
                                            <span className="label">Categoria</span>
                                            <span>{prod.categoria_nome}</span>
                                        </div>
                                        <div className="report-card-info">
                                            <span className="label">Total Vendido</span>
                                            <span className="quantidade">
                                                {prod.unidade_medida === 'kg' ?
                                                    parseFloat(prod.total_vendido).toFixed(3)
                                                    : parseFloat(prod.total_vendido).toFixed(0)}
                                                <span className="unidade-medida"> ({prod.unidade_medida})</span>
                                            </span>
                                        </div>
                                        <div className="report-card-info">
                                            <span className="label">Receita Gerada</span>
                                            <span className="receita">{formatCurrency(prod.receita_total)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Financeiro;