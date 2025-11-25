import React from 'react';

// Esta tela recebe a função de Logout do App.jsx
const TelaBloqueio = ({ onLogout }) => {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h2>Acesso Bloqueado</h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '500px' }}>
                Sua assinatura expirou ou não foi paga. 
                Por favor, entre em contato com o administrador do sistema para regularizar sua situação.
            </p>
            <p>
                <strong>(Seu Nome/Contato)</strong>
            </p>
            <button 
                onClick={onLogout} 
                style={{ 
                    marginTop: '20px', 
                    padding: '10px 20px', 
                    fontSize: '1rem', 
                    color: 'white', 
                    backgroundColor: '#721c24', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                }}
            >
                Sair
            </button>
        </div>
    );
};

export default TelaBloqueio;