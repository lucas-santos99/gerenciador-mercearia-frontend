// ===== NovoOperador.jsx =====
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "../Mercearias/Mercearias.css";

export default function NovoOperador() {
  const navigate = useNavigate();
  const location = useLocation();

  // Captura ?mercearia=ID se existir
  const merceariaFromQuery = new URLSearchParams(location.search).get("mercearia") || "";

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    mercearia_id: merceariaFromQuery,
  });

  const [mercearias, setMercearias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // ============================
  // CARREGAR MERCEARIAS ATIVAS
  // ============================
  async function carregarMercearias() {
    try {
      const resp = await fetch("http://localhost:3001/admin/mercearias/listar");
      const data = await resp.json();
      setMercearias(data || []);
    } catch (err) {
      console.error("Erro ao carregar mercearias:", err);
      setErro("Erro ao carregar mercearias.");
    }
  }

  useEffect(() => {
    carregarMercearias();
  }, []);

  // ============================
  // HANDLER
  // ============================
  function atualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ============================
  // SALVAR OPERADOR
  // ============================
  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (!form.senha || form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch("http://localhost:3001/admin/operadores/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await resp.json();

      if (!resp.ok) {
        setErro(json.error || "Erro ao criar operador.");
      } else {
        alert("Operador criado com sucesso!");
        navigate(`/admin/mercearias/${form.mercearia_id}/operadores`);
      }
    } catch (err) {
      console.error("Erro salvar operador:", err);
      setErro("Erro interno ao criar operador.");
    }

    setLoading(false);
  }

  return (
    <LayoutAdmin>
      <div className="merc-wrapper">
        <h1>Novo Operador</h1>

        {erro && <p className="erro-box">{erro}</p>}

        <form className="merc-form" onSubmit={salvar}>
          
          {/* MERCEARIA */}
          <label>Mercearia</label>
          <select
            name="mercearia_id"
            value={form.mercearia_id}
            onChange={atualizar}
            required
          >
            <option value="">Selecione...</option>
            {mercearias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome_fantasia}
              </option>
            ))}
          </select>

          {/* NOME */}
          <label>Nome</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={atualizar}
            required
          />

          {/* EMAIL */}
          <label>Email de Login</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={atualizar}
            required
          />

          {/* SENHA */}
          <label>Senha Inicial</label>
          <input
            type="password"
            name="senha"
            value={form.senha}
            onChange={atualizar}
            required
            placeholder="Mínimo 6 caracteres"
          />

          {/* TELEFONE */}
          <label>Telefone</label>
          <input
            type="text"
            name="telefone"
            value={form.telefone}
            onChange={atualizar}
          />

          {/* AÇÕES */}
          <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
            <button className="btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Operador"}
            </button>

            <button
              type="button"
              className="btn-secondary"
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
