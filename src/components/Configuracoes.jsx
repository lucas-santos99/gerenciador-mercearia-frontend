// ===== src/components/Configuracoes.jsx (MÁSCARAS E DESIGN NOVO) =====
import React, { useState, useEffect } from 'react';
import './Configuracoes.css';

const BACKEND_BASE_URL = 'http://localhost:3001';

// --- Helpers de Máscara ---
const mascaraCNPJ = (valor) => {
    return valor
        .replace(/\D/g, '') // Remove tudo o que não é dígito
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substr(0, 18); // Limita ao tamanho do CNPJ
};

const mascaraTelefone = (valor) => {
    let r = valor.replace(/\D/g, "");
    r = r.replace(/^0/, "");
    if (r.length > 10) {
        r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (r.length > 5) {
        r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (r.length > 2) {
        r = r.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
    } else {
        r = r.replace(/^(\d*)/, "($1");
    }
    return r;
};

const Configuracoes = ({ merceariaId, supabaseProp, onLogoUpdated, logoUrl }) => {
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        cnpj: '',
        telefone: '',
        email_contato: '',
        endereco_completo: '',
        logo_url: logoUrl || '' 
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false); 
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchDados = async () => {
            if (!merceariaId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/mercearias/dados/${merceariaId}`);
                if (!response.ok) throw new Error('Falha ao carregar dados da mercearia.');
                const data = await response.json();
                
                setFormData({
                    nome_fantasia: data.nome_fantasia || '',
                    cnpj: data.cnpj || '',
                    telefone: data.telefone || '',
                    email_contato: data.email_contato || '',
                    endereco_completo: data.endereco_completo || '',
                    logo_url: data.logo_url || '' 
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDados();
    }, [merceariaId]);

    // 🎯 HANDLER COM MÁSCARAS AUTOMÁTICAS
    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorFinal = value;

        if (name === 'cnpj') {
            valorFinal = mascaraCNPJ(value);
        } else if (name === 'telefone') {
            valorFinal = mascaraTelefone(value);
        }

        setFormData(prev => ({ ...prev, [name]: valorFinal }));
    };

    const handleUploadLogo = async (event) => {
        setError(null);
        setSuccess(null);
        if (!event.target.files || event.target.files.length === 0) return;
        if (!supabaseProp) {
            setError('Erro: Conexão com o Supabase não encontrada.');
            return;
        }

        const file = event.target.files[0];
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
        
        if (file.size > MAX_FILE_SIZE) {
            setError('Arquivo muito pesado. O limite é de 2 MB.');
            event.target.value = null; 
            return;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `public/${merceariaId}.${fileExt}`;
        setUploading(true);
        try {
            const { error: uploadError } = await supabaseProp.storage
                .from('logos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true 
                });

            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabaseProp.storage
                .from('logos')
                .getPublicUrl(filePath);
            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Não foi possível obter a URL pública da logo.');
            }

            const newLogoUrl = publicUrlData.publicUrl;
            setFormData(prev => ({ ...prev, logo_url: newLogoUrl }));
            if (onLogoUpdated) {
                onLogoUpdated(newLogoUrl);
            }
            
            setSuccess('Logo enviada! Clique em "Salvar Alterações" para confirmar.');
        } catch (err) {
            console.error("Erro no upload:", err);
            setError(`Falha no upload da logo: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/mercearias/dados/${merceariaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) 
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao salvar alterações.');
            
            if (onLogoUpdated) {
                onLogoUpdated(result.logo_url);
            }
            
            setSuccess('Dados da mercearia atualizados com sucesso!');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <div className="configuracoes-container">
            <h3>Dados da Mercearia</h3>
            <p>Estas informações aparecerão nos seus recibos e relatórios.</p>

            <form className="configuracoes-form-grid" onSubmit={handleSubmit}>
                
                {/* Coluna 1: Dados */}
                <div className="form-coluna-dados">
                    
                    <div className="form-group">
                        <label htmlFor="nome_fantasia">Nome Fantasia *</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🏪</span>
                            <input type="text" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} required placeholder="Ex: Mercearia do João" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cnpj">CNPJ</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📝</span>
                                <input type="text" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" maxLength={18} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="telefone">Telefone / WhatsApp</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📱</span>
                                <input type="text" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email_contato">Email de Contato</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📧</span>
                            <input type="email" id="email_contato" name="email_contato" value={formData.email_contato} onChange={handleChange} placeholder="contato@mercearia.com" />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="endereco_completo">Endereço Completo</label>
                        <textarea id="endereco_completo" name="endereco_completo" value={formData.endereco_completo} onChange={handleChange} rows="3" placeholder="Ex: Rua das Flores, 123, Centro - Cidade/UF" />
                    </div>
                
                </div>

                {/* Coluna 2: Logo */}
                <div className="form-coluna-logo">
                    <label>Logo da Marca</label>
                    <div className="logo-preview">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo Atual" />
                        ) : (
                            <span>Sem Logo</span>
                        )}
                    </div>
                    
                    <input 
                        type="file" 
                        id="logo-upload" 
                        onChange={handleUploadLogo} 
                        disabled={uploading}
                        accept="image/png, image/jpeg" 
                    />
                    <label htmlFor="logo-upload" className="btn-upload-logo">
                        {uploading ? 'Enviando...' : '📸 Escolher Imagem'}
                    </label>
                    
                    <small>
                        <b>Dica:</b> Use uma imagem PNG com fundo transparente para melhor resultado. <br />
                        Tamanho máximo: 2 MB.
                    </small>
                </div>

                {/* Ações do Formulário */}
                <div className="form-actions">
                    {error && <p className="config-error">{error}</p>}
                    {success && <p className="config-success">{success}</p>}
                    
                    <button type="submit" className="btn-salvar-config" disabled={saving || uploading}>
                        {saving ? 'Salvando...' : '💾 Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Configuracoes;