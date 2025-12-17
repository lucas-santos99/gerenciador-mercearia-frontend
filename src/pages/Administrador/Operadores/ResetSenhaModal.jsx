// src/pages/Administrador/Operadores/ResetSenhaModal.jsx
import React, { useState } from "react";
import "./Operadores.css";

export default function ResetSenhaModal({ id, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    setErro("");

    if (!senha || senha.length < 6) {
      setErro("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não conferem.");
      return;
    }

    setSaving(true);

    try {
      if (!API_URL) {
        throw new Error("VITE_API_URL não definida");
      }

      const resp = await fetch(
        `${API_URL}/admin/operadores/${id}/reset-senha`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha }),
          credentials: "include",
        }
      );

      const json = await resp.json().catch(() => ({}));

      if (resp.ok) {
        alert("Senha redefinida com sucesso!");
        onClose();
      } else {
        setErro(json.error || "Erro ao redefinir senha.");
      }

    } catch (err) {
      console.error("Erro ao resetar senha:", err);
      setErro("Erro interno ao resetar senha.");
    }

    setSaving(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Resetar Senha</h2>

        {erro && (
          <p className="erro-box" style={{ marginBottom: 10 }}>
            {erro}
          </p>
        )}

        <label>Nova senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={saving}
        />

        <label>Confirmar</label>
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          disabled={saving}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className="btn-primary"
            onClick={enviar}
            disabled={saving}
          >
            {saving ? "Enviando..." : "Resetar"}
          </button>
        </div>
      </div>
    </div>
  );
}
