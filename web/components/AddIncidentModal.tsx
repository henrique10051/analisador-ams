"use client";

import { useState } from "react";

interface Props {
  onSucesso: () => void;
}

const ESTADOS = ["New", "In Progress", "On Hold", "Resolved", "Closed", "Cancelled"];

interface FormState {
  Number: string;
  Service: string;
  Opened: string;
  Resolved: string;
  ShortDescription: string;
  State: string;
  Priority: string;
  AssignmentGroup: string;
  IctService: string;
  AssignedTo: string;
  CloseCode: string;
  CloseNotes: string;
  ReopenCount: string;
}

const VAZIO: FormState = {
  Number: "",
  Service: "",
  Opened: "",
  Resolved: "",
  ShortDescription: "",
  State: "Resolved",
  Priority: "",
  AssignmentGroup: "",
  IctService: "",
  AssignedTo: "",
  CloseCode: "",
  CloseNotes: "",
  ReopenCount: "0",
};

export default function AddIncidentModal({ onSucesso }: Props) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function campo<K extends keyof FormState>(chave: K, valor: string) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  function fechar() {
    setAberto(false);
    setForm(VAZIO);
    setErro(null);
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/incidente-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Number: form.Number,
          Service: form.Service,
          Opened: form.Opened,
          Resolved: form.Resolved,
          "Short description": form.ShortDescription,
          State: form.State,
          Priority: form.Priority,
          "Assignment group": form.AssignmentGroup,
          "ICT Service": form.IctService,
          "Assigned to": form.AssignedTo,
          "Close code": form.CloseCode,
          "Close notes": form.CloseNotes,
          "Reopen count": Number(form.ReopenCount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cadastrar chamado.");
      onSucesso();
      fechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="toggle-throw inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-display font-medium tracking-[0.03em] uppercase text-white/85 hover:border-copper hover:text-copper transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Chamado manual
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto"
          onClick={fechar}
        >
          <div
            className="screwed panel-in bg-paper-raised border border-line rounded-sm p-6 w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="screw-bl" />
            <span className="screw-br" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">
                  Registro avulso
                </span>
                <h3 className="font-display text-lg font-semibold text-graphite">Cadastrar chamado manualmente</h3>
                <p className="text-xs text-fog mt-1">
                  Use quando um INC foi fechado depois da última extração. A descrição curta deve seguir{" "}
                  <span className="text-graphite">[MACRO](Categoria/Subcategoria) texto</span> para classificar
                  automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                className="text-fog hover:text-signal text-lg leading-none px-1"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={registrar} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Número (Number) *">
                <input
                  required
                  value={form.Number}
                  onChange={(e) => campo("Number", e.target.value)}
                  placeholder="INC000123456"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Service">
                <input
                  value={form.Service}
                  onChange={(e) => campo("Service", e.target.value)}
                  placeholder="FORCE BEAT F1-RIO BRAZIL"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Abertura (Opened)">
                <input
                  type="datetime-local"
                  value={form.Opened}
                  onChange={(e) => campo("Opened", e.target.value)}
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Resolução (Resolved)">
                <input
                  type="datetime-local"
                  value={form.Resolved}
                  onChange={(e) => campo("Resolved", e.target.value)}
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Descrição curta (Short description)" full>
                <input
                  value={form.ShortDescription}
                  onChange={(e) => campo("ShortDescription", e.target.value)}
                  placeholder="[INCIDENTE](Categoria/Subcategoria) texto livre"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Estado (State)">
                <select value={form.State} onChange={(e) => campo("State", e.target.value)} className={INPUT_CLS}>
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Prioridade (Priority)">
                <input
                  value={form.Priority}
                  onChange={(e) => campo("Priority", e.target.value)}
                  placeholder="3 - Moderate"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Grupo de atribuição">
                <input
                  value={form.AssignmentGroup}
                  onChange={(e) => campo("AssignmentGroup", e.target.value)}
                  placeholder="...FORCEBEAT-SWF"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Serviço ICT">
                <input
                  value={form.IctService}
                  onChange={(e) => campo("IctService", e.target.value)}
                  placeholder="User Support"
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Responsável (Assigned to)">
                <input
                  value={form.AssignedTo}
                  onChange={(e) => campo("AssignedTo", e.target.value)}
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Motivo de fechamento (Close code)">
                <input
                  value={form.CloseCode}
                  onChange={(e) => campo("CloseCode", e.target.value)}
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Reabertos (Reopen count)">
                <input
                  type="number"
                  min={0}
                  value={form.ReopenCount}
                  onChange={(e) => campo("ReopenCount", e.target.value)}
                  className={INPUT_CLS}
                />
              </Campo>
              <Campo label="Notas de fechamento (Close notes)" full>
                <textarea
                  value={form.CloseNotes}
                  onChange={(e) => campo("CloseNotes", e.target.value)}
                  rows={2}
                  className={`${INPUT_CLS} resize-none`}
                />
              </Campo>

              {erro && <p className="sm:col-span-2 text-signal text-xs font-mono">{erro}</p>}

              <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={fechar}
                  className="text-xs font-mono text-fog hover:text-graphite px-2 py-1.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="toggle-throw rounded-sm bg-copper text-white px-4 py-1.5 text-sm font-display font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-copper/90"
                >
                  {enviando ? "Registrando…" : "Registrar chamado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const INPUT_CLS =
  "w-full border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper text-graphite font-mono focus:border-copper outline-none";

function Campo({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="block font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-fog mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
