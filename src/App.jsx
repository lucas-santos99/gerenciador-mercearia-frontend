// ===== App.jsx (CORRIGIDO 2025) =====
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TelaBloqueio from './components/TelaBloqueio'; 
import { createSupabaseClient } from './utils/supabaseClient'; 
import './App.css'; 

// Seleciona automaticamente o backend correto (local vs produção)
const BACKEND_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://mercearia-api.onrender.com";

// FUNÇÃO HELPER
const addCacheBuster = (url) => {
    if (!url) return null;
    return `${url.split('?')[0]}?t=${Date.now()}`;
};

function App() {
  const [supabaseClient, setSupabaseClient] = useState(null); 
  const [session, setSession] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [statusAssinatura, setStatusAssinatura] = useState(null); 
  const [logoUrl, setLogoUrl] = useState(null);
  const [nomeFantasia, setNomeFantasia] = useState(null);

  // --- EFEITO 1: Carrega a biblioteca E Seta o Listener ---
  useEffect(() => {
    const checkSupabase = () => {
      const supabaseGlobal = window.supabase || window['supabase'];
      if (supabaseGlobal && typeof supabaseGlobal.createClient === 'function') {
        const client = createSupabaseClient();
        if (client) {
            console.log("App.jsx: Cliente Supabase criado via CDN.");
            setSupabaseClient(client); 

            const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
              console.log("App.jsx: onAuthStateChange →", _event);
              setSession(session); 
              if (_event === 'SIGNED_OUT') {
                setStatusAssinatura(null); 
                setLogoUrl(null); 
                setNomeFantasia(null);
              }
            });

            return () => {
              authListener?.subscription?.unsubscribe?.();
            };
        }
      } else {
        console.log("App.jsx: Aguardando biblioteca Supabase carregar...");
        setTimeout(checkSupabase, 100);
      }
    };
    checkSupabase(); 
  }, []);

  // --- EFEITO 2: Verifica Status (apenas quando tiver userId) ---
  const userId = session?.user?.id;

  useEffect(() => {

    // 🔒 Se não tem userId, limpa tudo e NÃO chama a API
    if (!userId) {
        console.log("App.jsx: Nenhum usuário logado → não chamar status.");
        setLoading(false);
        setStatusAssinatura(null);
        setLogoUrl(null);
        setNomeFantasia(null);
        return;
    }

    // 🛑 Se já temos status carregado, não repetir a chamada
    if (statusAssinatura !== null) {
        console.log("App.jsx: Status já carregado → evitar nova chamada.");
        setLoading(false);
        return;
    }

    // ✔ Agora sim: userId existe e status ainda não foi carregado
    console.log(`App.jsx: Buscando status do usuário [${userId}]...`);
    setLoading(true);

    fetch(`${BACKEND_BASE_URL}/api/mercearias/status/${userId}`)
        .then(response => {
            if (response.status === 404) {
                console.warn("Usuário autenticado mas não registrado (404).");
                return { status: "trial" };
            }
            if (!response.ok) {
                throw new Error('Erro ao verificar status');
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                console.log("Status recebido:", data.status);
                setStatusAssinatura(data.status);
                setLogoUrl(addCacheBuster(data.logo_url));
                setNomeFantasia(data.nome_fantasia || 'Minha Mercearia');
            }
        })
        .catch(err => {
            console.error("Erro ao buscar status:", err);
            setStatusAssinatura('bloqueada');
        })
        .finally(() => {
            setLoading(false);
        });

  }, [userId]); // 🔥 Removido statusAssinatura daqui (evita loop infinito)

  // --- Função de Logout ---
  const handleLogout = async () => {
      if (supabaseClient) {
          await supabaseClient.auth.signOut();
      }
  };

  // --- Renderização ---
  if (loading) {
    return <div>Carregando sistema...</div>;
  }

  const statusLimpo = statusAssinatura?.trim().replace(/'/g, "") || null;

  // 1. Não tem sessão? Vai pro Login.
  if (!session) {
    return <Auth supabaseProp={supabaseClient} />;
  }

  // 2. Tem sessão, mas está bloqueado?
  if (statusLimpo === 'bloqueada') {
    return <TelaBloqueio onLogout={handleLogout} />;
  }

  // 3. Tem sessão e está ativa ou trial?
  if (statusLimpo === 'ativa' || statusLimpo === 'trial') {
    return (
      <Dashboard
        key={session.user.id}
        session={session}
        supabaseProp={supabaseClient}
        onLogout={handleLogout}
        logoUrl={logoUrl}
        nomeFantasia={nomeFantasia}
        onLogoUpdated={newBaseUrl =>
            setLogoUrl(addCacheBuster(newBaseUrl))
        }
      />
    );
  }

  // 4. Fallback
  return <div>Verificando assinatura... (Status: {statusAssinatura || 'null'})</div>;
}

export default App;
