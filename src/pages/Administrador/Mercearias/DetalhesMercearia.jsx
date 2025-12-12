// src/pages/Administrador/Mercearias/DetalhesMercearia.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Mercearias.css";

export default function DetalhesMercearia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    try {
      const resp = await fetch(`http://localhost:3001/admin/mercearias/${id}`);
      const data = await resp.json();
      if (resp.ok) setDados(data);
      else setDados(null);
    } catch (e) {
      console.error("Erro carregar detalhes:", e);
      setDados(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Restaurar (se estiver excluída)
  async function restaurar() {
    if (!window.confirm("Restaurar esta mercearia?")) return;

    const resp = await fetch(
      `http://localhost:3001/admin/mercearias/${id}/restaurar`,
      { method: "PUT" }
    );

    if (resp.ok) {
      alert("Restaurada com sucesso!");
      carregar();
    } else {
      alert("Erro ao restaurar.");
    }
  }

  // Soft delete
  async function excluir() {
    if (!window.confirm("Tem certeza que quer excluir esta mercearia?")) return;

    const resp = await fetch(`http://localhost:3001/admin/mercearias/${id}`, {
      method: "DELETE",
    });

    if (resp.ok) {
      alert("Excluída!");
     navigate("/admin");
    } else {
      alert("Erro ao excluir.");
    }
  }

  if (loading) {
    return (
      <LayoutAdmin>
        <div className="merc-wrapper">
          <p>Carregando...</p>
        </div>
      </LayoutAdmin>
    );
  }

  if (!dados) {
    return (
      <LayoutAdmin>
        <div className="merc-wrapper">
          <p>Erro ao carregar informações.</p>
          <Link to="/admin/mercearias" className="btn-voltar">Voltar</Link>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin>
      <div className="merc-wrapper">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Detalhes da Mercearia</h1>
          <Link to="/admin/mercearias" className="btn-voltar">← Voltar</Link>
        </div>

        <div className="premium-card" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* LOGO + INFO LATERAL */}
          <div style={{ minWidth: 180 }}>
            <div className="premium-logo-box">
              {dados.logo_url ? (
                <img src={dados.logo_url} alt="Logo" className="premium-logo" />
              ) : (
                <div className="premium-logo placeholder">SEM LOGO</div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
              <div>
                <h2 style={{ margin: 0 }}>{dados.nome_fantasia}</h2>
                <p style={{ margin: "6px 0 0 0", color: "#555" }}>{dados.email_contato || "-"}</p>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge status-${(dados.status_assinatura || 'indef').replace(/\s+/g, '-')}`}>
                    {dados.status_assinatura || "indefinido"}
                  </span>
                </div>
                <p style={{ marginTop: 10, color: "#666" }}><strong>Vencimento:</strong> {dados.data_vencimento || "-"}</p>
              </div>
            </div>

            <div className="premium-info-grid" style={{ marginTop: 20 }}>
              <div className="premium-info-card">
                <h3>Informações Gerais</h3>
                <p><strong>Nome:</strong> {dados.nome_fantasia}</p>
                <p><strong>CNPJ:</strong> {dados.cnpj || "-"}</p>
                <p><strong>Email:</strong> {dados.email_contato || "-"}</p>
                <p><strong>Telefone:</strong> {dados.telefone || "-"}</p>
              </div>

              <div className="premium-info-card">
                <h3>Endereço</h3>
                <p>{dados.endereco_completo || "Não informado"}</p>
              </div>
            </div>

            <div className="premium-actions" style={{ marginTop: 22 }}>
              <Link to={`/admin/mercearias/${dados.id}`} className="btn-edit">Editar Dados</Link>

              {dados.status_assinatura === "excluida" ? (
                <button className="btn-primary" onClick={restaurar}>Restaurar</button>
              ) : (
                <button className="btn-danger" onClick={excluir}>Excluir</button>
              )}

              <button
                className="btn-primary"
                onClick={() => navigate(`/admin/mercearias/${dados.id}/operadores`)}
                style={{ marginLeft: 6 }}
              >
                Operadores da Mercearia
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
