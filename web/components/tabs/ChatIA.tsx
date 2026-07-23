"use client";

import { useState } from "react";

interface Mensagem {
  role: "user" | "assistant";
  content: string;
}

export default function ChatIA() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = pergunta.trim();
    if (!texto || carregando) return;

    setMensagens((prev) => [...prev, { role: "user", content: texto }]);
    setPergunta("");
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao consultar a IA.");
      setMensagens((prev) => [...prev, { role: "assistant", content: data.resposta }]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">08 · Analista</span>
          <h2 className="font-display text-xl font-semibold text-graphite">Chat IA</h2>
        </div>
        {mensagens.length > 0 && (
          <button
            onClick={() => setMensagens([])}
            className="text-xs font-mono text-fog hover:text-signal"
          >
            Limpar histórico
          </button>
        )}
      </div>

      <div className="border border-line rounded-sm bg-paper-raised min-h-[360px] flex flex-col">
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[480px]">
          {mensagens.length === 0 && (
            <p className="text-fog text-sm font-mono">
              Pergunte sobre volumetria, SLA, TMA ou tendências de categorias — o assistente responde com base nos
              dados atuais da base.
            </p>
          )}
          {mensagens.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-sm px-3 py-2 text-sm whitespace-pre-wrap max-w-[85%] ${
                m.role === "user"
                  ? "bg-copper-soft text-graphite ml-auto"
                  : "bg-paper border border-line text-graphite"
              }`}
            >
              {m.content}
            </div>
          ))}
          {carregando && <p className="text-fog text-sm font-mono">Analisando indicadores…</p>}
          {erro && <p className="text-signal text-sm font-mono">{erro}</p>}
        </div>

        <form onSubmit={enviar} className="border-t border-line p-3 flex gap-2">
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Como posso ajudar na análise hoje?"
            disabled={carregando}
            className="flex-1 border border-line rounded-sm px-3 py-1.5 text-sm bg-paper-raised text-graphite focus:border-copper outline-none"
          />
          <button
            type="submit"
            disabled={carregando || !pergunta.trim()}
            className="rounded-sm bg-copper text-white px-4 py-1.5 text-sm font-display font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-copper/90"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
