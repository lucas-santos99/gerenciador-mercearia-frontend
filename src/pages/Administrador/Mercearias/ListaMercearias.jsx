// src/pages/Administrador/Mercearias/ListaMercearias.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Mercearias.css";

export default function ListaMercearias() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarMercearias() {
    setLoading(true);

    try {
      if (!API_URL) {
        throw new Error("VITE_API_URL não definida");
      }

      const resposta = await fetch(
        `${API_URL}/admin/mercearias/listar`,
        { credentials: "include" }
      );

      const data = await resposta.json();

      console.log("📌 MERCEARIAS DO BACKEND:", data);

      // Filtro simples: remove somente as excluídas
      const filtradas = data.filter(
        (m) => m.status_assinatura !== "excluida"
      );

      setLista(filtradas);
    } catch (error) {
      console.error("Erro ao carregar mercearias:", error);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregarMercearias();
  }, []);

  async function excluirMercearia(id) {
    if (!window.confirm("Excluir esta mercearia?")) return;

    try {
      const resp = await fetch(
        `${API_URL}/admin/mercearias/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (resp.ok) {
        alert("Mercearia excluída com sucesso.");
        carregarMercearias();
      } else {
        const json = await resp.json();
        alert("Erro: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir.");
    }
  }

  return (
    <LayoutAdmin>
      <div className="merc-wrapper">
        <h1>Mercearias</h1>

        <div className="merc-top">
          <Link className="btn-primary" to="/admin/mercearias/nova">
            + Nova Mercearia
          </Link>
        </div>

        <Link className="btn-secondary" to="/admin/mercearias/excluidas">
          Ver Excluídas
        </Link>

        {loading ? (
          <p>Carregando...</p>
        ) : lista.length === 0 ? (
          <p>Nenhuma mercearia cadastrada.</p>
        ) : (
          <table className="merc-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {lista.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.logo_url ? (
                      <img
                        src={m.logo_url}
                        alt="Logo"
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    ) : (
                      <span style={{ opacity: 0.5 }}>Sem logo</span>
                    )}
                  </td>

                  <td>{m.nome_fantasia}</td>
                  <td>{m.cnpj || "-"}</td>
                  <td>{m.telefone || "-"}</td>

                  <td>
                    {/* 🔹 Detalhes */}
                    <Link
                      className="btn-secondary"
                      to={`/admin/mercearias/${m.id}?view=details`}
                      style={{ marginRight: 10 }}
                    >
                      Detalhes
                    </Link>

                    {/* 🔹 Editar */}
                    <Link
                      className="btn-edit"
                      to={`/admin/mercearias/${m.id}`}
                    >
                      Editar
                    </Link>

                    {/* 🔹 Excluir */}
                    <button
                      className="btn-delete"
                      onClick={() => excluirMercearia(m.id)}
                      style={{ marginLeft: 10 }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </LayoutAdmin>
  );
}
