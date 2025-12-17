// src/pages/Administrador/Operadores/DetalhesOperador.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import ResetSenhaModal from "./ResetSenhaModal";
import "./Operadores.css";

export default function DetalhesOperador() {
  const { id } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const [op, setOp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);

  // -----------------------------------------------------
  // CARREGAR OPERADOR
  // -----------------------------------------------------
  async function carregar() {
    setLoading(true);
    try {
      if (!API_URL) {
        throw new Error("VITE_API_URL não definida");
      }

      const resp = await fetch(
        `${API_URL}/admin/operadores/detalhes/${id}`,
        { credentials: "include" }
      );

      const data = await resp.json();

      if (resp.ok) setOp(data);
      else setOp(null);

    } catch (error) {
      console.error("Erro ao carregar operador:", error);
      setOp(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  // -----------------------------------------------------
  // ALTERAR STATUS
  // -----------------------------------------------------
  async function toggleStatus() {
    if (!op) return;

    const novoStatus = op.status === "ativo" ? "inativo" : "ativo";
    if (!window.confirm(`Deseja alterar o status para "${novoStatus}"?`)) return;

    try {
      const resp = await fetch(
        `${API_URL}/admin/operadores/${id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
          credentials: "include",
        }
      );

      const json = await resp.json().catch(() => ({}));

      if (resp.ok) {
        alert("Status atualizado!");
        carregar();
      } else {
        alert("Erro: " + (json.error || "Falha ao atualizar status"));
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao alterar status.");
    }
  }

  // -----------------------------------------------------
  // EXCLUIR
  // -----------------------------------------------------
  async function excluir() {
    if (!window.confirm("Excluir este operador?")) return;

    try {
      const resp = await fetch(
        `${API_URL}/admin/operadores/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (resp.ok) {
        alert("Operador excluído!");
        navigate(-1);
      } else {
        alert("Erro ao excluir operador.");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao excluir operador.");
    }
  }

  // -----------------------------------------------------
  // TELAS DE CARREGAMENTO / ERRO
  // -----------------------------------------------------
  if (loading) {
    return (
      <LayoutAdmin>
        <div className="op-wrapper">
          <p>Carregando operador...</p>
        </div>
      </LayoutAdmin>
    );
  }

  if (!op) {
    return (
      <LayoutAdmin>
        <div className="op-wrapper">
          <p>Operador não encontrado.</p>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </LayoutAdmin>
    );
  }

  // -----------------------------------------------------
  // RENDER FINAL
  // -----------------------------------------------------
  return (
    <LayoutAdmin>
      <div className="op-wrapper">

        {/* Título + Ações */}
        <div className="op-top">
          <h1>{op.nome}</h1>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => navigate(`/admin/operadores/editar/${id}`)}
            >
              Editar
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowReset(true)}
            >
              Resetar Senha
            </button>

            <button
              className="btn-primary"
              onClick={toggleStatus}
            >
              {op.status === "ativo" ? "Inativar" : "Ativar"}
            </button>

            <button className="btn-danger" onClick={excluir}>
              Excluir
            </button>
          </div>
        </div>

        {/* Card de Detalhes */}
        <div className="op-detail-card">

          {op.foto_url ? (
            <img
              src={op.foto_url}
              alt="Foto"
              className="op-detail-foto"
            />
          ) : (
            <div className="op-detail-foto placeholder">
              {op.nome.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="op-detail-row">
            <strong>Email:</strong> {op.email}
          </div>

          <div className="op-detail-row">
            <strong>Telefone:</strong> {op.telefone || "-"}
          </div>

          <div className="op-detail-row">
            <strong>Status:</strong>
            <span className={`badge-op status-${op.status}`}>
              {op.status}
            </span>
          </div>

          <div className="op-detail-row">
            <strong>ID:</strong> {op.id}
          </div>
        </div>

        <button
          className="btn-secondary"
          style={{ marginTop: 12 }}
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
      </div>

      {/* Modal Reset Senha */}
      {showReset && (
        <ResetSenhaModal
          id={id}
          onClose={() => setShowReset(false)}
        />
      )}
    </LayoutAdmin>
  );
}
