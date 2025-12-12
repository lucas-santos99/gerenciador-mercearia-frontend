// src/pages/Administrador/Operadores/ListaOperadores.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Operadores.css";

export default function ListaOperadores() {
  const { id: merceariaId } = useParams();
  const navigate = useNavigate();

  const [operadores, setOperadores] = useState([]);
  const [mercearia, setMercearia] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // CARREGAR OPERADORES + MERCEARIA
  // =============================
  async function carregar() {
    setLoading(true);

    try {
      // Buscar dados da mercearia
      const respM = await fetch(`http://localhost:3001/admin/mercearias/${merceariaId}`);
      const dataM = await respM.json();
      if (respM.ok) setMercearia(dataM);

      // Buscar operadores (rota existente)
      const resp = await fetch(`http://localhost:3001/admin/operadores/${merceariaId}`);
      const data = await resp.json();

      setOperadores(resp.ok ? data : []);
    } catch (err) {
      console.error("Erro carregar operadores:", err);
      setOperadores([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [merceariaId]);

  // =============================
  // EXCLUIR OPERADOR
  // =============================
  async function excluir(id) {
    if (!window.confirm("Deseja realmente excluir este operador?")) return;

    try {
      const resp = await fetch(`http://localhost:3001/admin/operadores/${id}`, {
        method: "DELETE"
      });

      if (resp.ok) {
        alert("Operador excluído!");
        carregar();
      } else {
        alert("Erro ao excluir operador.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro interno.");
    }
  }

  // =============================
  // RENDER
  // =============================
  return (
    <LayoutAdmin>
      <div className="op-wrapper">

        <div className="op-top">
          <div>
            <h1>Operadores {mercearia ? `— ${mercearia.nome_fantasia}` : ""}</h1>
            <p className="op-subtitle">Gerencie os operadores desta mercearia</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate(`/admin/operadores/novo?mercearia=${merceariaId}`)}
          >
            + Novo Operador
          </button>
        </div>

        {loading ? (
          <p>Carregando operadores...</p>
        ) : operadores.length === 0 ? (
          <p className="sem-operadores">Nenhum operador encontrado.</p>
        ) : (
          <div className="table-wrapper">
            <table className="op-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {operadores.map((op) => (
                  <tr key={op.id}>
                    <td>
                      <div className="op-avatar placeholder">
                        {(op.nome || "?").charAt(0).toUpperCase()}
                      </div>
                    </td>

                    <td
                      className="op-nome"
                      onClick={() => navigate(`/admin/operadores/${op.id}`)}
                    >
                      {op.nome}
                    </td>

                    <td>{op.email}</td>

                    <td>{op.telefone || "-"}</td>

                    <td>
                      <span className={`badge-op status-${op.status}`}>
                        {op.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/admin/operadores/${op.id}`)}
                      >
                        Detalhes
                      </button>

                      <button
                        className="btn-danger"
                        onClick={() => excluir(op.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Excluir
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => navigate("/admin")}
          style={{ marginTop: 20 }}
        >
          Voltar ao Dashboard
        </button>
      </div>
    </LayoutAdmin>
  );
}
