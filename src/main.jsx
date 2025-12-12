// ===== src/main.jsx =====
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { AuthProvider } from "./contexts/AuthProvider";
import { BrowserRouter } from "react-router-dom";

import "./index.css";

console.log("🌐 VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("🔑 VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
