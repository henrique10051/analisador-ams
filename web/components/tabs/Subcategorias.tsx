"use client";

import { useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import type { Incidente } from "@/lib/types";
import { CORES_EMPRESA, GRUPOS_DEFAULT_PADRAO, ESTADOS_DEFAULT_PADRAO } from "@/lib/constants";
import MultiSelect from "@/components/MultiSelect";
import Collapsible from "@/components/Collapsible";
import DateField from "@/components/DateField";
import Panel from "@/components/Panel";
import ChartToolbar from "@/components/ChartToolbar";
import EditableTable from "@/components/EditableTable";

function rotuloValor(v: unknown): string {
  return typeof v === "number" && v > 0 ? String(v) : "";
}

function paraDataISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  incidentesResolvidos: Incidente[];
}

export default function Subcategorias({ incidentesResolvidos }: Props) {
  const [agora] = useState(() => Date.now());
  const dataMax = useMemo(() => {
    const datas = incidentesResolvidos.map((i) => (i.Opened ? new Date(i.Opened).getTime() : 0));
    const max = datas.length ? Math.max(...datas) : agora;
    return new Date(max);
  }, [incidentesResolvidos, agora]);

  const [dIni, setDIni] = useState(() => paraDataISO(new Date(dataMax.getTime() - 30 * 86400000)));
  const [dFim, setDFim] = useState(() => paraDataISO(dataMax));

  const grupos = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i["Assignment group"]).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );
  const estados = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i.State).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );
  const categorias = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i.Categoria))).sort(),
    [incidentesResolvidos]
  );

  const [fGrupo, setFGrupo] = useState<string[]>(() => grupos.filter((g) => g.includes(GRUPOS_DEFAULT_PADRAO)));
  const [fEstado, setFEstado] = useState<string[]>(() => estados.filter((e) => ESTADOS_DEFAULT_PADRAO.includes(e)));
  const [fCategoria, setFCategoria] = useState<string[]>(() => categorias);

  const filtrados = useMemo(() => {
    const inicioTs = new Date(dIni).getTime();
    const fimTs = new Date(dFim).getTime() + 86400000 - 1000;
    return incidentesResolvidos.filter((i) => {
      if (!i.Opened) return false;
      const openedTs = new Date(i.Opened).getTime();
      if (openedTs < inicioTs || openedTs > fimTs) return false;
      if (fGrupo.length && !fGrupo.includes(i["Assignment group"] ?? "")) return false;
      if (fEstado.length && !fEstado.includes(i.State ?? "")) return false;
      if (fCategoria.length && !fCategoria.includes(i.Categoria)) return false;
      return true;
    });
  }, [incidentesResolvidos, dIni, dFim, fGrupo, fEstado, fCategoria]);

  const { dadosPlot, ordem } = useMemo(() => {
    const contagem = new Map<string, number>();
    const porSub = new Map<string, Record<string, number | string>>();
    for (const i of filtrados) {
      contagem.set(i.SubCategoria, (contagem.get(i.SubCategoria) ?? 0) + 1);
      const atual = porSub.get(i.SubCategoria) ?? { subcategoria: i.SubCategoria };
      atual[i.Empresa] = ((atual[i.Empresa] as number) ?? 0) + 1;
      porSub.set(i.SubCategoria, atual);
    }
    const ordemSub = Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
    const dados = ordemSub.map((c) => porSub.get(c)!).reverse();
    return { dadosPlot: dados, ordem: ordemSub };
  }, [filtrados]);

  const [subSel, setSubSel] = useState<string | null>(null);
  const subAtiva = subSel ?? ordem[0] ?? null;

  const linhasDetalhe = useMemo(
    () =>
      filtrados
        .filter((i) => i.SubCategoria === subAtiva)
        .sort((a, b) => new Date(b.Opened ?? 0).getTime() - new Date(a.Opened ?? 0).getTime()),
    [filtrados, subAtiva]
  );

  const colunasTabela: (keyof Incidente)[] = [
    "Number",
    "Empresa",
    "Macro",
    "Categoria",
    "SubCategoria",
    "Descricao_Tratada",
    "Opened",
    "TMA - Dias corridos",
    "SLA - Dias (8 h)",
    "Assigned to",
  ];

  const refChart = useRef<HTMLDivElement>(null);
  const altura = Math.max(360, ordem.length * 30);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-copper">05 · Drilldown</span>
        <h2 className="font-display text-xl font-semibold text-graphite">Subcategorias</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <DateField label="Início" value={dIni} onChange={setDIni} />
        <DateField label="Fim" value={dFim} onChange={setDFim} />
      </div>

      <Collapsible label="Filtros técnicos">
        <MultiSelect label="Grupo" opcoes={grupos} selecionados={fGrupo} onChange={setFGrupo} />
        <MultiSelect label="Estado" opcoes={estados} selecionados={fEstado} onChange={setFEstado} />
        <MultiSelect label="Categoria" opcoes={categorias} selecionados={fCategoria} onChange={setFCategoria} />
      </Collapsible>

      {filtrados.length === 0 ? (
        <p className="text-amber text-sm font-mono">Nenhum dado encontrado para os filtros selecionados.</p>
      ) : (
        <>
          <Panel
            title="Volume de incidentes por subcategoria e DX"
            actions={<ChartToolbar targetRef={refChart} filename="subcategorias-ams" />}
          >
            <div ref={refChart} className="bg-paper-raised">
              <ResponsiveContainer width="100%" height={altura}>
                <BarChart data={dadosPlot} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis type="number" tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} stroke="var(--color-fog)" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="subcategoria"
                    width={180}
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                    stroke="var(--color-fog)"
                  />
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2 }} />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
                  {Object.keys(CORES_EMPRESA).map((emp) => (
                    <Bar key={emp} dataKey={emp} name={emp} stackId="dx" fill={CORES_EMPRESA[emp]}>
                      <LabelList dataKey={emp} formatter={rotuloValor} position="center" fontSize={10} fontFamily="var(--font-mono)" fill="#ffffff" />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div>
            <h3 className="font-display text-sm font-semibold text-graphite mb-2">Detalhes por subcategoria</h3>
            <select
              value={subAtiva ?? ""}
              onChange={(e) => setSubSel(e.target.value)}
              className="mb-3 border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
            >
              {ordem.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <EditableTable linhas={linhasDetalhe} colunas={colunasTabela} />
          </div>
        </>
      )}
    </div>
  );
}
