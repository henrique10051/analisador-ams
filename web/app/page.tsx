"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Incidente } from "@/lib/types";
import { derivarResolvidos } from "@/lib/processador-dados";
import UploadPanel from "@/components/UploadPanel";
import AddIncidentModal from "@/components/AddIncidentModal";
import ThemeToggle from "@/components/ThemeToggle";
import Geral from "@/components/tabs/Geral";
import Sla from "@/components/tabs/Sla";
import Tma from "@/components/tabs/Tma";
import Categorias from "@/components/tabs/Categorias";
import Subcategorias from "@/components/tabs/Subcategorias";
import MacroFechamento from "@/components/tabs/MacroFechamento";
import ChatIA from "@/components/tabs/ChatIA";
import Base from "@/components/tabs/Base";
import DiasNaoUteis from "@/components/tabs/DiasNaoUteis";

const ABAS = [
  { id: "geral", label: "Geral" },
  { id: "sla", label: "SLA" },
  { id: "tma", label: "TMA" },
  { id: "categorias", label: "Categorias" },
  { id: "subcategorias", label: "Subcategorias" },
  { id: "macro", label: "Macro Fech." },
  { id: "chat", label: "Chat IA" },
  { id: "base", label: "Base" },
  { id: "dias", label: "Dias N. Út." },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export default function Home() {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("geral");

  const carregarIncidentes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/incidentes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar base.");
      setIncidentes(data.incidentes);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount inicial
    carregarIncidentes();
  }, [carregarIncidentes]);

  const resolvidos = useMemo(() => derivarResolvidos(incidentes), [incidentes]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Fascia do quadro de distribuição */}
      <header className="bg-ink border-b-2 border-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="screwed relative inline-flex h-8 w-8 items-center justify-center rounded-[3px] bg-gradient-to-b from-copper to-copper/70 text-ink font-display font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.4)]">
              <span className="screw-bl" />
              <span className="screw-br" />
              A
            </span>
            <div className="leading-tight">
              <div className="font-display font-semibold text-white text-sm tracking-[0.06em] uppercase">
                Analisador AMS
              </div>
              <div className="text-[10px] font-mono text-white/40 tracking-[0.1em] uppercase">
                Quadro RadSync · CE / RJ / SP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UploadPanel onSucesso={carregarIncidentes} />
            <AddIncidentModal onSucesso={carregarIncidentes} />
            <ThemeToggle />
          </div>
        </div>

        {/* Barramento de disjuntores — navegação por aba */}
        {!carregando && incidentes.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
            <nav className="flex gap-1.5 pb-3">
              {ABAS.map((aba, idx) => {
                const ativo = abaAtiva === aba.id;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id)}
                    aria-current={ativo}
                    className={`toggle-throw group relative flex flex-col items-center gap-1 whitespace-nowrap rounded-[2px] border px-3 pt-1.5 pb-1 min-w-[64px] transition-colors ${
                      ativo
                        ? "border-copper bg-ink-raised"
                        : "border-white/10 bg-black/20 hover:border-white/25"
                    }`}
                  >
                    <span
                      className={`pilot-lamp h-1.5 w-1.5 rounded-full ${ativo ? "lamp-flicker" : ""}`}
                      style={{
                        backgroundColor: ativo ? "var(--color-lamp-green)" : "rgba(255,255,255,0.15)",
                        color: ativo ? "var(--color-lamp-green)" : "transparent",
                      }}
                      aria-hidden
                    />
                    <span
                      className={`text-[10px] font-display font-medium tracking-[0.03em] uppercase ${
                        ativo ? "text-white" : "text-white/45 group-hover:text-white/75"
                      }`}
                    >
                      {aba.label}
                    </span>
                    <span className="text-[8px] font-mono text-white/25">{String(idx + 1).padStart(2, "0")}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {carregando && <p className="text-fog text-sm font-mono">Carregando base acumulada…</p>}
        {erro && <p className="trip-shake text-signal text-sm font-mono">{erro}</p>}

        {!carregando && !erro && incidentes.length === 0 && (
          <div className="screwed panel-in bg-paper-raised border border-line rounded-sm p-10 text-center max-w-xl mx-auto mt-12">
            <span className="screw-bl" />
            <span className="screw-br" />
            <p className="font-display text-graphite text-base uppercase tracking-[0.04em] mb-2">
              Painel sem carga
            </p>
            <p className="text-fog text-sm">
              Carregue um arquivo CSV ou Excel da extração ServiceNow no botão acima para começar.
            </p>
          </div>
        )}

        {!carregando && incidentes.length > 0 && (
          <>
            {abaAtiva === "geral" && <Geral incidentes={incidentes} onAtualizado={carregarIncidentes} />}
            {abaAtiva === "sla" && <Sla incidentesResolvidos={resolvidos} />}
            {abaAtiva === "tma" && <Tma incidentesResolvidos={resolvidos} />}
            {abaAtiva === "categorias" && <Categorias incidentesResolvidos={resolvidos} />}
            {abaAtiva === "subcategorias" && <Subcategorias incidentesResolvidos={resolvidos} />}
            {abaAtiva === "macro" && <MacroFechamento incidentesResolvidos={resolvidos} />}
            {abaAtiva === "chat" && <ChatIA />}
            {abaAtiva === "base" && <Base incidentes={incidentes} onAtualizado={carregarIncidentes} />}
            {abaAtiva === "dias" && <DiasNaoUteis />}
          </>
        )}
      </main>
    </div>
  );
}
