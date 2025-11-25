// ===== src/components/PDV.jsx (DARK MODE/IMPRIMIR READY) =====
import React, { useState, useEffect, useRef } from 'react';
import './PDV.css';

const BACKEND_BASE_URL = 'http://localhost:3001';

// --- (Helper de Formatação) ---
const formatCurrency = (value) => {
    const number = parseFloat(value || 0);
    return number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
};
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// --- SUB-COMPONENTE: Modal de Pagamento ---
// -------------------------------------------------------------------
const PagamentoModal = ({ total, onFinalizar, onCancelar, loading, merceariaId }) => {

    // --- (Estados) ---
    const paymentMethods = [
        { key: 'Dinheiro', label: 'Dinheiro' },
        { key: 'Pix', label: 'Pix' },
        { key: 'Debito', label: 'Cartão de Débito' },
        { key: 'Credito', label: 'Cartão de Crédito' },
        { key: 'Fiado', label: 'Fiado (Na conta)' }
    ];
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [meioPagamento, setMeioPagamento] = useState('Dinheiro');
    const [valorRecebido, setValorRecebido] = useState('');
    const [troco, setTroco] = useState(0.00);
    const [metodoConfirmado, setMetodoConfirmado] = useState(false);
    const [termoBuscaCliente, setTermoBuscaCliente] = useState('');
    const [resultadosCliente, setResultadosCliente] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [showNovoCliente, setShowNovoCliente] = useState(false);
    const [novoClienteNome, setNovoClienteNome] = useState('');
    const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
    const [loadingCliente, setLoadingCliente] = useState(false);
    const [errorCliente, setErrorCliente] = useState(null);
    const [clienteIndex, setClienteIndex] = useState(-1);
    const inputValorRecebidoRef = useRef(null);
    const inputClienteRef = useRef(null);
    const btnConfirmarRef = useRef(null);
    const modalOverlayRef = useRef(null);
    const clienteResultadosRef = useRef(null);
    const pagamentoListaRef = useRef(null);
    // --- (Hooks de Efeito) ---
    useEffect(() => {
        if (!metodoConfirmado) {
            modalOverlayRef.current?.focus();
        }
    }, [metodoConfirmado]);
    const handleModalKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' && e.key !== 'Escape') return;
        if (!metodoConfirmado) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % paymentMethods.length);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + paymentMethods.length) % paymentMethods.length);
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                handleSetMetodo(paymentMethods[selectedIndex].key);
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancelar();
        }
    };

    useEffect(() => {
        if (!metodoConfirmado) return;
        if (meioPagamento === 'Dinheiro') {
            inputValorRecebidoRef.current?.focus();
            setValorRecebido(total.toLocaleString('pt-BR', {useGrouping: false, minimumFractionDigits: 2}));
            setTimeout(() => inputValorRecebidoRef.current?.select(), 0);
        } else if (meioPagamento === 'Fiado' && !clienteSelecionado) {
            inputClienteRef.current?.focus();
        } else {
            btnConfirmarRef.current?.focus();
        }
    }, [metodoConfirmado, meioPagamento, clienteSelecionado, total]);
    useEffect(() => {
        if (meioPagamento === 'Dinheiro') {
            const recebido = parseFloat(valorRecebido.toString().replace(',', '.')) || 0;
            const totalArredondado = parseFloat(total.toFixed(2));
            setTroco(recebido >= totalArredondado ? recebido - totalArredondado : 0.00);
        }
    }, [valorRecebido, total, meioPagamento]);
    useEffect(() => {
        if (clienteIndex < 0 || !clienteResultadosRef.current) return;
        const lista = clienteResultadosRef.current;
        const itemSelecionado = lista.children[clienteIndex];
        if (itemSelecionado) {
            itemSelecionado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [clienteIndex]);
    useEffect(() => {
        if (!pagamentoListaRef.current) return;
        const item = pagamentoListaRef.current.children[selectedIndex];
        if (item) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);
    // --- (Funções de Cliente) ---
    const handleBuscaCliente = async (termo) => {
        setTermoBuscaCliente(termo);
        setClienteIndex(-1);
        setErrorCliente(null);
        if (termo.length < 2) { setResultadosCliente([]); return; }
        setLoadingCliente(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/clientes/buscar/${merceariaId}?termo=${termo}`);
            if (!response.ok) throw new Error('Erro ao buscar clientes');
            const data = await response.json();
            setResultadosCliente(data);
        } catch (err) { setErrorCliente(err.message);
        }
        finally { setLoadingCliente(false); }
    };
    const handleCriarCliente = async () => { /* ... (lógica existente) ... */ };
    // --- (Função de Confirmação Final) ---
    const handleConfirmarFinal = () => {
        const totalArredondado = parseFloat(total.toFixed(2));
        if (meioPagamento === 'Fiado') {
            if (!clienteSelecionado || !clienteSelecionado.id) {
                setErrorCliente("Selecione um cliente válido!");
                return;
            }
            const novoSaldo = (parseFloat(clienteSelecionado.saldo_devedor) || 0) + total;
            const limite = parseFloat(clienteSelecionado.limite_credito) || 0;
            if (limite > 0 && novoSaldo > limite) {
                if (!window.confirm(`ALERTA: Este cliente ultrapassará o limite de crédito. Continuar?`)) {
                    return;
                }
            }
            onFinalizar('Fiado', clienteSelecionado.id);
        } else if (meioPagamento === 'Dinheiro') {
             const recebidoNum = parseFloat(valorRecebido.toString().replace(',', '.')) ||
                0;
             if (recebidoNum < totalArredondado) {
                setErrorCliente("Valor recebido é menor que o total.");
                return;
            }
            onFinalizar('Dinheiro', null);
        } else {
            onFinalizar(meioPagamento, null);
        }
    };

    const selecionarCliente = (cli) => {
        setClienteSelecionado(cli);
        setResultadosCliente([]);
        setTermoBuscaCliente('');
        setClienteIndex(-1);
        setTimeout(() => btnConfirmarRef.current?.focus(), 0);
    };
    const handleSetMetodo = (metodoKey) => {
        setMeioPagamento(metodoKey);
        setMetodoConfirmado(true);
        setErrorCliente(null);
        if (metodoKey !== 'Fiado') {
            setClienteSelecionado(null);
        }
    };
    const handleDinheiroInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmarFinal();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancelar();
        }
    };
    const handleClienteInputKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setClienteIndex(prev => Math.min(prev + 1, resultadosCliente.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setClienteIndex(prev => Math.max(prev - 1, 0));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (clienteIndex > -1 && resultadosCliente[clienteIndex]) {
                selecionarCliente(resultadosCliente[clienteIndex]);
            }
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            onCancelar();
        }
    };

    // --- (Renderização do Modal) ---
    return (
        <div
            className="modal-overlay-pdv"
            ref={modalOverlayRef}
            tabIndex="-1"
            onKeyDown={handleModalKeyDown}
        >
            <div className="modal-content-pdv">
                <h2>Finalizar Venda</h2>
                <div className="pagamento-total">
                    <span>Total a Pagar</span>
                    <strong>{formatCurrency(total)}</strong>
                </div>

                {!metodoConfirmado && (
                    <div className="pagamento-meios-wrapper no-print"> {/* 🎯 ADD no-print */}
                        <label>Forma de Pagamento (Use ⬆️ ⬇️ e Enter)</label>

                        <ul className="pagamento-meios-lista" ref={pagamentoListaRef}>
                            {paymentMethods.map((metodo, index) => (
                                <li
                                    key={metodo.key}
                                    className={`btn-meio-pagamento ${selectedIndex === index ?
                                    'active' : ''}`}
                                    onClick={() => {
                                        setSelectedIndex(index);
                                        handleSetMetodo(metodo.key);
                                    }}
                                >
                                    {metodo.label}
                                    {selectedIndex === index && <span className="indicador-enter">↩</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="pagamento-conteudo">
                    {metodoConfirmado && meioPagamento === 'Dinheiro' && (
                         <div className="pagamento-troco no-print"> {/* 🎯 ADD no-print */}
                            <label htmlFor="valorRecebido">Valor Recebido (R$):</label>
                            <input
                                ref={inputValorRecebidoRef}
                                type="text"
                                id="valorRecebido"
                                value={valorRecebido}
                                onChange={(e) => setValorRecebido(e.target.value)}
                                onKeyDown={handleDinheiroInputKeyDown}
                            />
                            <div className="troco-display">
                                <span>Troco</span>
                                <strong>{formatCurrency(troco)}</strong>
                            </div>
                        </div>
                    )}

                    {metodoConfirmado && (meioPagamento === 'Pix' ||
                        meioPagamento === 'Debito' || meioPagamento === 'Credito') && (
                        <div className="pagamento-cartao no-print"> {/* 🎯 ADD no-print */}
                            <p>Pagamento via: <strong>{meioPagamento}</strong></p>
                            <p>(Pressione Enter para confirmar)</p>
                        </div>
                    )}

                    {metodoConfirmado && meioPagamento === 'Fiado' && (
                        <div className="pagamento-fiado">
                            {clienteSelecionado ? (
                                <div className="cliente-selecionado-info">
                                    <strong>Cliente: {clienteSelecionado.nome}</strong>
                                    <span>Saldo Atual: {formatCurrency(clienteSelecionado.saldo_devedor)}</span>
                                    <span>Novo Saldo: {formatCurrency((parseFloat(clienteSelecionado.saldo_devedor) || 0) + total)}</span>
                                    <button type="button" onClick={() => setClienteSelecionado(null)}>Trocar Cliente</button>
                                </div>
                            ) : (
                                <div className="cliente-search-container no-print"> {/* 🎯 ADD no-print */}
                                    <input
                                        ref={inputClienteRef}
                                        type="text"
                                        placeholder="Buscar cliente por Nome ou Telefone..."
                                        value={termoBuscaCliente}
                                        onChange={(e) => handleBuscaCliente(e.target.value)}
                                        onKeyDown={handleClienteInputKeyDown}
                                    />
                                    {loadingCliente && <p>Buscando...</p>}
                                    <ul className="cliente-search-results" ref={clienteResultadosRef}>
                                        {resultadosCliente.map((cli, index) => (
                                            <li
                                                key={cli.id}
                                                className={index === clienteIndex ?
                                                'resultado-selecionado' : ''}
                                                onClick={() => selecionarCliente(cli)}
                                                onMouseEnter={() => setClienteIndex(index)}
                                            >
                                                {cli.nome} <span>(Tel: {cli.telefone || 'N/A'})</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button type="button" className="btn-novo-cliente" onClick={() => setShowNovoCliente(true)}>
                                        + Cadastrar Novo Cliente
                                    </button>
                                    {showNovoCliente && (
                                        <div className="novo-cliente-form">
                                            {/* (O formulário de novo cliente vai aqui, se você o tiver) */}
                                            <input type="text" placeholder="Nome" />
                                            <button>Salvar</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {errorCliente && <p className="modal-error-pdv">{errorCliente}</p>}

                <div className="modal-actions-pdv no-print"> {/* 🎯 ADD no-print */}
                    <button className="btn-cancelar-pdv" onClick={onCancelar} disabled={loading}>
                        Cancelar (Esc)
                    </button>
                    <button
                        ref={btnConfirmarRef}
                        className="btn-confirmar-pdv"
                        onClick={handleConfirmarFinal}
                        disabled={loading ||
                        !metodoConfirmado}
                    >
                        {loading ?
                        'Salvando...' : 'Confirmar Venda (Enter)'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// -------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL DO PDV ---
// -------------------------------------------------------------------
const PDV = ({ merceariaId, supabaseProp }) => {
    // --- (Estados) ---
    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [total, setTotal] = useState(0.00);
    const [loadingBusca, setLoadingBusca] = useState(false);
    const [showPagamentoModal, setShowPagamentoModal] = useState(false);
    const [loadingVenda, setLoadingVenda] = useState(false);
    const [vendaStatus, setVendaStatus] = useState(null);
    const [itemParaQuantificar, setItemParaQuantificar] = useState(null);
    const [inputQuantidade, setInputQuantidade] = useState('1');
    const [buscaIndex, setBuscaIndex] = useState(-1);
    const [editIndex, setEditIndex] = useState(null);
    const inputBuscaRef = useRef(null);
    const modalQuantidadeInputRef = useRef(null);
    const btnFinalizarRef = useRef(null);
    const buscaResultadosRef = useRef(null);
    // --- (Hooks de Efeito) ---
    useEffect(() => {
        if (!showPagamentoModal && !itemParaQuantificar && editIndex === null) {
            inputBuscaRef.current?.focus();
        }
    }, [showPagamentoModal, itemParaQuantificar, editIndex]);
    useEffect(() => {
        if (itemParaQuantificar && modalQuantidadeInputRef.current) {
            modalQuantidadeInputRef.current.focus();
            modalQuantidadeInputRef.current.select();
        }
    }, [itemParaQuantificar]);
    useEffect(() => {
        const novoTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco_venda) * item.quantidade), 0);
        setTotal(novoTotal);
    }, [carrinho]);
    useEffect(() => {
        if (buscaIndex < 0 || !buscaResultadosRef.current) return;
        const lista = buscaResultadosRef.current;
        const itemSelecionado = lista.children[buscaIndex];
        if (itemSelecionado) {
            itemSelecionado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [buscaIndex]);
    // --- (Funções de Busca) ---
    const handleBuscaLive = async (termo) => {
        setTermoBusca(termo);
        setBuscaIndex(-1);
        if (termo.length < 2) { setResultadosBusca([]); return; }

        setLoadingBusca(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos/buscar-global?termo=${termo}`);
            if (!response.ok) throw new Error('Erro ao buscar');
            const data = await response.json();
            setResultadosBusca(data);
            if (data.length > 0) {
                setBuscaIndex(0);
            }
        } catch (err) { console.error(err);
        }
        finally { setLoadingBusca(false); }
    };
    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (buscaIndex > -1 && resultadosBusca[buscaIndex]) {
            handleItemSelecionado(resultadosBusca[buscaIndex]);
            return;
        }
        if (termoBusca.trim() === '' && carrinho.length > 0) {
            btnFinalizarRef.current?.focus();
            return;
        }
    };
    const handleBuscaKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setBuscaIndex(prev => Math.min(prev + 1, resultadosBusca.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setBuscaIndex(prev => Math.max(prev - 1, 0));
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setTermoBusca('');
            setResultadosBusca([]);
            setBuscaIndex(-1);
        }
    };

    // --- (Funções do Carrinho) ---
    const handleItemSelecionado = (produto) => {
        const estoqueAtual = parseFloat(produto.estoque_atual);
        if (estoqueAtual <= 0) {
            setVendaStatus({ tipo: 'erro', msg: `Produto '${produto.nome}' sem estoque!`});
            setTimeout(() => setVendaStatus(null), 3000);
            setTermoBusca('');
            setResultadosBusca([]);
            setBuscaIndex(-1);
            inputBuscaRef.current?.focus();
            return;
        }

        const qtdeJaNoCarrinho = carrinho
            .filter(item => item.id === produto.id)
            .reduce((acc, item) => acc + item.quantidade, 0);
        const qtdeAdicional = (produto.unidade_medida === 'kg') ? 0 : 1;
        if (qtdeAdicional > 0 && (qtdeJaNoCarrinho + qtdeAdicional) > estoqueAtual) {
            setVendaStatus({ tipo: 'erro', msg: `Estoque máximo de '${produto.nome}' atingido (${estoqueAtual} un.)`});
            setTimeout(() => setVendaStatus(null), 3000);
            setTermoBusca('');
            setResultadosBusca([]);
            setBuscaIndex(-1);
            inputBuscaRef.current?.focus();
            return;
        }

        if (produto.unidade_medida === 'kg') {
            setInputQuantidade('1.000');
        } else {
            setInputQuantidade('1');
        }
        setItemParaQuantificar(produto);

        setResultadosBusca([]);
        setTermoBusca('');
        setBuscaIndex(-1);
    };
    const handleConfirmarQuantidade = (e) => {
        e.preventDefault();
        const produto = itemParaQuantificar;
        const quantidadeNum = parseFloat(inputQuantidade) || 0;
        if (quantidadeNum <= 0) {
            setItemParaQuantificar(null);
            setEditIndex(null);
            inputBuscaRef.current?.focus();
            return;
        }

        const estoqueAtual = parseFloat(produto.estoque_atual);
        if (editIndex !== null) {
            const qtdeOutrosItens = carrinho
                .filter((item, index) => item.id === produto.id && index !== editIndex)
                .reduce((acc, item) => acc + item.quantidade, 0);
            if ((quantidadeNum + qtdeOutrosItens) > estoqueAtual) {
                setVendaStatus({ tipo: 'erro', msg: `Estoque máximo: ${estoqueAtual} ${produto.unidade_medida}`});
                setTimeout(() => setVendaStatus(null), 3000);
                return;
            }

            const novoCarrinho = [...carrinho];
            novoCarrinho[editIndex] = { ...produto, quantidade: quantidadeNum };
            setCarrinho(novoCarrinho);

        } else {
            const qtdeJaNoCarrinho = carrinho
                .filter(item => item.id === produto.id)
                .reduce((acc, item) => acc + item.quantidade, 0);
            if ((qtdeJaNoCarrinho + quantidadeNum) > estoqueAtual) {
                setVendaStatus({ tipo: 'erro', msg: `Estoque máximo: ${estoqueAtual} ${produto.unidade_medida}. (Já há ${qtdeJaNoCarrinho} no carrinho)`});
                setTimeout(() => setVendaStatus(null), 3000);
                setItemParaQuantificar(null);
                inputBuscaRef.current?.focus();
                return;
            }

            const itemExistenteIndex = carrinho.findIndex(item =>
                item.id === produto.id && item.unidade_medida === produto.unidade_medida
            );
            if (itemExistenteIndex > -1) {
                setCarrinho(carrinho.map((item, index) =>
                    index === itemExistenteIndex
                        ? { ...item, quantidade: item.quantidade + quantidadeNum }
                        : item
                ));
            } else {
                setCarrinho([...carrinho, { ...produto, quantidade: quantidadeNum }]);
            }
        }

        setItemParaQuantificar(null);
        setEditIndex(null);
        inputBuscaRef.current?.focus();
    };

    const handleFinalizarVenda = async (meioPagamento, clienteId) => {
        setLoadingVenda(true);
        setVendaStatus(null);

        const carrinhoMapeado = carrinho.map(item => ({
            id: item.id,
            quantidade: parseFloat(item.quantidade),
            preco_venda: parseFloat(item.preco_venda)
        }));
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/vendas/finalizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merceariaId: merceariaId, valor_total: total,
                    meio_pagamento: meioPagamento, carrinho: carrinhoMapeado,
                    clienteId: clienteId
                })
            });
            const result = await response.json();

            if (!response.ok) {
                 if (result.error && result.error.includes("check constraint")) {
                     throw new Error("Erro de estoque. Verifique as quantidades.");
                }
                 throw new Error(result.error || 'Erro desconhecido no backend');
            }

            setVendaStatus({ tipo: 'sucesso', msg: `Venda (${formatCurrency(total)}) registrada com sucesso!`});
            setCarrinho([]);
            setShowPagamentoModal(false);
        } catch (err) {
            console.error("Erro ao finalizar venda:", err);
            setVendaStatus({ tipo: 'erro', msg: `Falha ao registrar venda: ${err.message}`});
            setShowPagamentoModal(false);
        } finally {
            setLoadingVenda(false);
            setTimeout(() => setVendaStatus(null), 4000);
        }
    };

    const handleEditarItem = (item, index) => {
        setItemParaQuantificar(item);
        setInputQuantidade(item.quantidade.toString());
        setEditIndex(index);
    };
    const handleRemoverItem = (indexParaRemover) => {
        const novoCarrinho = carrinho.filter((_, index) => index !== indexParaRemover);
        setCarrinho(novoCarrinho);
        inputBuscaRef.current?.focus();
    };

    // =================================================================
    // --- 🎯 ATUALIZAÇÃO PRINCIPAL: O NOVO LAYOUT JSX ---
    // =================================================================
    return (
        <div className="pdv-novo-container">

            {/* --- MODAL DE QUANTIDADE (flutua sobre tudo) --- */}
            {itemParaQuantificar && (
                <div
                    className="pdv-modal-overlay">
                    <div className="pdv-modal-content">
                         <h4>{editIndex !== null ? 'Editar Item' : 'Adicionar Item'}</h4>
                        <p>{itemParaQuantificar.nome} ({formatCurrency(itemParaQuantificar.preco_venda)} / {itemParaQuantificar.unidade_medida})</p>
                        <form onSubmit={handleConfirmarQuantidade}>
                            <label htmlFor="quantidade">
                                {itemParaQuantificar.unidade_medida === 'kg' ? 'Peso (kg)' :
                                'Quantidade (un)'}
                            </label>
                            <input
                                id="quantidade"
                                ref={modalQuantidadeInputRef}
                                type="number"
                                step={itemParaQuantificar.unidade_medida === 'kg' ?
                                "0.001" : "1"}
                                min={itemParaQuantificar.unidade_medida === 'kg' ?
                                "0.001" : "1"}
                                value={inputQuantidade}
                                onChange={(e) => setInputQuantidade(e.target.value)}
                                className="modal-input-quantidade"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        setItemParaQuantificar(null);
                                        setEditIndex(null);
                                        inputBuscaRef.current?.focus();
                                    }
                                }}
                            />
                            <button type="submit" className="modal-btn-confirmar">
                                {editIndex !== null ?
                                'Atualizar (Enter)' : 'Adicionar (Enter)'}
                            </button>
                            <button type="button" className="modal-btn-cancelar"
                                onClick={() => {
                                    setItemParaQuantificar(null);
                                    setEditIndex(null);
                                    inputBuscaRef.current?.focus();
                                }}>
                                Cancelar (Esc)
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE PAGAMENTO (flutua sobre tudo) --- */}
            {showPagamentoModal && (
                <PagamentoModal
                    total={total}
                    onCancelar={() => setShowPagamentoModal(false)}
                    onFinalizar={handleFinalizarVenda}
                    loading={loadingVenda}
                    merceariaId={merceariaId}
                />
            )}

            {/* --- PAINEL ESQUERDO: BUSCA E RESULTADOS --- */}
            <div className="pdv-painel-busca">
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        ref={inputBuscaRef}
                        className="busca-input-pdv-novo"
                        placeholder="Digite o nome ou código de barras..."
                        value={termoBusca}
                        onChange={(e) => handleBuscaLive(e.target.value)}
                        onKeyDown={handleBuscaKeyDown}
                        disabled={loadingVenda}
                        autoComplete="off"
                    />
                </form>

                {/* --- Grid de Resultados --- */}
                <ul className="busca-resultados-grid" ref={buscaResultadosRef}>
                    {loadingBusca && <li className="grid-status">Buscando...</li>}

                    {!loadingBusca && resultadosBusca.length === 0 && termoBusca.length > 1 && (
                        <li className="grid-status">Nenhum produto encontrado para "{termoBusca}".</li>
                    )}

                    {resultadosBusca.map((produto, index) => (
                        <li
                            key={produto.id}
                            className={`produto-card ${index === buscaIndex ?
                            'resultado-selecionado' : ''}`}
                            onClick={() => handleItemSelecionado(produto)}
                            onMouseEnter={() => setBuscaIndex(index)}
                        >
                            <span className="produto-card-nome">{produto.nome}</span>
                            <span className="produto-card-preco">{formatCurrency(produto.preco_venda)}</span>
                            <span className="produto-card-estoque">
                                ({produto.estoque_atual} / {produto.unidade_medida})
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- PAINEL DIREITO: CARRINHO E TOTAL --- */}
            <div className="pdv-painel-carrinho">
                <div className="carrinho-header">
                    <h3>Resumo da Venda</h3>
                </div>

                {vendaStatus && (
                    <div className={`venda-status ${vendaStatus.tipo === 'erro' ?
                    'status-erro' : 'status-sucesso'}`}>
                        {vendaStatus.msg}
                    </div>
                )}

                <ul className="carrinho-lista-novo">
                    {carrinho.length === 0 ? (
                        <li className="carrinho-vazio-novo">
                            <span>🛒</span>
                            <p>O carrinho está vazio</p>
                            <small>Adicione produtos pelo painel de busca.</small>
                        </li>
                    ) : (
                        carrinho.map((item, index) => (
                            <li key={`${item.id}-${index}`} className="carrinho-item-novo">
                                <div className="item-info-wrapper" onClick={() => handleEditarItem(item, index)}>
                                    <span className="item-nome-novo">{item.nome}</span>
                                    <span className="item-qtde-novo">
                                        {item.unidade_medida === 'kg'
                                        ? `${parseFloat(item.quantidade).toFixed(3)} kg`
                                            : `${parseFloat(item.quantidade).toFixed(0)} un`}
                                        @ {formatCurrency(item.preco_venda)}
                                    </span>
                                </div>
                                <div className="item-preco-total">
                                    {formatCurrency(parseFloat(item.preco_venda) * item.quantidade)}
                                </div>
                                <button
                                    className="item-remover-btn-novo"
                                    onClick={() => handleRemoverItem(index)}
                                >
                                    &times;
                                </button>
                            </li>
                        ))
                    )}
                </ul>

                <div className="pdv-carrinho-footer">
                    <div className="pdv-total-display-novo">
                        <span>Total</span>
                        <h2>{formatCurrency(total)}</h2>
                    </div>
                    <button
                        ref={btnFinalizarRef}
                        className="btn-finalizar-novo"
                        onClick={() => setShowPagamentoModal(true)}
                        disabled={carrinho.length === 0 ||
                        loadingVenda}
                    >
                        Finalizar Venda (Enter)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PDV;
