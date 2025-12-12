import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // O Supabase envia o token no HASH (#)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const access_token = params.get("access_token");
      const type = params.get("type");

      console.log("Callback recebido:", { access_token, type });

      if (!access_token || type !== "recovery") {
        navigate("/login");
        return;
      }

      // Criar a sessão com o token recebido
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token: access_token,
      });

      if (error) {
        console.error("Erro no callback:", error);
        navigate("/login");
        return;
      }

      // Usuário autenticado → agora pode ir redefinir a senha
      navigate("/nova-senha");
    }

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3>Carregando...</h3>
      <p>Aguarde enquanto validamos seu link.</p>
    </div>
  );
}
