// ====== Dashboard.jsx (CORRIGIDO PARA PRODUÇÃO) =======
import React, { useState, useEffect } from 'react'; 
import './Dashboard.css';
import ProdutoList from './ProdutoList'; 
import PDV from './PDV';
import DividasList from './DividasList'; 
import Financeiro from './Financeiro'; 
import Configuracoes from './Configuracoes';

const Dashboard = ({ session, supabaseProp, onLogout, logoUrl, onLogoUpdated, nomeFantasia }) => {

    const supabase = supabaseProp;
    const merceariaId = session?.user?.id; // VALIDADO ANTES DA RENDERIZAÇÃO

    const [paginaAtiva, setPaginaAtiva] = useState('pdv'); 
    const [produtoFocadoId, setProdutoFocadoId] = useState(null);
    const [showQuickSearch, setShowQuickSearch] = useState(false);
    const [shouldFocusSearch, setShouldFocusSearch] = useState(false); 

    // 🎯 ESTADO DO TEMA (DARK MODE)
    const [theme, setTheme] = useState('light');

    // 🎯 EFEITO: CARREGAR TEMA AO INICIAR
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // 🎯 FUNÇÃO DE ALTERNAR TEMA
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // --- Trocar de Página ---
    const handleChangePage = (pagina) => {
        setPaginaAtiva(pagina);

        // remove focus de qualquer campo ativo
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    };

    // --- Atalhos F2 a F7 ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'F2':
                    e.preventDefault();
                    handleChangePage('pdv');
                    break;
                case 'F3':
                    e.preventDefault();
                    handleChangePage('estoque');
                    break;
                case 'F4':
                    e.preventDefault();
                    handleChangePage('fiado');
                    break;
                case 'F5':
                    e.preventDefault();
                    handleChangePage('financeiro');
                    break;
                case 'F6':
                    e.preventDefault();
                    handleChangePage('config');
                    break;
                case 'F7':
                    e.preventDefault();
                    if (paginaAtiva !== 'estoque') {
                        handleChangePage('estoque');
                    }
                    setShouldFocusSearch(true);
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);

    }, [paginaAtiva]);

    // Focar busca automaticamente no estoque
    useEffect(() => {
        if (paginaAtiva === 'estoque' && shouldFocusSearch === false) {
            setShouldFocusSearch(true);
        }
    }, [paginaAtiva]);

    const handleProdutoSelecionado = (produto) => {
        setProdutoFocadoId(produto.id);
        handleChangePage('estoque');
        setShowQuickSearch(false);
    };

    const handleLogoutClick = async () => {
        if (onLogout) {
            await onLogout();
        }
    };

    const handleFocusSearchHandled = () => {
        setShouldFocusSearch(false);
    };

    // === RENDERIZAÇÃO DAS PÁGINAS ===
    const renderizarPagina = () => {

        if (!merceariaId) {
            return <div>Carregando dados da mercearia...</div>;
        }

        switch (paginaAtiva) {
            case 'pdv':
                return (
                    <PDV 
                        merceariaId={merceariaId} 
                        supabaseProp={supabase} 
                    />
                );

            case 'estoque':
                return (
                    <ProdutoList 
                        merceariaId={merceariaId}
                        produtoFocadoId={produtoFocadoId}
                        setProdutoFocadoId={setProdutoFocadoId}
                        shouldFocusSearch={shouldFocusSearch}
                        onFocusHandled={handleFocusSearchHandled}
                    />
                );

            case 'fiado':
                return (
                    <DividasList merceariaId={merceariaId} />
                );

            case 'financeiro':
                return (
                    <Financeiro 
                        key="financeiro-reset-001"
                        merceariaId={merceariaId}
                        logoUrl={logoUrl}
                        nomeFantasia={nomeFantasia}
                    />
                );

            case 'config':
                return (
                    <Configuracoes 
                        merceariaId={merceariaId}
                        supabaseProp={supabase}
                        onLogoUpdated={onLogoUpdated}
                        logoUrl={logoUrl}
                    />
                );

            default:
                return (
                    <PDV 
                        merceariaId={merceariaId}
                        supabaseProp={supabase}
                    />
                );
        }
    };

    const getTituloPagina = () => {
        switch (paginaAtiva) {
            case 'pdv': return 'PDV (Caixa)';
            case 'estoque': return 'Estoque / Produtos';
            case 'fiado': return 'Clientes / Fiado';
            case 'financeiro': return 'Financeiro';
            case 'config': return 'Configurações';
            default: return 'PDV';
        }
    };

    return (
        <div className="dashboard-container">

            <div className="sidebar">
                <div className="sidebar-logo-container">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="sidebar-logo" />
                    ) : (
                        <span>{nomeFantasia || 'Carregando...'}</span>
                    )}
                </div>
                
                <nav className="sidebar-nav">
                    <a href="#pdv" className={`nav-item ${paginaAtiva === 'pdv' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); handleChangePage('pdv'); }}>
                        🛒 PDV (Caixa) <span className="nav-atalho">(F2)</span>
                    </a>
                    <a href="#estoque" className={`nav-item ${paginaAtiva === 'estoque' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); handleChangePage('estoque'); }}>
                        📦 Estoque <span className="nav-atalho">(F3)</span>
                    </a>
                    <a href="#fiado" className={`nav-item ${paginaAtiva === 'fiado' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); handleChangePage('fiado'); }}>
                        👥 Clientes <span className="nav-atalho">(F4)</span>
                    </a>
                    <a href="#financeiro" className={`nav-item ${paginaAtiva === 'financeiro' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); handleChangePage('financeiro'); }}>
                        💰 Financeiro <span className="nav-atalho">(F5)</span>
                    </a>
                    <a href="#config" className={`nav-item ${paginaAtiva === 'config' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); handleChangePage('config'); }}>
                        ⚙️ Configurações <span className="nav-atalho">(F6)</span>
                    </a>
                </nav>
                
                <div className="sidebar-footer">

                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        {theme === 'light' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
                    </button>

                    <p className="user-email">{session?.user?.email}</p> 

                    <button onClick={handleLogoutClick} className="logout-button">
                        Sair (Logout)
                    </button>
                </div>
            </div>

            <div className="main-content">
                <header className="main-header">
                    <h2>{getTituloPagina()}</h2>
                </header>
                <div className="content-area">
                    {renderizarPagina()}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
