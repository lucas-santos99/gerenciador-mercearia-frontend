// src/pages/Mercearia/PainelMercearia.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";

export default function PainelMercearia() {
  const { id } = useParams();
  const { user, profile } = useAuth();

  return (
    <div style={{ padding: 25 }}>
      <h1>Painel da Mercearia</h1>

      <p><strong>ID da Mercearia:</strong> {id}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Role:</strong> {profile?.role}</p>

      <hr />

      <p>Em breve aqui teremos:</p>
      <ul>
        <li>Painel de vendas</li>
        <li>Estoque</li>
        <li>Relatórios</li>
        <li>Configurações da loja</li>
      </ul>
    </div>
  );
}
