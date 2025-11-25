// ===== DividasList.jsx (IMPRIMIR INTEGRADO + NO-PRINT) ======
import React, { useState, useEffect } from 'react';
import './DividasList.css';
import ClienteModal from './ClienteModal'; 
import ModalRecebimento from './ModalRecebimento';

const BACKEND_BASE_URL = 'http://localhost:3001';
// --- (Helpers de Formatação - sem alteração) ---
const formatCurrency = (value) => {
    const number = parseFloat(value || 0);
    return number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
};
const formatarDataDisplay = (dataString) => {
    if (!dataString) return 'Não Definido';
    try {
        const date = new Date(dataString);
        return date.toLocaleDateString('pt-BR', {
            timeZone: 'UTC', 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) { 
        try {
            return new Date(dataString).toLocaleDateString('pt-BR');
        } catch (err) {
            return 'Data Inválida';
        }
    }
};
const renderHighlightedText = (text, highlight) => {
    if (!text) text = '';
    const textString = text.toString();
    if (!highlight || !highlight.trim()) return textString;
    const lowerHighlight = highlight.toString().toLowerCase();
    const parts = textString.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, index) => 
                part.toLowerCase() === lowerHighlight ? 
                <mark key={index}>{part}</mark> : 
                part
            )}
        </>
    );
};
// -------------------------------------------------------------

