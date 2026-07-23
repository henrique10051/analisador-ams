"use client";

import { useMemo, useState } from "react";
import type { Incidente } from "@/lib/types";
import { foraDoPadrao } from "@/lib/incidente-utils";
import EditableTable from "@/components/EditableTable";

const COLUNAS_BASE: (keyof Incidente)[] = [
  "Number",
  "Service",
  "Opened",
  "Resolved",
  "Short description",
  "State",
  "Priority",
  "Assignment group",
  "ICT Service",
  "Assigned to",
  "Close code",
  "Close notes",
  "Reopen count",
  "Empresa",
  "Macro",
  "Categoria",
  "SubCategoria",
  "Descricao_Tratada",
  "SLA - Dias (8 h)",
  "TMA - Dias corridos",
];

interface Props {
  incidentes: Incidente[];
  onAtualizado: () => void;
}

export default function Base({ incidentes, onAtualizado }: Props) {
  const [somenteForaDoPadrao, setSomenteForaDoPadrao] = useState(false);

  const qtdForaDoPadrao = useMemo(() => incidentes.filter(foraDoPadrao).length, [incidentes]);

  const linhas = useMemo(
    () => (somenteForaDoPadrao ? incidentes.filter(foraDoPadrao) : incidentes),
    [incidentes, somenteForaDoPadrao]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">07 · Base completa</span>
          <h2 className="font-display text-xl font-semibold text-graphite">Base de dados tratada</h2>
        </div>

        {qtdForaDoPadrao > 0 && (
          <button
            type="button"
            onClick={() => setSomenteForaDoPadrao((v) => !v)}
            className={`toggle-throw inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 transition-colors ${
              somenteForaDoPadrao ? "border-signal bg-signal-soft" : "border-line bg-paper-raised hover:border-signal"
            }`}
          >
            <span
              className="pilot-lamp inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: "var(--color-signal)", color: "var(--color-signal)" }}
              aria-hidden
            />
            <span className="text-xs font-mono">
              <span className={somenteForaDoPadrao ? "text-signal font-semibold" : "text-graphite"}>
                {qtdForaDoPadrao}
              </span>{" "}
              <span className="text-fog">fora do padrão</span>
            </span>
          </button>
        )}
      </div>

      {somenteForaDoPadrao && (
        <p className="text-xs text-fog font-mono">
          Chamados cuja descrição curta não segue a convenção{" "}
          <span className="text-graphite">[MACRO](Categoria/Subcategoria)</span> — Macro, Categoria ou Subcategoria
          ficaram como N/A. Edite os campos na tabela abaixo para corrigir.
        </p>
      )}

      <EditableTable linhas={linhas} colunas={COLUNAS_BASE} onAtualizado={onAtualizado} />
    </div>
  );
}
