import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../../../contexts/AuthProvider";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Configurações", path: "/admin/configuracoes" },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
      alert("Erro ao encerrar sessão.");
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-primary">Lucas</span>
        <span className="logo-secondary">J. Systems</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname.startsWith(item.path) ? "active" : ""}
          >
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>

      {/* BOTÃO SAIR */}
      <div className="sidebar-footer">
        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
