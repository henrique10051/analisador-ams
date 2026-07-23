"use client";

import { useState } from "react";

export default function ThemeToggle() {
  const [tema, setTema] = useState<"dark" | "light">(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("ams-tema", novo);
    } catch {
      // localStorage indisponível — tema não persiste, mas segue funcionando
    }
  }

  const aberto = tema === "light";

  return (
    <button
      type="button"
      onClick={alternar}
      title={aberto ? "Fechar painel (modo escuro)" : "Abrir painel (modo claro)"}
      className="toggle-throw group inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-2.5 py-1.5 hover:border-copper transition-colors"
    >
      <span className="relative inline-flex h-4 w-8 items-center rounded-full bg-black/40 border border-white/10">
        <span
          className={`absolute h-3 w-3 rounded-full bg-gradient-to-br from-[#d8cdb8] to-[#8a8072] shadow-sm transition-transform duration-200 ${
            aberto ? "translate-x-[17px]" : "translate-x-[2px]"
          }`}
        />
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-white/60 group-hover:text-copper">
        {aberto ? "Painel aberto" : "Painel fechado"}
      </span>
    </button>
  );
}
