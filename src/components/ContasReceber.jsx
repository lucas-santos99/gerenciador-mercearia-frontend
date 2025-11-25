import React, { useState, useEffect } from 'react';

// Formata a data para pt-BR
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return 'Data Inválida';
    }
};

const ContasReceber = ({ merceariaId, BACKEND_BASE_URL }) => {
    const [fiados, setFiados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // --- FUNÇÃO PARA BUSCAR AS CONTAS A RECEBER (FIADO) ---
    const fetchFiados = async () => {
        setLoading(true);
        try {
            // Rota para listar contas a receber (Fiado)
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/receber/${merceariaId}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            setFiados(data);
            setError(null);
        } catch (err) {
            console.error("Erro ao buscar fiados:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Roda a busca na montagem do componente
    useEffect(() => {
        fetchFiados();
    }, [merceariaId, BACKEND_BASE_URL]); 

    // --- FUNÇÃO PARA MARCAR O FIADO COMO RECEBIDO (LIQUIDAR) ---
    const handleReceberFiado = async (fiadoId) => {
        
        setSaving(true);
        try {
            // Rota de PUT para liquidar Fiado
            const response = await fetch(`${BACKEND_BASE_URL}/api/financeiro/receber/${fiadoId}/liquidar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merceariaId }) 
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Erro ao liquidar fiado.');
            }

            // Remove o item liquidado da lista
            setFiados(prev => prev.filter(f => f.id !== fiadoId));

        } catch (err) {
            setError(`Falha ao liquidar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };
    
    // --- Renderização ---

    return (
        <div className="contas-receber-section">
            <h4 className="section-title">Fiado dos Clientes (Contas a Receber Pendentes)</h4>
            
            {error && <p className="financeiro-error">Erro: {error}</p>}

            {loading ? (
                <div className="financeiro-loading">Carregando fiados pendentes...</div>
            ) : (
                <table className="contas-tabela">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Vencimento</th>
                            <th>Valor (R$)</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fiados.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum fiado pendente encontrado.</td></tr>
                        ) : (
                            fiados.map(fiado => (
                                <tr key={fiado.id} className={fiado.status === 'atrasado' ? 'conta-atrasada' : ''}>
                                    <td>{fiado.nome_cliente}</td>
                                    <td>{fiado.descricao}</td>
                                    <td>{formatDate(fiado.data_vencimento)}</td>
                                    <td>R$ {parseFloat(fiado.valor).toFixed(2)}</td>
                                    <td className={`status-${fiado.status.toLowerCase()}`}>{fiado.status.toUpperCase()}</td>
                                    <td>
                                        <button onClick={() => handleReceberFiado(fiado.id)} disabled={saving} className="btn-receber">
                                            {saving ? '...' : 'Receber Pagamento'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ContasReceber;