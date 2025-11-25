// ======= ProdutoList.jsx (COMPLETO + BUSCA WILDCARD %) ======
import React, { useState, useEffect, useRef } from 'react';
import './ProdutoList.css';
import ProdutoModal from './ProdutoModal';
import CategoriaModal from './CategoriaModal';
// 🎯 1. IMPORTAÇÃO DA BIBLIOTECA EXCEL
import * as XLSX from 'xlsx';

const BACKEND_BASE_URL = 'http://localhost:3001';

// --- (Helper de Formatação de Moeda) ---
const formatCurrency = (value) => {
    const number = parseFloat(value || 0);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- (Helper de Formatação de Estoque) ---
const formatarEstoque = (estoque, unidade) => {
    const valor = parseFloat(estoque);
    if (unidade === 'kg') {
        return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
    }
    return `${Math.trunc(valor)} un.`;
};

// --- HELPER: Normalizar Texto (Remove Acentos) ---
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD") // Separa acentos das letras
        .replace(/[\u0300-\u036f]/g, ""); // Remove os acentos
};
// -------------------------------------------------------------------


const ProdutoList = ({ merceariaId, shouldFocusSearch, onFocusHandled }) => {
    // --- Estados Principais ---
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- Estados de UI (Interface) ---
    const [categoriaAtiva, setCategoriaAtiva] = useState('todos'); 
    const [termoBusca, setTermoBusca] = useState('');
    const [produtoFocadoId, setProdutoFocadoId] = useState(null); 

    // --- Estados dos Modais ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null); 
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
    
    // 🎯 Ref para o campo de busca (F7)
    const searchInputRef = useRef(null);

    // --- 1. FUNÇÃO PARA BUSCAR TUDO ---
    const fetchData = async (focarNoProdutoId = null) => {
        setLoading(true);
        setError(null); 
        try {
            const [produtosRes, categoriasRes] = await Promise.all([
                fetch(`${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos`),
                fetch(`${BACKEND_BASE_URL}/api/categorias/${merceariaId}`)
            ]);
            if (!produtosRes.ok) throw new Error(`Falha ao buscar produtos (Status: ${produtosRes.status})`);
            if (!categoriasRes.ok) throw new Error('Falha ao buscar categorias');
            const produtosData = await produtosRes.json();
            const categoriasData = await categoriasRes.json();
            setProdutos(produtosData);
            setCategorias(categoriasData);
            if (focarNoProdutoId) {
                setProdutoFocadoId(focarNoProdutoId);
                const produtoSalvo = produtosData.find(p => p.id === focarNoProdutoId);
                if (produtoSalvo) {
                    setCategoriaAtiva(produtoSalvo.categoria_id || 'sem_categoria');
                }
            }
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [merceariaId]);
    
    // --- Efeito de Foco/Rolagem (Sem alterações) ---
    useEffect(() => {
        if (produtoFocadoId) {
            const elemento = document.getElementById(`produto-card-${produtoFocadoId}`);
            if (elemento) {
                elemento.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
                const timer = setTimeout(() => {
                    setProdutoFocadoId(null);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [produtoFocadoId, produtos]);
    
    // 🎯 EFEITO PARA O ATALHO F7
    useEffect(() => {
        if (!loading && shouldFocusSearch && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current.focus();
                if (onFocusHandled) {
                    onFocusHandled();
                }
            }, 100);
        }
    }, [shouldFocusSearch, loading]);

    // --- 2. FUNÇÕES DE CONTROLE DO MODAL (PRODUTO) ---
    const abrirModalAdicionar = () => {
        setProdutoSelecionado(null);
        setIsModalOpen(true);
    };
    const abrirModalEditar = (produto) => {
        setProdutoSelecionado(produto); 
        setIsModalOpen(true);
    };
    const fecharModal = () => {
        setIsModalOpen(false);
        setProdutoSelecionado(null); 
    };

    // --- 3. FUNÇÃO DE CALLBACK (Produto Salvo) ---
    const handleProdutoSalvo = (produtoSalvo) => {
        fetchData(produtoSalvo.id);
    };

    // --- 4. FUNÇÃO DE DELETAR PRODUTO ---
    const handleDeletarProduto = async (produtoId) => {
        if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
        setError(null); 
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos/${produtoId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.error || 'Erro desconhecido ao excluir');
            }
            setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== produtoId));
        } catch (err) {
            console.error("Erro ao deletar produto:", err);
            setError(err.message); 
        }
    };
    
    // 🎯 FUNÇÃO DE IMPRIMIR
    const handleImprimir = () => {
        window.print();
    };

    // 🎯 2. FUNÇÃO DE EXPORTAR PARA EXCEL (DETALHADA)
    const handleExportarExcel = () => {
        if (produtos.length === 0) {
            alert("Não há produtos para exportar.");
            return;
        }
        
        // Prepara os dados formatados
        const dadosFormatados = produtos.map(prod => {
            const catNome = categorias.find(c => c.id === prod.categoria_id)?.nome || 'Sem Categoria';
            const custo = parseFloat(prod.preco_custo || 0);
            const venda = parseFloat(prod.preco_venda || 0);
            const lucroUnidade = venda - custo;

            return {
                "Categoria": catNome,
                "Produto": prod.nome,
                "Cód. Barras": prod.codigo_barras || '',
                "Estoque": parseFloat(prod.estoque_atual),
                "Unid.": prod.unidade_medida,
                "Custo (R$)": formatCurrency(custo),
                "Venda (R$)": formatCurrency(venda),
                "Lucro p/ Unid. (Est.)": formatCurrency(lucroUnidade)
            };
        });

        // Ordena por Categoria e depois por Nome
        dadosFormatados.sort((a, b) => {
            if (a["Categoria"] < b["Categoria"]) return -1;
            if (a["Categoria"] > b["Categoria"]) return 1;
            return a["Produto"].localeCompare(b["Produto"]);
        });

        // Cria a planilha
        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        
        // Ajusta largura das colunas
        const colWidths = [
            { wch: 20 }, // Categoria
            { wch: 30 }, // Produto
            { wch: 15 }, // Cód. Barras
            { wch: 10 }, // Estoque
            { wch: 8 },  // Unid.
            { wch: 15 }, // Custo
            { wch: 15 }, // Venda
            { wch: 20 }  // Lucro
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque Geral");
        
        // Baixa o arquivo
        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        XLSX.writeFile(workbook, `Estoque_Mercearia_${dataHoje}.xlsx`);
    };


    // --- 5. LÓGICA DE FILTRAGEM (ATUALIZADA COM %) ---
    const produtosFiltrados = produtos.filter(produto => {
        // 1. Filtro de Categoria
        let categoriaMatch = false;
        if (categoriaAtiva === 'todos') {
            categoriaMatch = true;
        } else if (categoriaAtiva === 'sem_categoria') {
            categoriaMatch = !produto.categoria_id;
        } else {
            categoriaMatch = produto.categoria_id === categoriaAtiva;
        }

        // 🎯 2. Filtro de Busca (AGORA SUPORTA WILDCARD %)
        let buscaMatch = true;
        const termoLimpo = termoBusca.trim();
        
        if (termoLimpo.length > 0) {
            const lowerTermo = normalizeText(termoLimpo);
            const nome = normalizeText(produto.nome);
            const codigo = produto.codigo_barras ? produto.codigo_barras.toLowerCase() : '';

            // Se tem '%' na busca, usamos lógica de Regex
            if (lowerTermo.includes('%')) {
                // Transforma "sab%po" em "sab.*po" para Regex
                // Escapa caracteres especiais de regex, exceto o %
                const regexPattern = lowerTermo
                    .split('%')
                    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape seguro
                    .join('.*'); // O % vira "qualquer coisa no meio"
                
                const regex = new RegExp(regexPattern, 'i'); // 'i' para case-insensitive
                
                // Busca no nome (o código de barras geralmente é exato, mas podemos incluir)
                buscaMatch = regex.test(nome) || regex.test(codigo);

            } else {
                // Busca normal (contém o texto)
                buscaMatch = nome.includes(lowerTermo) || codigo.includes(lowerTermo);
            }
        }

        return categoriaMatch && buscaMatch;
    });
    const produtosSemCategoria = produtos.filter(p => !p.categoria_id).length;


    // --- RENDERIZAÇÃO ---
    if (loading) {
        return <div>Carregando produtos e categorias...</div>;
    }

    return (
        <div className="estoque-layout-container">
            
            {/* --- MODAIS (flutuam sobre tudo) --- */}
            {isModalOpen && (
                <ProdutoModal 
                    merceariaId={merceariaId}
                    onClose={fecharModal}
                    onProdutoSalvo={handleProdutoSalvo}
                    produtoParaEditar={produtoSelecionado} 
                />
            )}
            {isCategoriaModalOpen && (
                <CategoriaModal
                    merceariaId={merceariaId}
                    onClose={() => setIsCategoriaModalOpen(false)}
                    onCategoriaSalva={() => {
                        fetchData(); 
                        setIsCategoriaModalOpen(false);
                    }}
                />
            )}

            {/* --- 1. COLUNA DA ESQUERDA (CATEGORIAS) --- */}
            <nav className="estoque-sidebar-categorias no-print"> {/* 🎯 ADD no-print */}
                <h4>Categorias</h4>
                <a 
                    href="#todos"
                    className={`cat-filtro-item ${categoriaAtiva === 'todos' ?
                        'active' : ''}`}
                    onClick={(e) => { e.preventDefault();
                        setCategoriaAtiva('todos'); }}
                >
                    Todos os Produtos
                    <span>{produtos.length}</span>
                </a>
                
                {categorias.map(cat => (
                    <a 
                        key={cat.id}
                        href={`#${cat.id}`}
                        className={`cat-filtro-item ${categoriaAtiva === cat.id ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setCategoriaAtiva(cat.id); }}
                    >
                        {cat.nome}
                        <span>{produtos.filter(p => p.categoria_id === cat.id).length}</span>
                    </a>
                ))}

                {produtosSemCategoria > 0 && (
                    <a 
                        href="#sem_categoria"
                        className={`cat-filtro-item ${categoriaAtiva === 'sem_categoria' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setCategoriaAtiva('sem_categoria');
                        }}
                    >
                        Sem Categoria
                        <span>{produtosSemCategoria}</span>
                    </a>
                )}
            </nav>


<main className="estoque-main-content">
    
    {/* Header da Direita (Busca e Botões) */}
    <div className="estoque-header no-print"> {/* 🎯 Agora é Grid: Input e Botoes */}
        
        {/* INPUT DE BUSCA */}
        <input 
            ref={searchInputRef} // 🎯 REF DO F7
            type="text"
            placeholder="Buscar produtos por nome ou código..."
            className="estoque-busca-input"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
        />
        
        {/* GRUPO DE BOTÕES */}
        <div className="header-botoes">
            <button className="btn-adicionar" onClick={handleExportarExcel} style={{ backgroundColor: '#217346', marginRight: '10px' }} title="Baixar Planilha Excel">
                📥 Excel
            </button>
            
            <button className="btn-adicionar" onClick={handleImprimir} style={{ backgroundColor: '#6c757d', marginRight: '10px' }} title="Imprimir Tela">
                🖨️
            </button>
            
            <button className="btn-adicionar btn-categoria" onClick={() => setIsCategoriaModalOpen(true)}>
                + Nova Categoria
            </button>
            <button className="btn-adicionar" onClick={abrirModalAdicionar}>
                + Adicionar Produto
            </button>
        </div>
    </div>
    {/* ... o restante do JSX do main content ... */}

                {error && <p className="estoque-error">Erro: {error}</p>}

                {/* Grid de Produtos */}
                <div className="estoque-grid-produtos">
                    {produtosFiltrados.length === 0 ?
                        (
                        <div className="estoque-vazio">
                            <p>Nenhum produto encontrado.</p>
                            <small>Tente ajustar os filtros de busca ou categoria.</small>
                        </div>
                    ) : (
                        produtosFiltrados.map(produto => (
                            <ProdutoCard 
                                key={produto.id}
                                produto={produto}
                                onEditar={abrirModalEditar}
                                onDeletar={handleDeletarProduto}
                                isFocado={produto.id === produtoFocadoId}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};


// -------------------------------------------------------------------
// --- SUB-COMPONENTE: ProdutoCard ---
// -------------------------------------------------------------------
const ProdutoCard = ({ produto, onEditar, onDeletar, isFocado }) => {
    
    // Lógica do Semáforo de Estoque
    let statusClasse = 'estoque-ok';
    const estoque = parseFloat(produto.estoque_atual);
    const minimo = parseFloat(produto.estoque_minimo);
    
    if (estoque <= 0) {
        statusClasse = 'estoque-critico';
    } else if (estoque <= minimo) {
        statusClasse = 'estoque-baixo';
    }

    return (
        <div 
            id={`produto-card-${produto.id}`} 
            className={`produto-card-novo ${isFocado ? 'focado' : ''}`}
        >
            <div className="card-corpo" onClick={() => onEditar(produto)}>
                <span className={`card-status-estoque ${statusClasse}`}>
                    {formatarEstoque(produto.estoque_atual, produto.unidade_medida)}
                </span>
                
                <div className="card-nome-produto">
                    {produto.nome}
                </div>
                
                <div className="card-codigo-produto">
                    {produto.codigo_barras || 'Sem código'}
                </div>

                <div className="card-precos">
                    <div className="preco-item">
                        <span className="preco-label">Custo</span>
                        <span className="preco-valor">{formatCurrency(produto.preco_custo)}</span>
                    </div>
                    <div className="preco-item">
                        <span className="preco-label">Venda</span>
                        <span className="preco-valor venda">{formatCurrency(produto.preco_venda)}</span>
                    </div>
                </div>
            </div>

            {/* 🎯 ADD no-print */}
            <div className="card-acoes no-print">
                <button className="btn-acao-card btn-editar" onClick={() => onEditar(produto)}>
                    Editar
                </button>
                <button className="btn-acao-card btn-excluir" onClick={() => onDeletar(produto.id)}>
                    Excluir
                </button>
            </div>
        </div>
    );
};

export default ProdutoList;