"use client";

import { useRef, useState } from "react";

interface Props {
  onSucesso: () => void;
}

export default function UploadPanel({ onSucesso }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [ligado, setLigado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCarregando(true);
    setLigado(true);
    setMensagem(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar arquivo.");
      setMensagem({ tipo: "ok", texto: `${data.qtd} chamados sincronizados com a base.` });
      onSucesso();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro desconhecido." });
    } finally {
      setCarregando(false);
      setTimeout(() => setLigado(false), 900);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        className={`toggle-throw group inline-flex items-center gap-2.5 rounded-sm border px-3 py-1.5 cursor-pointer transition-colors ${
          ligado ? "border-lamp-green bg-lamp-green-soft" : "border-white/15 bg-white/[0.04] hover:border-copper"
        }`}
      >
        <span
          className={`pilot-lamp inline-block h-2 w-2 rounded-full shrink-0 ${ligado ? "lamp-flicker" : ""}`}
          style={{
            backgroundColor: ligado ? "var(--color-lamp-green)" : "var(--color-fog)",
            color: ligado ? "var(--color-lamp-green)" : "var(--color-fog)",
          }}
          aria-hidden
        />
        <span
          className={`text-xs font-display font-medium tracking-[0.04em] uppercase ${
            ligado ? "text-lamp-green" : "text-white/85 group-hover:text-copper"
          }`}
        >
          {carregando ? "Processando…" : "Carregar extração"}
        </span>
        <span className="text-[10px] font-mono text-white/35">.csv / .xlsx</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleChange}
          disabled={carregando}
          className="hidden"
        />
      </label>
      {mensagem && (
        <span className={`text-xs font-mono ${mensagem.tipo === "ok" ? "text-lamp-green" : "text-signal"}`}>
          {mensagem.texto}
        </span>
      )}
    </div>
  );
}
