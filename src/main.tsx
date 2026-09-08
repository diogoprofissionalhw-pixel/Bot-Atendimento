import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { CentralAjuda } from "./pages/CentralAjuda";
import { Login } from "./pages/Login";
import { Painel } from "./pages/Painel";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CentralAjuda />} />
        <Route path="/login" element={<Login />} />
        <Route path="/painel" element={<Painel />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
