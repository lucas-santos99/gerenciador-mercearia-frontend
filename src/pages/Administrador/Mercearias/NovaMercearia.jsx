// src/pages/Administrador/Mercearias/NovaMercearia.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Mercearias.css";

export default function NovaMercearia() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome_fantasia: "",
    cnpj: "",
    telefone: "",
    email_contato: "",
    endereco_completo: "",
    status_assinatura: "ativa",
    data_vencimento: "",
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function atualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    // Regra: exigido somente se ativa
    if (form.status_assinatura === "ativa" && !form.data_vencimento) {
      setErro("Data de vencimento é obrigatória para mercearias ativas.");
      return;
    }

    setSalvando(true);

    try {
      const resp = await fetch("http://localhost:3001/admin/mercearias/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await resp.json();

      if (!resp.ok) {
        setErro(json.error || "Erro ao criar mercearia");
      } else {
        alert("Mercearia criada com sucesso!");
        navigate("/admin");
      }
    } catch (e) {
      setErro("Erro ao criar mercearia.");
    }

    setSalvando(false);
  }

  return (
    <LayoutAdmin>
      <div className="merc-wrapper">
        <h1>Nova Mercearia</h1>

        {erro && <p className="erro-box">{erro}</p>}

        <form className="merc-form" onSubmit={salvar}>
          <label>Nome Fantasia</label>
          <input
            name="nome_fantasia"
            value={form.nome_fantasia}
            onChange={atualizar}
            required
          />

          <label>CNPJ</label>
          <input name="cnpj" value={form.cnpj} onChange={atualizar} />

          <label>Telefone</label>
          <input
            name="telefone"
            value={form.telefone}
            onChange={atualizar}
          />

          <label>Email de Contato</label>
          <input
            name="email_contato"
            type="email"
            value={form.email_contato}
            onChange={atualizar}
          />

          <label>Endereço Completo</label>
          <input
            name="endereco_completo"
            value={form.endereco_completo}
            onChange={atualizar}
          />

          <label>Status da Assinatura</label>
          <select
            name="status_assinatura"
            value={form.status_assinatura}
            onChange={atualizar}
          >
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
            <option value="bloqueada">Bloqueada</option>
          </select>

          {form.status_assinatura === "ativa" && (
            <>
              <label>Data de Vencimento</label>
              <input
                type="date"
                name="data_vencimento"
                value={form.data_vencimento || ""}
                onChange={atualizar}
              />
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Criar Mercearia"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin")}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </LayoutAdmin>
  );
}
