import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import "./NovaSenha.css";

export default function NovaSenha() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const type = urlParams.get("type");
    const token = urlParams.get("access_token");

    if (type === "recovery" && token) {
      // Supabase automaticamente ajusta a sessão com o token
      supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      });

      setTokenLoaded(true);
    } else {
      setErrorMsg("Link inválido ou expirado.");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (newPassword !== confirm) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setErrorMsg("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMsg("Erro ao atualizar senha. Tente novamente.");
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  }

  return (
    <div className="nova-container">
      <div className="nova-box">

        <h2>Redefinir Senha</h2>

        {!tokenLoaded && !errorMsg && <p>Carregando...</p>}

        {errorMsg && <p className="erro">{errorMsg}</p>}

        {!success && tokenLoaded && (
          <form className="nova-form" onSubmit={handleSubmit}>
            <label>Nova Senha</label>
            <input 
              type="password"
              placeholder="Digite sua nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <label>Confirmar Senha</label>
            <input 
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button type="submit" className="btn-nova">
              Atualizar Senha
            </button>
          </form>
        )}

        {success && (
          <p className="sucesso">
            Senha atualizada com sucesso! Redirecionando...
          </p>
        )}
      </div>
    </div>
  );
}
