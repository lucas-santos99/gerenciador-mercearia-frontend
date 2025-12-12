// src/pages/Administrador/Mercearias/Excluidas.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAdmin from "../Painel/LayoutAdmin";
import "./Mercearias.css";

export default function Excluidas() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controle do modal
  const [modalAtivo, setModalAtivo] = useState(false);
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [nomeSelecionado, setNomeSelecionado] = useState("");

  async function carregar() {
    setLoading(true);

    const resp = await fetch("http://localhost:3001/admin/mercearias/excluidas");
    const data = await resp.json();

    setLista(data || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function restaurar(id) {
    if (!window.confirm("Restaurar esta mercearia?")) return;

    const resp = await fetch(
      `http://localhost:3001/admin/mercearias/${id}/restaurar`,
      { method: "PUT" }
    );

    if (resp.ok) {
      alert("Mercearia restaurada!");
      carregar();
    } else {
      const json = await resp.json();
      alert("Erro: " + json.error);
    }
  }

  async function excluirDefinitivo() {
    if (!idSelecionado) return;

    const resp = await fetch(
      `http://localhost:3001/admin/mercearias/${idSelecionado}/apagar-definitivo`,
      { method: "DELETE" }
    );

    if (resp.ok) {
      alert("Mercearia removida definitivamente!");
      setModalAtivo(false);
      carregar();
    } else {
      const json = await resp.json();
      alert("Erro: " + json.error);
    }
  }

  function abrirModal(id, nome) {
    setIdSelecionado(id);
    setNomeSelecionado(nome);
    setModalAtivo(true);
  }

  return (
    <LayoutAdmin>
      <div className="merc-wrapper">
        <div className="merc-topo-excluidas">
          <h1>Mercearias Excluídas</h1>

         <Link className="btn-voltar" to="/admin">
            ← Voltar
          </Link>
        </div>

        {loading ? (
          <p className="carregando">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="sem-registro">Nenhuma mercearia excluída.</p>
        ) : (
          <div className="cards-container">
            {lista.map((m) => (
              <div key={m.id} className="card-mercearia-excluida">
                <div className="card-header">
                  <div className="badge-excluida">EXCLUÍDA</div>
                  <h3>{m.nome_fantasia}</h3>
                </div>

                <p><strong>CNPJ:</strong> {m.cnpj || "-"}</p>
                <p><strong>Telefone:</strong> {m.telefone || "-"}</p>

                <div className="card-acoes">
                  <button className="btn-restaurar" onClick={() => restaurar(m.id)}>
                    Restaurar
                  </button>

                  <button
                    className="btn-excluir-def"
                    onClick={() => abrirModal(m.id, m.nome_fantasia)}
                  >
                    Excluir Definitivamente
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO */}
        {modalAtivo && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Excluir Permanentemente</h2>
              <p>
                Tem certeza que deseja remover <strong>{nomeSelecionado}</strong> 
                permanentemente? Esta ação não pode ser desfeita.
              </p>

              <div className="modal-acoes">
                <button className="btn-cancelar" onClick={() => setModalAtivo(false)}>
                  Cancelar
                </button>

                <button className="btn-confirmar" onClick={excluirDefinitivo}>
                  Sim, excluir definitivamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
