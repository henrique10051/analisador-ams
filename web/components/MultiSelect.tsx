"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  opcoes: string[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
}

export default function MultiSelect({ label, opcoes, selecionados, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function toggle(valor: string) {
    if (selecionados.includes(valor)) {
      onChange(selecionados.filter((v) => v !== valor));
    } else {
      onChange([...selecionados, valor]);
    }
  }

  const resumo =
    selecionados.length === 0
      ? "Nenhum"
      : selecionados.length === opcoes.length
      ? "Todos"
      : `${selecionados.length} selecionado(s)`;

  return (
    <div ref={ref} className="relative">
      <label className="block font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-fog mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full text-left border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised hover:border-copper text-graphite font-mono"
      >
        {resumo}
      </button>
      {aberto && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto border border-line rounded-sm bg-paper-raised shadow-lg">
          {opcoes.length === 0 && <div className="px-2 py-1.5 text-sm text-fog">Sem opções</div>}
          {opcoes.map((op) => (
            <label
              key={op}
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-copper-soft/40 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selecionados.includes(op)}
                onChange={() => toggle(op)}
                className="accent-copper"
              />
              {op}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
