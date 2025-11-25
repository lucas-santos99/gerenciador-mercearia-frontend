// ===== src/components/CategoriaModal.jsx (NOVO ARQUIVO) =====
import React, { useState, useEffect, useRef } from 'react';
import './CategoriaModal.css'; // Vamos criar este CSS no próximo passo

const BACKEND_BASE_URL = 'http://localhost:3001';

const CategoriaModal = ({ merceariaId, onClose, onCategoriaSalva }) => {
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const modalRef = useRef(null);
    const inputRef = useRef(null);

    // Foca no input ao abrir
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Trava para fechar só com 'Esc' ou botão 'Cancelar'
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Função para salvar a nova categoria
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!nome.trim()) {
            setError('O nome da categoria é obrigatório.');
            setLoading(false);
            return;
        }

        try {
            // Usa a rota POST que já existe no seu backend
            const response = await fetch(`${BACKEND_BASE_URL}/api/categorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merceariaId: merceariaId,
                    nome: nome.trim()
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Falha ao criar categoria.');
            }

            // Sucesso!
            onCategoriaSalva(); // Avisa o ProdutoList para recarregar os dados
            onClose(); // Fecha este modal

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="categoria-modal-overlay"> 
            <div className="categoria-modal-content" ref={modalRef}> 
                
                <h3>Adicionar Nova Categoria</h3>
                <p>A nova categoria aparecerá na lista de estoque.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome-categoria">Nome da Categoria</label>
                        <input 
                            id="nome-categoria"
                            ref={inputRef}
                            type="text" 
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)} 
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {error && <p className="categoria-modal-error">{error}</p>}

                    <div className="categoria-modal-actions">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancelar (Esc)
                        </button>
                        <button 
                            type="submit" 
                            className="btn-save"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoriaModal;