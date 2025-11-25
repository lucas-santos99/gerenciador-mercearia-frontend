import React, { useState } from 'react';
// REMOVIDA A IMPORTAÇÃO DIRETA: import { supabase } from '../utils/supabaseClient'; 

// Variável de controle do Backend (Ajuste se necessário)
const BACKEND_BASE_URL = 'http://localhost:3001'; 
// const BACKEND_BASE_URL = 'https://mercearia-api.onrender.com'; // Para Produção

// Componente agora recebe 'supabaseProp' do App.jsx
const Auth = ({ supabaseProp }) => {
    // Usa a prop em vez da importação
    const supabase = supabaseProp; 

    // --- ESTADOS ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSignUp, setIsSignUp] = useState(true); 

    // --- ESTADOS PARA REGISTRO DA MERCEARIA ---
    const [userId, setUserId] = useState(null); 
    const [showNomeFantasiaInput, setShowNomeFantasiaInput] = useState(false); 
    const [nomeFantasia, setNomeFantasia] = useState(''); 

    // --- 1. FUNÇÃO DE REGISTRO/LOGIN DO USUÁRIO (FRONT-END -> SUPABASE) ---
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Validação crítica (garante que o cliente Supabase foi passado e está pronto)
        if (!supabase || !supabase.auth) {
            setMessage('Erro crítico: Cliente Supabase não inicializado. Recarregue a página.');
            setLoading(false);
            return;
        }

        try {
            let result;

            if (isSignUp) {
                result = await supabase.auth.signUp({ email, password });
            } else {
                result = await supabase.auth.signInWithPassword({ email, password });
            }
            
            const { error, data } = result;

            if (error) {
                setMessage('Erro de Autenticação: ' + error.message);
            } else {
                if (isSignUp && data.user) { 
                    setUserId(data.user.id); 
                    setShowNomeFantasiaInput(true); 
                    setMessage('✅ Usuário criado com sucesso! Agora, informe o nome da sua mercearia.');
                    setEmail(''); 
                    setPassword('');
                } else if (!isSignUp && data.session) {
                    setMessage('✅ Login efetuado com sucesso!');
                    // O App.jsx detectará esta sessão e mudará para o Dashboard
                }
            }
        } catch (error) { 
            console.error("ERRO REAL DO CATCH em handleAuth:", error); 
            setMessage('Erro desconhecido durante a autenticação.');
        } finally {
            setLoading(false);
        }
    };

    // --- 2. FUNÇÃO DE REGISTRO DA MERCEARIA (FRONT-END -> NODE.JS BACKEND) ---
    const handleRegisterMercearia = async (e) => {
        e.preventDefault();
        if (!userId || !nomeFantasia) {
            setMessage('Erro interno: Falha ao obter o ID do usuário.');
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const backendUrl = `${BACKEND_BASE_URL}/api/mercearias/register`; 

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, nomeFantasia: nomeFantasia }),
            });

            const result = await response.json(); 

            if (!response.ok) {
                throw new Error(result.error || `Erro HTTP: ${response.status}`);
            }

            // Sucesso!
            setMessage('✅ Mercearia registrada com sucesso! Você já pode fazer o Login.');
            setShowNomeFantasiaInput(false); 
            setIsSignUp(false); 
            setUserId(null); 

        } catch (error) {
            console.error("Erro ao registrar mercearia:", error);
            setMessage(`Erro ao registrar mercearia: ${error.message}.`);
        } finally {
            setLoading(false);
        }
    };

    // --- ESTRUTURA VISUAL (JSX) ---
    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', maxWidth: '400px', margin: '50px auto' }}>
            <h3>{isSignUp ? "CADASTRAR NOVA MERCEARIA" : "FAZER LOGIN"}</h3>
            
            {/* 1. FORMULÁRIO DE USUÁRIO */}
            {!showNomeFantasiaInput && (
                <form onSubmit={handleAuth}>
                    <input 
                        type="email" placeholder="Email (Login)" value={email} 
                        onChange={(e) => setEmail(e.target.value)} required
                        style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                    />
                    <input 
                        type="password" placeholder="Senha (mín. 6 caracteres)" value={password} 
                        onChange={(e) => setPassword(e.target.value)} required
                        style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                    />
                    <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', cursor: 'pointer', backgroundColor: isSignUp ? '#4CAF50' : '#007bff' }}>
                        {loading ? 'Processando...' : (isSignUp ? 'CADASTRAR USUÁRIO' : 'ENTRAR NO SISTEMA')}
                    </button>
                </form>
            )}

            {/* 2. FORMULÁRIO DE NOME FANTASIA */}
            {showNomeFantasiaInput && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <h4>Nome da Mercearia (Finalizar)</h4>
                    <form onSubmit={handleRegisterMercearia}> 
                        <input
                            type="text" placeholder="Nome Fantasia da Mercearia" value={nomeFantasia}
                            onChange={(e) => setNomeFantasia(e.target.value)} required
                            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                        />
                        <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', cursor: 'pointer', backgroundColor: '#FFC107', color: 'black' }}>
                            {loading ? 'Registrando...' : 'CONCLUIR CADASTRO'}
                        </button>
                    </form>
                </div>
            )}
            
            {message && <p style={{ color: message.startsWith('✅') ? 'green' : 'red', marginTop: '15px' }}>{message}</p>}

            {/* 3. BOTÃO DE ALTERNAR */}
            {!showNomeFantasiaInput && (
                <button 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setMessage('');
                    }}
                    style={{ marginTop: '15px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
                >
                    {isSignUp ? 'Já sou cliente (Fazer Login)' : 'Novo cliente (Cadastrar)'}
                </button>
            )}
        </div>
    );
};

export default Auth;