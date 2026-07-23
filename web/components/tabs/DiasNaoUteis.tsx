"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiaNaoUtil } from "@/lib/types";
import Panel from "@/components/Panel";

export default function DiasNaoUteis() {
  const [dias, setDias] = useState<DiaNaoUtil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/dias-nao-uteis");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar dias não úteis.");
      setDias(json.dias);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount inicial
    carregar();
  }, [carregar]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/dias-nao-uteis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao adicionar.");
      setData("");
      setMotivo("");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: number) {
    try {
      const res = await fetch(`/api/dias-nao-uteis?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao remover.");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">09 · Calendário</span>
        <h2 className="font-display text-xl font-semibold text-graphite">Dias em que o AMS não trabalhou</h2>
        <p className="text-sm text-fog mt-1">
          Cadastre pontes, paralisações ou outros dias fora do calendário oficial de feriados. Eles passam a ser
          descontados do cálculo de SLA assim que a base for reprocessada.
        </p>
      </div>

      <Panel title="Adicionar dia não útil">
        <form onSubmit={adicionar} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-fog mb-1">
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              className="border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-fog mb-1">
              Motivo
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Ponte de feriado - Corpus Christi"
              className="w-full border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite focus:border-copper outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={enviando || !data}
            className="rounded-sm bg-copper text-white px-4 py-1.5 text-sm font-display font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-copper/90"
          >
            {enviando ? "Adicionando…" : "Adicionar"}
          </button>
        </form>
      </Panel>

      {erro && <p className="text-signal text-sm font-mono">{erro}</p>}

      {carregando ? (
        <p className="text-fog text-sm font-mono">Carregando…</p>
      ) : dias.length === 0 ? (
        <p className="text-fog text-sm font-mono">Nenhum dia não útil extra cadastrado ainda.</p>
      ) : (
        <div className="border border-line rounded-sm overflow-hidden">
          {[...dias]
            .sort((a, b) => a.data.localeCompare(b.data))
            .map((d, idx) => (
              <div
                key={d.id}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                  idx % 2 === 1 ? "bg-white/[0.02]" : ""
                } ${idx > 0 ? "border-t border-line" : ""}`}
              >
                <span className="font-mono text-graphite w-28">
                  {new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
                <span className="flex-1 text-fog">{d.motivo || "—"}</span>
                <button
                  onClick={() => remover(d.id)}
                  className="text-xs font-mono text-signal hover:underline"
                >
                  Remover
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
