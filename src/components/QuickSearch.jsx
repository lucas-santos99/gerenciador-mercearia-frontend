import React, { useState, useEffect, useRef } from 'react';
import './QuickSearch.css'; 

const BACKEND_BASE_URL = 'http://localhost:3001';

const QuickSearch = ({ merceariaId, onProdutoSelecionado, onClose }) => {
    const [termo, setTermo] = useState('');
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // --- ESTADOS E REFS PARA NAVEGAÇÃO POR SETA ---
    const [buscaIndex, setBuscaIndex] = useState(-1); // -1 = nada selecionado
    const resultadosRef = useRef(null); // Ref para a <ul>
    // --------------------------------------------------------

    const debounceTimeout = useRef(null);
    const modalContentRef = useRef(null); 
    const inputRef = useRef(null); 

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]); 

    // --- Efeito para rolar a lista de busca (Scroll) ---
    useEffect(() => {
        if (buscaIndex < 0 || !resultadosRef.current) return;
        
        const lista = resultadosRef.current;
        const itemSelecionado = lista.children[buscaIndex]; 

        if (itemSelecionado) {
            itemSelecionado.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest' 
            });
        }
    }, [buscaIndex]); 

    // --- Handler de Teclas (Esc, Setas, Enter) ---
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setBuscaIndex(prev => Math.min(prev + 1, resultados.length - 1));
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setBuscaIndex(prev => Math.max(prev - 1, 0));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            // CORREÇÃO: Se um item estiver selecionado (índice > -1), seleciona ele
            if (buscaIndex > -1 && resultados[buscaIndex]) {
                handleSelecionar(resultados[buscaIndex]);
            }
        }
    };

    // --- Função de busca (incluindo a correção da seleção automática) ---
    const handleBusca = (e) => {
        const valorBusca = e.target.value;
        setTermo(valorBusca);
        setBuscaIndex(-1); // Reseta a seleção da seta ao digitar
        
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (valorBusca.length < 2) {
            setResultados([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        debounceTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos/buscar-global?termo=${valorBusca}`);
                if (!response.ok) throw new Error('Erro na busca');
                const data = await response.json();
                setResultados(data);

                // 🎯 CORREÇÃO CRÍTICA: Selecionar o primeiro item automaticamente
                if (data.length > 0) {
                    setBuscaIndex(0); // Seleciona o primeiro resultado (índice 0)
                } else {
                    setBuscaIndex(-1); 
                }

            } catch (err) {
                console.error(err);
                setResultados([]); 
            } finally {
                setLoading(false);
            }
        }, 300); 
    };

    // Função chamada ao clicar em um item (Mantida)
    const handleSelecionar = (produto) => {
        onProdutoSelecionado(produto); 
    };

    return (
        <div className="qs-modal-overlay"> 
            <div className="qs-modal-content" ref={modalContentRef}>
                
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Buscar produto global... (Esc para fechar)" 
                    className="qs-search-bar"
                    value={termo}
                    onChange={handleBusca}
                    onKeyDown={handleKeyDown} 
                />
                
                {/* Lista de Resultados com Ref e Classe de seleção */}
                {(resultados.length > 0 || loading || termo.length > 1) && (
                    <ul className="quick-search-results" ref={resultadosRef}>
                        {loading && <li className="qs-info-item">Buscando...</li>}
                        
                        {!loading && resultados.length === 0 && termo.length > 1 && (
                             <li className="qs-info-item">Nenhum produto encontrado.</li>
                        )}

                        {resultados.map((produto, index) => (
                            <li 
                                key={produto.id} 
                                className={`qs-result-item ${index === buscaIndex ? 'selecionado' : ''}`}
                                onClick={() => handleSelecionar(produto)}
                                onMouseEnter={() => setBuscaIndex(index)} 
                            >
                                <span className="qs-nome">{produto.nome}</span>
                                <span className="qs-categoria">{produto.nome_categoria || 'Sem Categoria'}</span>
                                <span className="qs-preco">R$ {parseFloat(produto.preco_venda).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default QuickSearch;