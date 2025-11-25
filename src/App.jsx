// ===== App.jsx (ATUALIZADO PARA PDF) =====
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TelaBloqueio from './components/TelaBloqueio'; 
import { createSupabaseClient } from './utils/supabaseClient'; 
import './App.css'; 

const BACKEND_BASE_URL = 'http://localhost:3001';

// FUNÇÃO HELPER
const addCacheBuster = (url) => {
    if (!url) return null;
    return `${url.split('?')[0]}?t=${new Date().getTime()}`;
};

function App() {
  const [supabaseClient, setSupabaseClient] = useState(null); 
  const [session, setSession] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [statusAssinatura, setStatusAssinatura] = useState(null); 
  const [logoUrl, setLogoUrl] = useState(null);
  // NOVO ESTADO PARA O NOME
  const [nomeFantasia, setNomeFantasia] = useState(null);

  // --- EFEITO 1: Carrega a biblioteca E Seta o Listener ---
  useEffect(() => {
    const checkSupabase = () => {
      const supabaseGlobal = window.supabase || window['supabase'];
      if (supabaseGlobal && typeof supabaseGlobal.createClient === 'function') {
        const client = createSupabaseClient();
        if (client) {
            console.log("App.jsx (Efeito 1): Cliente Supabase (CDN) criado.");
            setSupabaseClient(client); 

            const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
              console.log("App.jsx (Efeito 1): onAuthStateChange disparado!", _event);
              setSession(session); 
              if (_event === 'SIGNED_OUT') {
                setStatusAssinatura(null); 
                setLogoUrl(null); 
                // LIMPA O NOME
                setNomeFantasia(null);
              }
            });
            return () => {
                 if (authListener && authListener.subscription) {
                    authListener.subscription.unsubscribe();
                 }
            };
        }
      } else {
        console.log("App.jsx (Efeito 1): Esperando a biblioteca Supabase (CDN) carregar...");
        setTimeout(checkSupabase, 100);
      }
    };
    checkSupabase(); 
  }, []);

  // --- EFEITO 2: Verifica Status ---
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId && !statusAssinatura) {
        console.log(`App.jsx (Efeito 2): ID de usuário [${userId}] detectado e STATUS NULO. Verificando status...`);
        setLoading(true); 
        
        fetch(`${BACKEND_BASE_URL}/api/mercearias/status/${userId}`)
            .then(response => {
                if (response.status === 404) { 
                   console.warn("App.jsx (Efeito 2): Usuário autenticado mas não registrado (404).");
                    setStatusAssinatura('trial'); 
                } else if (!response.ok) {
                    throw new Error('Erro ao verificar status (Network)');
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data) {
                    console.log("App.jsx (Efeito 2): Status recebido:", data.status);
                    setStatusAssinatura(data.status); 
                    setLogoUrl(addCacheBuster(data.logo_url));
                    // CAPTURA O NOME FANTASIA
                    setNomeFantasia(data.nome_fantasia || 'Minha Mercearia');
                }
            })
            .catch(error => {
                console.error("App.jsx (Efeito 2): Falha no fetch:", error);
                setStatusAssinatura('bloqueada'); 
            })
            .finally(() => {
                 setLoading(false);
            });
    } else if (!userId) {
        setLoading(false);
        setStatusAssinatura(null);
        setLogoUrl(null); 
        // LIMPA O NOME
        setNomeFantasia(null);
    }
  }, [userId, statusAssinatura]);

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
  
  const statusLimpo = statusAssinatura ? statusAssinatura.trim().replace(/'/g, "") : null;

  // 1. Não tem sessão? Vai pro Login.
  if (!session) {
    return <Auth supabaseProp={supabaseClient} />;
  }
  // 2. Tem sessão, mas está bloqueado?
  if (session && statusLimpo === 'bloqueada') {
    return <TelaBloqueio onLogout={handleLogout} />;
  }
  
  // 3. Tem sessão E está ativo OU em trial?
  if (session && (statusLimpo === 'ativa' || statusLimpo === 'trial')) {
     return <Dashboard 
                key={session.user.id} 
                session={session} 
                supabaseProp={supabaseClient} 
                onLogout={handleLogout}
                logoUrl={logoUrl}
                // PASSA O NOME FANTASIA PARA O DASHBOARD
                nomeFantasia={nomeFantasia} 
                onLogoUpdated={(newBaseUrl) => {
                    setLogoUrl(addCacheBuster(newBaseUrl));
                }}
            />;
  }
  
  // 4. (Fallback)
  return <div>Verificando assinatura... (Status: {statusAssinatura || 'null'})</div>;
}

export default App;