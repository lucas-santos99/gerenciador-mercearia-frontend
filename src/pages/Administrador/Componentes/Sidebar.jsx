// src/pages/Administrador/Componentes/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Configurações", path: "/admin/configuracoes" },
  ];

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
    </div>
  );
}
