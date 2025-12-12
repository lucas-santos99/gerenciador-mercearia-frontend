// src/pages/RecuperarSenha/RecuperarSenha.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient"; // verifique o caminho
import "./RecuperarSenha.css";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setEnviado(false);

    try {
      console.log("Tentando enviar reset para:", email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: "https://gerenciador-mercearia-frontend.onrender.com/nova-senha",
      });

      if (error) {
        console.error("Supabase error:", error);
        alert("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
        setLoading(false);
        return;
      }

      console.log("Reset request data:", data);
      setEnviado(true);
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro inesperado. Veja console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recover-container">
      <div className="recover-box">
        <h2>Recuperar Senha</h2>

        {enviado ? (
          <p className="recover-success">
            Se este email existir na nossa base, você receberá instruções em alguns minutos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="recover-form">
            <label>Email cadastrado</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className="recover-btn" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}

        <Link to="/login" className="recover-back">Voltar ao login</Link>
      </div>
    </div>
  );
}
