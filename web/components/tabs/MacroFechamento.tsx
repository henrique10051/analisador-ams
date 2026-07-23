"use client";

import { useMemo, useState } from "react";
import type { Incidente } from "@/lib/types";
import { GRUPOS_DEFAULT_PADRAO } from "@/lib/constants";
import MultiSelect from "@/components/MultiSelect";
import Collapsible from "@/components/Collapsible";
import DateField from "@/components/DateField";
import Panel from "@/components/Panel";
import EditableTable from "@/components/EditableTable";

function paraDataISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  incidentesResolvidos: Incidente[];
}

export default function MacroFechamento({ incidentesResolvidos }: Props) {
  const [agora] = useState(() => Date.now());
  const dataMax = useMemo(() => {
    const datas = incidentesResolvidos.map((i) => (i.Resolved ? new Date(i.Resolved).getTime() : 0));
    const max = datas.length ? Math.max(...datas) : agora;
    return new Date(max);
  }, [incidentesResolvidos, agora]);

  const [dIni, setDIni] = useState(() => paraDataISO(new Date(dataMax.getTime() - 30 * 86400000)));
  const [dFim, setDFim] = useState(() => paraDataISO(dataMax));

  const grupos = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i["Assignment group"]).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );
  const [fGrupo, setFGrupo] = useState<string[]>(() => grupos.filter((g) => g.includes(GRUPOS_DEFAULT_PADRAO)));

  const filtrados = useMemo(() => {
    const inicioTs = new Date(dIni).getTime();
    const fimTs = new Date(dFim).getTime() + 86400000 - 1000;
    return incidentesResolvidos.filter((i) => {
      if (!i.Resolved) return false;
      const resolvedTs = new Date(i.Resolved).getTime();
      if (resolvedTs < inicioTs || resolvedTs > fimTs) return false;
      if (fGrupo.length && !fGrupo.includes(i["Assignment group"] ?? "")) return false;
      return true;
    });
  }, [incidentesResolvidos, dIni, dFim, fGrupo]);

  const { matriz, macrosOrdenados, codesOrdenados } = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    const macrosSet = new Set<string>();
    const codesSet = new Set<string>();
    for (const i of filtrados) {
      const macro = i.Macro || "N/A";
      const code = i["Close code"] || "N/A";
      macrosSet.add(macro);
      codesSet.add(code);
      const linha = m.get(macro) ?? new Map<string, number>();
      linha.set(code, (linha.get(code) ?? 0) + 1);
      m.set(macro, linha);
    }
    return {
      matriz: m,
      macrosOrdenados: Array.from(macrosSet).sort(),
      codesOrdenados: Array.from(codesSet).sort(),
    };
  }, [filtrados]);

  const [macroSel, setMacroSel] = useState<string | null>(null);
  const [codeSel, setCodeSel] = useState<string | null>(null);
  const macroAtiva = macroSel ?? macrosOrdenados[0] ?? null;
  const codeAtivo = codeSel ?? codesOrdenados[0] ?? null;

  const linhasDetalhe = useMemo(
    () =>
      filtrados
        .filter((i) => (i.Macro || "N/A") === macroAtiva && (i["Close code"] || "N/A") === codeAtivo)
        .sort((a, b) => new Date(b.Resolved ?? 0).getTime() - new Date(a.Resolved ?? 0).getTime()),
    [filtrados, macroAtiva, codeAtivo]
  );

  const colunasTabela: (keyof Incidente)[] = [
    "Number",
    "Empresa",
    "Macro",
    "Categoria",
    "SubCategoria",
    "Descricao_Tratada",
    "Resolved",
    "Assigned to",
    "Close notes",
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">06 · Encerramento</span>
        <h2 className="font-display text-xl font-semibold text-graphite">Macro Fechamento</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <DateField label="Início (Resolução)" value={dIni} onChange={setDIni} />
        <DateField label="Fim (Resolução)" value={dFim} onChange={setDFim} />
      </div>

      <Collapsible label="Filtros de grupo">
        <MultiSelect label="Grupo" opcoes={grupos} selecionados={fGrupo} onChange={setFGrupo} />
      </Collapsible>

      {filtrados.length === 0 ? (
        <p className="text-amber text-sm font-mono">Nenhum dado encontrado para o período selecionado.</p>
      ) : (
        <>
          <Panel title="Resumo quantitativo (Macro × Motivo de fechamento)">
            <div className="overflow-x-auto border border-line rounded-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-ink">
                  <tr>
                    <th className="px-3 py-2 text-left font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-white/70 whitespace-nowrap sticky left-0 bg-ink">
                      Macro
                    </th>
                    {codesOrdenados.map((code) => (
                      <th
                        key={code}
                        className="px-3 py-2 text-right font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-white/70 whitespace-nowrap"
                      >
                        {code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {macrosOrdenados.map((macro, idx) => (
                    <tr key={macro} className={`border-t border-line ${idx % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-3 py-1.5 font-mono font-medium whitespace-nowrap sticky left-0 bg-paper-raised">
                        {macro}
                      </td>
                      {codesOrdenados.map((code) => (
                        <td key={code} className="px-3 py-1.5 font-mono text-right whitespace-nowrap">
                          {matriz.get(macro)?.get(code) ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div>
            <h3 className="font-display text-sm font-semibold text-graphite mb-2">Investigar incidentes</h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                value={macroAtiva ?? ""}
                onChange={(e) => setMacroSel(e.target.value)}
                className="border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
              >
                {macrosOrdenados.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={codeAtivo ?? ""}
                onChange={(e) => setCodeSel(e.target.value)}
                className="border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
              >
                {codesOrdenados.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {linhasDetalhe.length === 0 ? (
              <p className="text-fog text-sm font-mono">Nenhum incidente para esta combinação no período.</p>
            ) : (
              <>
                <p className="text-xs text-fog mb-2 font-mono">
                  Exibindo {linhasDetalhe.length} incidente(s) para {macroAtiva} / {codeAtivo}
                </p>
                <EditableTable linhas={linhasDetalhe} colunas={colunasTabela} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