// --- (Sub-Componente DetalhesFiado - sem alteração) ---
const DetalhesFiado = ({ cliente, onFechar }) => {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchItens = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/clientes/${cliente.id}/itens-fiado`);
                if (!response.ok) {
                    const errorBody = await response.json();
                    throw new Error(errorBody.error || 'Erro ao buscar histórico de vendas fiadas.');
                }
                const data = await response.json();
                setVendas(data);
            } catch (err) 
            {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchItens();
    }, [cliente.id]);
    return (
        <div className="detalhes-fiado-painel">
            {/* 🎯 ADICIONADO NO-PRINT */}
            <div className="detalhes-header no-print">
                <h4>Histórico Fiado - {cliente.nome}</h4>
                <button onClick={onFechar} className="btn-fechar-detalhes">&times; Fechar</button>
            </div>
            {loading && <p>Carregando histórico...</p>}
            {error && <p className="detalhes-error">Erro: {error}</p>}
            {!loading && vendas.length === 0 && (
                <p>Nenhuma venda fiada pendente.</p>
            )}
            {vendas.map(venda => (
                <div key={venda.venda_id} className="detalhe-venda-card">
                    <p className="venda-info">
                        Venda em: <strong>{formatarDataDisplay(venda.data_venda)}</strong> 
                        (Total: {formatCurrency(venda.valor_total)})
                    </p>
                    <ul className="venda-itens-lista">
                        {venda.itens.map((item, index) => (
                            <li key={index} className="venda-item">
                                <span className="item-qty">{item.quantidade}x</span>
                                <span className="item-nome-prod">{item.produto_nome}</span>
                                <span className="item-subtotal">{formatCurrency(item.quantidade * item.preco_unitario)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

// -------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL: DividasList ---
// -------------------------------------------------------------------
const DividasList = ({ merceariaId }) => {
    // --- (Estados - sem alteração) ---
    const [viewMode, setViewMode] = useState('devedores');
    const [dividas, setDividas] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liquidando, setLiquidando] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [clienteParaEditar, setClienteParaEditar] = useState(null); 
    const [clienteParaDetalhes, setClienteParaDetalhes] = useState(null);
    const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
    const [clienteParaReceber, setClienteParaReceber] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- (Funções de Busca e Handlers - sem alteração) ---
    const fetchDividas = async () => {
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/clientes/${merceariaId}/dividas`);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || `Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            setDividas(data);
        } catch (err) {
            console.error("Erro ao buscar dívidas:", err);
            setError(err.message);
        }
    };
    const fetchAllClients = async () => {
         try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/clientes/${merceariaId}/todos-clientes`);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || `Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            setAllClients(data);
        } catch (err) {
            console.error("Erro ao buscar todos os clientes:", err);
            setError(err.message);
        }
    };
    useEffect(() => {
        const carregarDados = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([
                fetchDividas(),
                fetchAllClients()
            ]);
            setLoading(false);
        };
        carregarDados();
    }, [merceariaId]);

    const handleAbrirModalRecebimento = (cliente) => {
        setClienteParaReceber(cliente);
        setShowRecebimentoModal(true);
    };
    const handleConfirmarRecebimento = async (valorPago, meioPagamento) => {
        setError(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/clientes/liquidar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    clienteId: clienteParaReceber.id, 
                    merceariaId: merceariaId, 
                    valorPago: valorPago,
                    meioPagamento: meioPagamento 
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Erro ao registrar pagamento.`);
            fetchDividas();
            fetchAllClients();
        } catch (err) {
            setError(`Falha na liquidação: ${err.message}`);
            throw err; 
        }
    };
    const handleDirectDelete = async (cliente) => {
        if (cliente.saldo_devedor > 0.01) {
            alert('Não é possível excluir. Cliente possui saldo devedor pendente.');
            return;
        }
        const confirmacao = window.confirm(`Tem certeza que deseja EXCLUIR o cliente ${cliente.nome}? Esta ação é irreversível.`);
        if (!confirmacao) return;
        setLoading(true);
        try {
            const url = `${BACKEND_BASE_URL}/api/clientes/deletar/${cliente.id}?merceariaId=${merceariaId}`;
            const response = await fetch(url, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Falha ao excluir cliente.`);
            }
            alert(`Cliente ${cliente.nome} excluído com sucesso.`);
            setAllClients(prev => prev.filter(c => c.id !== cliente.id));
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleOpenModal = (cliente = null) => {
        setClienteParaEditar(cliente);
        setShowClienteModal(true);
    };
    const handleSaveCliente = (clienteSalvo) => { 
        fetchDividas(); 
        fetchAllClients();
    };
    const handleDeleteClienteNoModal = (clienteId) => { 
        fetchDividas();
        fetchAllClients();
    };
    // --- Lógica de Filtragem (sem alteração) ---
    const clientsToFilter = viewMode === 'devedores' ?
        dividas : allClients;
    const filteredClients = clientsToFilter.filter(cliente => {
        if (!searchTerm.trim()) return true; 
        const lowerSearch = searchTerm.toLowerCase();
        const nome = cliente.nome ? cliente.nome.toLowerCase() : '';
        const telefone = cliente.telefone ? cliente.telefone.toString().toLowerCase() : '';
        return nome.includes(lowerSearch) || nome.includes(lowerSearch) || telefone.includes(lowerSearch);
    });
    // ------------------------------------------

    if (loading) {
        return <div>Carregando clientes...</div>;
    }

    if (error && !showRecebimentoModal) { 
        return <div className="dividas-error">Erro: {error}</div>;
    }

    const mainLayoutClass = clienteParaDetalhes ? 'dividas-main-layout detalhes-aberto' : 'dividas-main-layout';

    // 🎯 FUNÇÃO DE IMPRIMIR
    const handleImprimirTela = () => {
        window.print();
    };

    // =================================================================
    // --- LAYOUT JSX ---
    // =================================================================
    return (
        <div className="dividas-container">
            
            {/* --- Modais (flutuam sobre tudo) --- */}
            {showClienteModal && (
                <ClienteModal 
                    merceariaId={merceariaId}
                    cliente={clienteParaEditar}
                    onClose={() => setShowClienteModal(false)}
                    onSave={handleSaveCliente}
                    onDelete={handleDeleteClienteNoModal} 
                />
            )}
            {showRecebimentoModal && (
                <ModalRecebimento
                    cliente={clienteParaReceber}
                    onClose={() => setShowRecebimentoModal(false)}
                    onConfirm={handleConfirmarRecebimento} 
                />
            )}

            {/* --- Layout Principal (com flyout de detalhes) --- */}
            <div className={mainLayoutClass}>
                
                {/* --- 1. Conteúdo Principal (Header + Grid) --- */}
                <div className="dividas-list-wrapper">
                    
                    {/* Header (com busca e filtros) */}
                    <div className="dividas-header">
                        <h3>{viewMode === 'devedores' ?
                            `Contas a Receber (${filteredClients.length} Devedores)` : `Todos os Clientes (${filteredClients.length})`}</h3>
                        <div className="dividas-acoes no-print"> {/* 🎯 Classe no-print aqui */}
                            <input
                                type="text"
                                placeholder="Buscar por nome ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-busca-cliente"
                            />
                            <div className="view-toggle">
                                <button className={`btn-toggle ${viewMode === 'devedores' ?
                                    'active' : ''}`} onClick={() => { setViewMode('devedores'); setSearchTerm(''); }}>
                                    Devedores
                                </button>
                                <button className={`btn-toggle ${viewMode === 'todos' ?
                                    'active' : ''}`} onClick={() => { setViewMode('todos'); setSearchTerm(''); }}>
                                    Todos os Clientes
                                </button>
                            </div>
                            {/* 🎯 BOTÃO DE IMPRIMIR ADICIONADO */}
                            <button onClick={handleImprimirTela} className="btn-adicionar-cliente" style={{backgroundColor: '#6c757d', marginRight: '10px', width: 'auto'}}>🖨️ Imprimir</button>
                            <button onClick={() => handleOpenModal(null)} className="btn-adicionar-cliente">
                                + Cadastrar Cliente
                            </button>
                        </div>
                    </div>
                    
                    {error && <p className="dividas-error-principal">Erro: {error}</p>}

                    {/* --- GRID DE CLIENTES --- */}
                    <div className="cliente-grid-container">
                        {loading && <p>Carregando...</p>}
                        
                        {!loading && filteredClients.length === 0 && (
                            <div className="cliente-grid-vazio">
                                <p>Nenhum cliente encontrado.</p>
                                <small>{viewMode === 'devedores' ? 'Não há clientes com dívidas pendentes.' : 'Tente ajustar sua busca.'}</small>
                            </div>
                        )}

                        {!loading && filteredClients.map(cliente => (
                            <ClienteCard 
                                key={cliente.id}
                                cliente={cliente}
                                searchTerm={searchTerm}
                                onEditar={() => handleOpenModal(cliente)}
                                onReceber={() => handleAbrirModalRecebimento(cliente)}
                                onDetalhes={() => setClienteParaDetalhes(cliente)}
                                onExcluir={() => handleDirectDelete(cliente)}
                            />
                        ))}
                    </div>

                </div>

                {/* --- 2. Painel Lateral (Detalhes do Fiado) --- */}
                {clienteParaDetalhes && (
                    <div className="detalhes-painel-wrapper">
                        <DetalhesFiado cliente={clienteParaDetalhes} onFechar={() => setClienteParaDetalhes(null)} />
                    </div>
                )}
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// --- 🎯 SUB-COMPONENTE: ClienteCard (ATUALIZADO) ---
// -------------------------------------------------------------------
const ClienteCard = ({ cliente, searchTerm, onEditar, onReceber, onDetalhes, onExcluir }) => {
    
    const temDivida = cliente.saldo_devedor > 0.01;
    const limiteExcedido = temDivida && (parseFloat(cliente.limite_credito || 0) > 0) && (parseFloat(cliente.saldo_devedor) > parseFloat(cliente.limite_credito));
    // Lógica de clique: só abre detalhes se tiver dívida
    const handleCardClick = () => {
        if (temDivida) {
            onDetalhes();
        }
    };

    return (
        <div className={`cliente-card ${temDivida ? 'devedor' : ''} ${limiteExcedido ? 'limite-excedido' : ''}`}>
            
            {/* ÁREA CLICÁVEL (HEADER) */}
            <div 
                className={`cliente-card-header ${temDivida ? 'clicavel' : ''}`}
                onClick={handleCardClick}
            >
                <span className="cliente-nome">
                    {renderHighlightedText(cliente.nome, searchTerm)}
                </span>
                <span className="cliente-telefone">
                    📞 {renderHighlightedText(cliente.telefone || 'N/A', searchTerm)}
                </span>
            </div>

            {/* ÁREA CLICÁVEL (BODY) */}
            <div 
                className={`cliente-card-body ${temDivida ? 'clicavel' : ''}`}
                onClick={handleCardClick}
            >
                <div className="divida-info">
                    <span className="divida-label">DÍVIDA ATUAL</span>
                    <span className="divida-valor">
                        {formatCurrency(cliente.saldo_devedor)}
                    </span>
                </div>
                
                <div className="limite-info">
                    {limiteExcedido && (
                        <span className="limite-aviso">⚠️ LIMITE EXCEDIDO</span>
                    )}

                    <div className="limite-info-row">
                        <div className="limite-item">
                            <span className="limite-label">Vencimento</span>
                            {/* 🎯 CORREÇÃO: VENCIMENTO */}
                            <span className="limite-valor">
                                {temDivida ?
                                formatarDataDisplay(cliente.data_vencimento) : 'Não Definido'}
                            </span>
                        </div>
                        <div className="limite-item">
                            <span className="limite-label">Limite</span>
                            <span className="limite-valor">{formatCurrency(cliente.limite_credito)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações do Card (NÃO são clicáveis para detalhes) */}
            {/* 🎯 ADICIONADO NO-PRINT para esconder na impressão */}
            <div className="cliente-card-acoes no-print">
                <button className="btn-card-acao config" onClick={onEditar}>
                    Config/Editar
                </button>
                
                {/* 🎯 CORREÇÃO 2: LÓGICA DO BOTÃO "VER DETALHES" */}
                {temDivida ?
                (
                    <button className="btn-card-acao detalhes" onClick={onDetalhes}>
                        Ver Detalhes
                    </button>
                ) : (
                    <button className="btn-card-acao excluir" onClick={onExcluir}>
                        Excluir
                    </button>
                )}
                
                <button 
                    className="btn-card-acao receber" 
                    onClick={onReceber}
                    disabled={!temDivida}
                >
                    💰 Receber
                </button>
            </div>
        </div>
    );
};

export default DividasList;