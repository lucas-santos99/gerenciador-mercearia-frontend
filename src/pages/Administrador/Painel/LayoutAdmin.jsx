// src/pages/Administrador/Painel/LayoutAdmin.jsx
import React from "react";
import Sidebar from "../Componentes/Sidebar";
import "./LayoutAdmin.css";

export default function LayoutAdmin({ children }) {
  return (
    <div className="admin-container">
      <Sidebar />

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
