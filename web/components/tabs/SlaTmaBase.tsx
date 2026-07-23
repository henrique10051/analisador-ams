"use client";

import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import type { Incidente } from "@/lib/types";
import { mesDisplay, mesSort } from "@/lib/processador-dados";
import { GRUPOS_DEFAULT_PADRAO, SERVICO_DEFAULT_PADRAO, ESTADOS_DEFAULT_PADRAO } from "@/lib/constants";
import MultiSelect from "@/components/MultiSelect";
import Collapsible from "@/components/Collapsible";
import Kpi from "@/components/Kpi";
import Panel from "@/components/Panel";
import ChartToolbar from "@/components/ChartToolbar";
import EditableTable from "@/components/EditableTable";
import PeriodSelect, { type PeriodoPreset } from "@/components/PeriodSelect";

function rotuloDecimal(v: unknown): string {
  return typeof v === "number" ? v.toFixed(1) : "";
}

interface Props {
  incidentesResolvidos: Incidente[];
  campo: "SLA - Dias (8 h)" | "TMA - Dias corridos";
  eyebrow: string;
  titulo: string;
  unidade: string;
  corAccent: string;
  slugArquivo: string;
}

export default function SlaTmaBase({
  incidentesResolvidos,
  campo,
  eyebrow,
  titulo,
  unidade,
  corAccent,
  slugArquivo,
}: Props) {
  const grupos = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i["Assignment group"]).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );
  const servicos = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i["ICT Service"]).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );
  const estados = useMemo(
    () => Array.from(new Set(incidentesResolvidos.map((i) => i.State).filter((v): v is string => !!v))).sort(),
    [incidentesResolvidos]
  );

  const [fGrupo, setFGrupo] = useState<string[]>(() => grupos.filter((g) => g.includes(GRUPOS_DEFAULT_PADRAO)));
  const [fServico, setFServico] = useState<string[]>(() => servicos.filter((s) => s.includes(SERVICO_DEFAULT_PADRAO)));
  const [fEstado, setFEstado] = useState<string[]>(() => estados.filter((e) => ESTADOS_DEFAULT_PADRAO.includes(e)));
  const [agora] = useState(() => Date.now());
  const [periodo, setPeriodo] = useState<PeriodoPreset>("12");

  const dataMaxResolved = useMemo(() => {
    const tempos = incidentesResolvidos
      .map((i) => (i.Resolved ? new Date(i.Resolved).getTime() : 0))
      .filter((t) => t > 0);
    return tempos.length ? Math.max(...tempos) : agora;
  }, [incidentesResolvidos, agora]);

  const inicioPeriodoTs = useMemo(() => {
    if (periodo === "tudo") return null;
    const cutoff = new Date(dataMaxResolved);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - Number(periodo));
    return cutoff.getTime();
  }, [periodo, dataMaxResolved]);

  const filtrados = useMemo(
    () =>
      incidentesResolvidos.filter((i) => {
        if (inicioPeriodoTs != null) {
          const resolvedTs = i.Resolved ? new Date(i.Resolved).getTime() : 0;
          if (resolvedTs < inicioPeriodoTs) return false;
        }
        return (
          (fGrupo.length === 0 || fGrupo.includes(i["Assignment group"] ?? "")) &&
          (fServico.length === 0 || fServico.includes(i["ICT Service"] ?? "")) &&
          (fEstado.length === 0 || fEstado.includes(i.State ?? ""))
        );
      }),
    [incidentesResolvidos, fGrupo, fServico, fEstado, inicioPeriodoTs]
  );

  const valores = filtrados.map((i) => i[campo] as number).filter((v) => v != null);
  const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  const max = valores.length ? Math.max(...valores) : 0;

  const dadosMes = useMemo(() => {
    const grupos = new Map<
      string,
      { sortKey: string; mes: string; soma: number; qtd: number; max: number; min: number }
    >();
    for (const i of filtrados) {
      const valor = i[campo] as number | null;
      if (valor == null) continue;
      const sortKey = mesSort(i.Resolved);
      const mes = mesDisplay(i.Resolved);
      const atual = grupos.get(sortKey) ?? { sortKey, mes, soma: 0, qtd: 0, max: -Infinity, min: Infinity };
      atual.soma += valor;
      atual.qtd += 1;
      atual.max = Math.max(atual.max, valor);
      atual.min = Math.min(atual.min, valor);
      grupos.set(sortKey, atual);
    }
    return Array.from(grupos.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((g) => ({ mes: g.mes, sortKey: g.sortKey, media: g.soma / g.qtd, max: g.max, min: g.min }));
  }, [filtrados, campo]);

  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const mesAtivo = mesSelecionado ?? dadosMes[dadosMes.length - 1]?.mes ?? null;

  const linhasDetalhe = useMemo(
    () =>
      filtrados
        .filter((i) => mesDisplay(i.Resolved) === mesAtivo)
        .sort((a, b) => ((b[campo] as number) ?? 0) - ((a[campo] as number) ?? 0)),
    [filtrados, mesAtivo, campo]
  );

  const colunasTabela: (keyof Incidente)[] = [
    "Number",
    "Empresa",
    "Macro",
    "Categoria",
    "SubCategoria",
    "Descricao_Tratada",
    campo,
    "Short description",
    "Assigned to",
  ];

  const refMedia = useRef<HTMLDivElement>(null);
  const refExtremos = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: corAccent }}>
          {eyebrow}
        </span>
        <h2 className="font-display text-xl font-semibold text-graphite">{titulo}</h2>
      </div>

      <PeriodSelect value={periodo} onChange={setPeriodo} label="Período (Resolução)" />

      <Collapsible label="Filtros">
        <MultiSelect label="Grupo de Atribuição" opcoes={grupos} selecionados={fGrupo} onChange={setFGrupo} />
        <MultiSelect label="Serviço ICT" opcoes={servicos} selecionados={fServico} onChange={setFServico} />
        <MultiSelect label="Estado do Ticket" opcoes={estados} selecionados={fEstado} onChange={setFEstado} />
      </Collapsible>

      {filtrados.length === 0 ? (
        <p className="text-amber text-sm font-mono">Selecione filtros válidos para visualizar {titulo}.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Kpi label={`Média ${titulo}`} value={`${media.toFixed(2)} ${unidade}`} accent={corAccent} />
            <Kpi label="Total de tickets" value={String(filtrados.length)} />
            <Kpi label={`Máximo ${titulo}`} value={`${max.toFixed(1)} ${unidade}`} accent={corAccent} />
          </div>

          <Panel
            title={`Média de ${titulo} mensal`}
            actions={<ChartToolbar targetRef={refMedia} filename={`${slugArquivo}-media-mensal`} />}
          >
            <div ref={refMedia} className="bg-paper-raised">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={dadosMes} margin={{ top: 24, bottom: 8 }}>
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
                  <YAxis tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} stroke="var(--color-fog)" width={40} />
                  <Tooltip
                    contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2 }}
                    formatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)}
                  />
                  <Bar dataKey="media" name="Média" fill={corAccent} radius={[2, 2, 0, 0]}>
                    <LabelList
                      dataKey="media"
                      formatter={rotuloDecimal}
                      position="top"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      fill="var(--color-graphite)"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title={`Extremos de ${titulo}`}
            actions={<ChartToolbar targetRef={refExtremos} filename={`${slugArquivo}-extremos`} />}
          >
            <div ref={refExtremos} className="bg-paper-raised">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dadosMes} margin={{ top: 28, bottom: 8, right: 16 }}>
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
                    domain={[0, (max: number) => Math.ceil(max * 1.25 * 10) / 10]}
                  />
                  <Tooltip
                    contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2 }}
                    formatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)}
                  />
                  <Line type="monotone" dataKey="max" name="Máximo" stroke="var(--color-amber)" strokeWidth={2} dot={{ r: 3 }}>
                    <LabelList
                      dataKey="max"
                      formatter={rotuloDecimal}
                      position="top"
                      offset={10}
                      fontSize={10}
                      fontFamily="var(--font-mono)"
                      fill="var(--color-amber)"
                    />
                  </Line>
                  <Line type="monotone" dataKey="min" name="Mínimo" stroke="var(--color-circuit)" strokeWidth={2} dot={{ r: 3 }}>
                    <LabelList
                      dataKey="min"
                      formatter={rotuloDecimal}
                      position="top"
                      offset={10}
                      fontSize={10}
                      fontFamily="var(--font-mono)"
                      fill="var(--color-circuit)"
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div>
            <h3 className="font-display text-sm font-semibold text-graphite mb-2">
              Detalhes do mês (top infratores)
            </h3>
            <select
              value={mesAtivo ?? ""}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="mb-3 border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
            >
              {[...dadosMes].reverse().map((d) => (
                <option key={d.mes} value={d.mes}>
                  {d.mes}
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
