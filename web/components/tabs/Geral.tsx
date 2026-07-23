"use client";

import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { Incidente } from "@/lib/types";
import { formatarMesPt } from "@/lib/processador-dados";
import { CORES_EMPRESA } from "@/lib/constants";
import EditableTable from "@/components/EditableTable";
import MultiSelect from "@/components/MultiSelect";
import Panel from "@/components/Panel";
import ChartToolbar from "@/components/ChartToolbar";
import PeriodSelect, { type PeriodoPreset } from "@/components/PeriodSelect";

interface Props {
  incidentes: Incidente[];
  onAtualizado: () => void;
}

function mesSortKey(iso: string | null): string {
  if (!iso) return "9999-99";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rotuloValor(v: unknown): string {
  return typeof v === "number" && v > 0 ? String(v) : "";
}

export default function Geral({ incidentes, onAtualizado }: Props) {
  const [agora] = useState(() => Date.now());
  const [periodo, setPeriodo] = useState<PeriodoPreset>("12");

  const empresasDisponiveis = useMemo(
    () => Array.from(new Set(incidentes.map((i) => i.Empresa))).sort(),
    [incidentes]
  );
  const macrosDisponiveis = useMemo(
    () => Array.from(new Set(incidentes.map((i) => i.Macro))).sort(),
    [incidentes]
  );
  const categoriasDisponiveis = useMemo(
    () => Array.from(new Set(incidentes.map((i) => i.Categoria))).sort(),
    [incidentes]
  );
  const gruposDisponiveis = useMemo(
    () =>
      Array.from(new Set(incidentes.map((i) => i["Assignment group"]).filter((v): v is string => !!v))).sort(),
    [incidentes]
  );

  const [fEmpresa, setFEmpresa] = useState<string[]>(["CE", "RJ", "SP"]);
  const [fMacro, setFMacro] = useState<string[]>([]);
  const [fCategoria, setFCategoria] = useState<string[]>([]);
  const [fGrupo, setFGrupo] = useState<string[]>([]);

  const dataMaxOpened = useMemo(() => {
    const tempos = incidentes.map((i) => (i.Opened ? new Date(i.Opened).getTime() : 0)).filter((t) => t > 0);
    return tempos.length ? Math.max(...tempos) : agora;
  }, [incidentes, agora]);

  const inicioPeriodoTs = useMemo(() => {
    if (periodo === "tudo") return null;
    const cutoff = new Date(dataMaxOpened);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - Number(periodo));
    return cutoff.getTime();
  }, [periodo, dataMaxOpened]);

  const filtrados = useMemo(() => {
    return incidentes.filter((i) => {
      if (!i.Opened) return false;
      const openedTs = new Date(i.Opened).getTime();
      if (inicioPeriodoTs != null && openedTs < inicioPeriodoTs) return false;
      if (fEmpresa.length && !fEmpresa.includes(i.Empresa)) return false;
      if (fMacro.length && !fMacro.includes(i.Macro)) return false;
      if (fCategoria.length && !fCategoria.includes(i.Categoria)) return false;
      if (fGrupo.length && !fGrupo.includes(i["Assignment group"] ?? "")) return false;
      return true;
    });
  }, [incidentes, inicioPeriodoTs, fEmpresa, fMacro, fCategoria, fGrupo]);

  const dadosVolumeTotal = useMemo(() => {
    const grupos = new Map<string, { sortKey: string; mes: string; total: number }>();
    for (const i of filtrados) {
      if (!i.Opened) continue;
      const sortKey = mesSortKey(i.Opened);
      const mes = formatarMesPt(new Date(i.Opened));
      const atual = grupos.get(sortKey) ?? { sortKey, mes, total: 0 };
      atual.total += 1;
      grupos.set(sortKey, atual);
    }
    return Array.from(grupos.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filtrados]);

  const dadosPorEmpresa = useMemo(() => {
    const grupos = new Map<string, Record<string, number | string>>();
    for (const i of filtrados) {
      if (!i.Opened) continue;
      const sortKey = mesSortKey(i.Opened);
      const mes = formatarMesPt(new Date(i.Opened));
      const atual = grupos.get(sortKey) ?? { sortKey, mes };
      atual[i.Empresa] = ((atual[i.Empresa] as number) ?? 0) + 1;
      grupos.set(sortKey, atual);
    }
    return Array.from(grupos.values()).sort((a, b) =>
      String(a.sortKey).localeCompare(String(b.sortKey))
    );
  }, [filtrados]);

  const colunasTabela: (keyof Incidente)[] = [
    "Number",
    "Empresa",
    "Macro",
    "Categoria",
    "SubCategoria",
    "Descricao_Tratada",
    "Opened",
    "State",
  ];

  const linhasTabela = useMemo(
    () =>
      [...filtrados].sort((a, b) => {
        const da = a.Opened ? new Date(a.Opened).getTime() : 0;
        const db = b.Opened ? new Date(b.Opened).getTime() : 0;
        return db - da;
      }),
    [filtrados]
  );

  const refVolumeTotal = useRef<HTMLDivElement>(null);
  const refPorEmpresa = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">01 · Volumetria</span>
        <h2 className="font-display text-xl font-semibold text-graphite">Geral</h2>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <PeriodSelect value={periodo} onChange={setPeriodo} />
        <div className="w-48">
          <MultiSelect label="Distribuidora" opcoes={empresasDisponiveis} selecionados={fEmpresa} onChange={setFEmpresa} />
        </div>
        <div className="w-56">
          <MultiSelect label="Macro / Service Request" opcoes={macrosDisponiveis} selecionados={fMacro} onChange={setFMacro} />
        </div>
        <div className="w-56">
          <MultiSelect label="Categoria" opcoes={categoriasDisponiveis} selecionados={fCategoria} onChange={setFCategoria} />
        </div>
        <div className="w-56">
          <MultiSelect label="Grupo de Atribuição" opcoes={gruposDisponiveis} selecionados={fGrupo} onChange={setFGrupo} />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-amber text-sm font-mono">Nenhum dado encontrado para os filtros selecionados.</p>
      ) : (
        <>
          <Panel
            title="Quantidade total de incidentes"
            actions={<ChartToolbar targetRef={refVolumeTotal} filename="volumetria-total-ams" />}
          >
            <div ref={refVolumeTotal} className="bg-paper-raised">
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={dadosVolumeTotal} margin={{ top: 28, bottom: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                    stroke="var(--color-fog)"
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                    stroke="var(--color-fog)"
                    width={40}
                    allowDecimals={false}
                    domain={[0, (max: number) => Math.ceil(max * 1.2)]}
                  />
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke="var(--color-copper)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-copper)" }}>
                    <LabelList dataKey="total" position="top" offset={10} fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-graphite)" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Incidentes por distribuidora"
            actions={<ChartToolbar targetRef={refPorEmpresa} filename="incidentes-por-dx-ams" />}
          >
            <div ref={refPorEmpresa} className="bg-paper-raised">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={dadosPorEmpresa} margin={{ top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                    stroke="var(--color-fog)"
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} stroke="var(--color-fog)" width={40} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2 }} />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
                  {empresasDisponiveis.map((emp) => (
                    <Bar key={emp} dataKey={emp} name={emp} fill={CORES_EMPRESA[emp] ?? "#8a8d8f"} radius={[2, 2, 0, 0]}>
                      <LabelList dataKey={emp} formatter={rotuloValor} position="center" fontSize={10} fontFamily="var(--font-mono)" fill="#ffffff" />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div>
            <h3 className="font-display text-sm font-semibold text-graphite mb-1">Detalhamento analítico</h3>
            <p className="text-xs text-fog mb-2">
              Edite Macro, Categoria, Subcategoria ou Descrição diretamente na tabela e clique em salvar.
            </p>
            <EditableTable linhas={linhasTabela} colunas={colunasTabela} onAtualizado={onAtualizado} />
          </div>
        </>
      )}
    </div>
  );
}
