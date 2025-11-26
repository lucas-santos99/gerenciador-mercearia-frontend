// ===== ModalRecebimento.jsx (FINAL CORRIGIDO) ========
import React, { useState, useEffect, useRef } from 'react';
import './ModalRecebimento.css';

const ModalRecebimento = ({ cliente, onClose, onConfirm }) => {
    
    const formatCurrency = (value) => {
        const number = parseFloat(value || 0);
        return number.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const saldoDevedor = parseFloat(cliente.saldo_devedor || 0);
    const [valorPago, setValorPago] = useState(
        saldoDevedor.toLocaleString('pt-BR', {useGrouping: false, minimumFractionDigits: 2})
    );
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paymentMethods = [
        { key: 'Dinheiro', label: 'Dinheiro' },
        { key: 'Pix', label: 'Pix' },
        { key: 'Debito', label: 'Débito' },
        { key: 'Credito', label: 'Crédito' }
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [meioPagamento, setMeioPagamento] = useState('Dinheiro');

    const inputValorRef = useRef(null);
    const pagamentoListaRef = useRef(null);
    const btnConfirmarRef = useRef(null);

    // Foca no input ao abrir
    useEffect(() => {
        inputValorRef.current?.focus();
        inputValorRef.current?.select();
    }, []);

    // Scroll suave na lista
    useEffect(() => {
        if (!pagamentoListaRef.current) return;
        const item = pagamentoListaRef.current.children[selectedIndex];
        if (item) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    // ========== CONTROLE DE TECLAS ==========
    const handleKeyDown = (e) => {

        // Fechar com ESC (global)
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }

        // Dentro do input
        if (document.activeElement === inputValorRef.current) {

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                pagamentoListaRef.current?.focus();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                pagamentoListaRef.current?.focus();
                return;
            }
        }

        // Dentro da lista UL
        if (document.activeElement === pagamentoListaRef.current) {

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newIndex = (selectedIndex + 1) % paymentMethods.length;
                setSelectedIndex(newIndex);
                setMeioPagamento(paymentMethods[newIndex].key);
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newIndex = (selectedIndex - 1 + paymentMethods.length) % paymentMethods.length;
                setSelectedIndex(newIndex);
                setMeioPagamento(paymentMethods[newIndex].key);
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                btnConfirmarRef.current?.focus();
                return;
            }
        }
    };

    // ========== SUBMIT ==========
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const valorFloat = parseFloat(valorPago.toString().replace(',', '.'));

        if (isNaN(valorFloat) || valorFloat <= 0) {
            setError('Valor inválido.');
            inputValorRef.current?.focus();
            return;
        }

        if (valorFloat > saldoDevedor + 0.01) {
            setError('Valor não pode exceder a dívida.');
            inputValorRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            await onConfirm(valorFloat, meioPagamento);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recebimento-modal-overlay">
            
            {/* BLOQUEIA CLIQUE FORA */}
            <div 
                className="recebimento-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Receber Pagamento de {cliente.nome}</h3>
                <p>Dívida Atual: <strong>{formatCurrency(saldoDevedor)}</strong></p>

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                    
                    {/* INPUT */}
                    <div className="form-group">
                        <label>Valor a Receber (Enter ↵)</label>
                        <input
                            ref={inputValorRef}
                            type="text"
                            value={valorPago}
                            onChange={(e) => setValorPago(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* LISTA DE MÉTODOS */}
                    <div className="form-group">
                        <label>Meio de Pagamento (⬆️ ⬇️)</label>
                        <ul 
                            className="recebimento-meios-lista"
                            ref={pagamentoListaRef}
                            tabIndex={0}
                        >
                            {paymentMethods.map((metodo, index) => (
                                <li
                                    key={metodo.key}
                                    className={`btn-meio-pagamento ${selectedIndex === index ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedIndex(index);
                                        setMeioPagamento(metodo.key);
                                        btnConfirmarRef.current?.focus();
                                    }}
                                >
                                    {metodo.label}
                                    {selectedIndex === index && <span className="indicador-enter">↩</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {error && <p className="recebimento-modal-error">{error}</p>}

                    {/* BOTÕES */}
                    <div className="recebimento-modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
                            Cancelar (Esc)
                        </button>
                        <button 
                            ref={btnConfirmarRef}
                            type="submit"
                            className="btn-confirmar"
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : 'Confirmar (Enter)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalRecebimento;
