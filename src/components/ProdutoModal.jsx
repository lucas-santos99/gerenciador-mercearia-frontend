// ===== ProdutoModal.jsx (Atualizado com "Esc" e sem clique-fora) =====
import React, { useState, useEffect, useRef } from 'react'; // 🎯 useRef foi importado
import './ProdutoModal.css'; 

const BACKEND_BASE_URL = 'http://localhost:3001';

const ProdutoModal = ({ merceariaId, onClose, onProdutoSalvo, produtoParaEditar }) => {
    
    // --- (Estados existentes) ---
    const [formData, setFormData] = useState({
        nome: '',
        codigo_barras: '',
        estoque_atual: 0,
        estoque_minimo: 10,
        preco_custo: 0.00,
        preco_venda: 0.00,
        categoria_id: '',
        unidade_medida: 'un',
    });
    const [categorias, setCategorias] = useState([]); 
    const [loadingCategorias, setLoadingCategorias] = useState(true);
    const [showAddCategoria, setShowAddCategoria] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
    const [loadingNovaCategoria, setLoadingNovaCategoria] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isEditMode = produtoParaEditar !== null;

    // 🎯 NOVO: Ref para o input de nome (para focar)
    const nomeInputRef = useRef(null);

    // --- 1. BUSCAR CATEGORIAS E PREENCHER FORMULÁRIO ---
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/categorias/${merceariaId}`);
                if (!response.ok) throw new Error('Erro ao buscar categorias');
                const data = await response.json();
                setCategorias(data);
            } catch (err) {
                console.error("Erro buscando categorias:", err);
                setError("Não foi possível carregar as categorias.");
            } finally {
                setLoadingCategorias(false);
            }
        };
        
        fetchCategorias();

        if (isEditMode) {
            // (Lógica de preencher o form de edição - sem alteração)
            setFormData({
                nome: produtoParaEditar.nome || '',
                codigo_barras: produtoParaEditar.codigo_barras || '',
                estoque_atual: parseFloat(produtoParaEditar.estoque_atual) || 0,
                estoque_minimo: parseFloat(produtoParaEditar.estoque_minimo) || 10,
                preco_custo: parseFloat(produtoParaEditar.preco_custo) || 0.00,
                preco_venda: parseFloat(produtoParaEditar.preco_venda) || 0.00,
                categoria_id: produtoParaEditar.categoria_id || '',
                unidade_medida: produtoParaEditar.unidade_medida || 'un', 
            });
        }

        // Foca no input de nome ao abrir o modal
        nomeInputRef.current?.focus();

    }, [merceariaId, isEditMode, produtoParaEditar]); 

    // --- 🎯 NOVO: Efeito para fechar com "Esc" ---
    // (Este modal JÁ NÃO FECHAVA com clique fora)
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                if (showAddCategoria) {
                    // Se o mini-form de categoria estiver aberto, fecha ele primeiro
                    setShowAddCategoria(false);
                } else {
                    // Se não, fecha o modal principal
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose, showAddCategoria]); // Depende se o mini-form está aberto


    // --- 2. FUNÇÃO DE ATUALIZAÇÃO DO FORMULÁRIO (sem alteração) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorFinal = value;
        if (['estoque_atual', 'estoque_minimo', 'preco_custo', 'preco_venda'].includes(name)) {
            valorFinal = value.replace(',', '.');
        }
        setFormData(prevData => ({
            ...prevData,
            [name]: valorFinal === '' ? null : valorFinal 
        }));
    };

    // --- 3. FUNÇÃO PARA CRIAR NOVA CATEGORIA (sem alteração) ---
    const handleNovaCategoria = async () => {
        if (!novaCategoriaNome) return;
        setLoadingNovaCategoria(true);
        setError(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/categorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merceariaId: merceariaId, nome: novaCategoriaNome })
            });
            const novaCat = await response.json();
            if (!response.ok) throw new Error(novaCat.error || 'Erro ao salvar categoria');
            setCategorias(prev => [...prev, novaCat]);
            setFormData(prev => ({ ...prev, categoria_id: novaCat.id })); 
            setNovaCategoriaNome('');
            setShowAddCategoria(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingNovaCategoria(false);
        }
    };
    
    // --- 4. FUNÇÃO DE ENVIO DO PRODUTO (POST ou PUT) (sem alteração) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode 
            ? `${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos/${produtoParaEditar.id}`
            : `${BACKEND_BASE_URL}/api/mercearias/${merceariaId}/produtos`;
        try {
            const response = await fetch(url, {
                method: method, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const produtoSalvo = await response.json();
            if (!response.ok) {
                throw new Error(produtoSalvo.error || 'Erro ao salvar produto');
            }
            
            onProdutoSalvo(produtoSalvo, isEditMode);
            onClose(); 
        } catch (err) {
            console.error("Erro ao salvar produto:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- (Lógica de labels e steps - sem alteração) ---
    const estoqueStep = formData.unidade_medida === 'kg' ? "0.001" : "1";
    const labelPreco = formData.unidade_medida === 'kg' ? "Preço de Venda (R$ / kg) *" : "Preço de Venda (R$ / un) *";
    const labelCusto = formData.unidade_medida === 'kg' ? "Preço de Custo (R$ / kg)" : "Preço de Custo (R$ / un)";
    
    return (
        // 🎯 ATENÇÃO: O 'onClick' do overlay foi removido (se existisse)
        // O modal-content continua com o stopPropagation, que é uma boa prática.
        <div className="modal-overlay"> 
            <div className="modal-content" onClick={e => e.stopPropagation()}> 
                <h2>{isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
                
                {error && <p className="modal-error">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    {/* Linha 1: Nome */}
                    <div className="form-group">
                        <label htmlFor="nome">Nome do Produto *</label>
                        {/* 🎯 Adicionado o ref para foco inicial */}
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required ref={nomeInputRef} />
                    </div>
                    
                    {/* Linha 2: Código de Barras e Categoria (sem alteração) */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codigo_barras">Código de Barras (Opcional)</label>
                            <input type="text" id="codigo_barras" name="codigo_barras" value={formData.codigo_barras || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="categoria_id">Categoria (Opcional)</label>
                            <div className="categoria-input-group">
                                <select 
                                    id="categoria_id" name="categoria_id" value={formData.categoria_id || ''} 
                                    onChange={handleChange} disabled={loadingCategorias}
                                >
                                    <option value="">{loadingCategorias ? 'Carregando...' : 'Sem Categoria'}</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                                <button type="button" className="btn-add-cat" onClick={() => setShowAddCategoria(true)}>+</button>
                            </div>
                        </div>
                    </div>

                    {/* Mini-form de Categoria (sem alteração) */}
                    {showAddCategoria && (
                        <div className="add-categoria-form">
                            <input type="text" placeholder="Nome da Nova Categoria" value={novaCategoriaNome} onChange={(e) => setNovaCategoriaNome(e.target.value)} />
                            <button type="button" onClick={handleNovaCategoria} disabled={loadingNovaCategoria}>{loadingNovaCategoria ? '...' : 'Salvar'}</button>
                            <button type="button" onClick={() => setShowAddCategoria(false)}>Cancelar</button>
                        </div>
                    )}

                    {/* Linha 3: Estoque e Unidade (sem alteração) */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="unidade_medida">Vendido por *</label>
                            <select id="unidade_medida" name="unidade_medida" value={formData.unidade_medida} onChange={handleChange}>
                                <option value="un">Unidade (un)</option>
                                <option value="kg">Quilo (kg)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="estoque_atual">Estoque Atual *</label>
                            <input 
                                type="number" id="estoque_atual" name="estoque_atual" 
                                value={formData.estoque_atual} onChange={handleChange} 
                                required min="0" 
                                step={estoqueStep}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="estoque_minimo">Estoque Mínimo</label>
                            <input 
                                type="number" id="estoque_minimo" name="estoque_minimo" 
                                value={formData.estoque_minimo} onChange={handleChange} 
                                min="0" 
                                step={estoqueStep}
                            />
                        </div>
                    </div>

                    {/* Linha 4: Preços (sem alteração) */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="preco_custo">{labelCusto}</label>
                            <input type="number" id="preco_custo" name="preco_custo" value={formData.preco_custo} onChange={handleChange} min="0" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="preco_venda">{labelPreco}</label>
                            <input type="number" id="preco_venda" name="preco_venda" value={formData.preco_venda} onChange={handleChange} required min="0" step="0.01" />
                        </div>
                    </div>
                    
                    {/* Linha 5: Botões (sem alteração) */}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancelar" onClick={onClose} disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-salvar" disabled={loading}>
                            {loading ? 'Salvando...' : (isEditMode ? 'Atualizar Produto' : 'Salvar Produto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProdutoModal;