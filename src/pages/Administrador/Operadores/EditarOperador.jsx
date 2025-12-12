// src/pages/Administrador/Operadores/EditarOperador.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Operadores.css";

export default function EditarOperador() {
  const { id } = useParams(); // operador = auth.user.id
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "ativo",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================
  //   CARREGAR DADOS
  // ============================
  async function carregar() {
    setLoading(true);
    try {
      const resp = await fetch(
        `http://localhost:3001/admin/operadores/detalhes/${id}`
      );
      const data = await resp.json();

      if (resp.ok && data) {
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          status: data.status || "ativo",
        });
      } else {
        alert("Operador não encontrado.");
        navigate(-1);
      }
    } catch (e) {
      console.error("Erro ao carregar operador:", e);
      alert("Erro ao carregar operador.");
      navigate(-1);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  // ============================
  //   ALTERAR CAMPOS
  // ============================
  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ============================
  //   SALVAR
  // ============================
  async function salvar(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const resp = await fetch(
        `http://localhost:3001/admin/operadores/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (resp.ok) {
        alert("Alterações salvas com sucesso!");
        navigate(`/admin/operadores/${id}`); // voltar para detalhes
      } else {
        const error = await resp.json().catch(() => ({ error: "Erro" }));
        alert("Erro ao salvar: " + (error.error || ""));
      }
    } catch (e) {
      console.error("Erro ao salvar operador:", e);
      alert("Erro ao salvar operador.");
    }

    setSaving(false);
  }

  // ============================
  //   LOADING / ERRO
  // ============================
  if (loading) {
    return (
      <LayoutAdmin>
        <div className="op-wrapper">
          <p>Carregando dados...</p>
        </div>
      </LayoutAdmin>
    );
  }

  // ============================
  //   RENDER
  // ============================
  return (
    <LayoutAdmin>
      <div className="op-wrapper">
        <h1>Editar Operador</h1>

        <form className="op-form" onSubmit={salvar}>
          <label>Nome</label>
          <input
            name="nome"
            value={form.nome}
            onChange={change}
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            required
          />

          <label>Telefone</label>
          <input
            name="telefone"
            value={form.telefone}
            onChange={change}
          />

          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={change}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </LayoutAdmin>
  );
}
