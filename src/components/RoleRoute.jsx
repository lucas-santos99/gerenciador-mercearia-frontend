// src/components/RoleRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { profile, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  // Caso ainda não tenha perfil carregado → volta pro login
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Permissão negada
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permitido
  return children;
}
