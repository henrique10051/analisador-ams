import { getClient } from "./supabase";
import type { Incidente, DiaNaoUtil } from "./types";
import { CAMPOS_EDITAVEIS } from "./types";

const TABELA_INCIDENTES = "incidentes";
const TABELA_DIAS_NAO_UTEIS = "dias_nao_uteis";

const MAPA_COLUNAS: Record<keyof Incidente, string> = {
  Number: "number",
  Service: "service",
  Opened: "opened",
  Resolved: "resolved",
  "Short description": "short_description",
  State: "state",
  Priority: "priority",
  "Assignment group": "assignment_group",
  "ICT Service": "ict_service",
  "Assigned to": "assigned_to",
  "Close code": "close_code",
  "Close notes": "close_notes",
  "Reopen count": "reopen_count",
  Empresa: "empresa",
  Macro: "macro",
  Categoria: "categoria",
  SubCategoria: "subcategoria",
  Descricao_Tratada: "descricao_tratada",
  "SLA - Dias (8 h)": "sla_dias",
  "TMA - Dias corridos": "tma_dias",
};

const COLUNAS_INVERTIDAS = Object.fromEntries(
  Object.entries(MAPA_COLUNAS).map(([k, v]) => [v, k])
) as Record<string, string>;

function incidenteParaRegistro(inc: Incidente): Record<string, unknown> {
  const registro: Record<string, unknown> = {};
  for (const [colOrigem, colDestino] of Object.entries(MAPA_COLUNAS)) {
    registro[colDestino] = (inc as unknown as Record<string, unknown>)[colOrigem] ?? null;
  }
  return registro;
}

export async function upsertIncidentes(incidentes: Incidente[], tamanhoLote = 500): Promise<number> {
  // dedup por Number, mantendo o último
  const porNumber = new Map<string, Incidente>();
  for (const inc of incidentes) porNumber.set(inc.Number, inc);
  const registros = Array.from(porNumber.values()).map(incidenteParaRegistro);

  if (registros.length === 0) return 0;

  const client = getClient();
  let total = 0;
  for (let i = 0; i < registros.length; i += tamanhoLote) {
    const lote = registros.slice(i, i + tamanhoLote);
    const { error } = await client.from(TABELA_INCIDENTES).upsert(lote, { onConflict: "number" });
    if (error) throw new Error(`Erro ao salvar incidentes: ${error.message}`);
    total += lote.length;
  }
  return total;
}

export async function carregarIncidentes(): Promise<Incidente[]> {
  const client = getClient();
  const pagina = 1000;
  let inicio = 0;
  const registros: Record<string, unknown>[] = [];

  for (;;) {
    const { data, error } = await client
      .from(TABELA_INCIDENTES)
      .select("*")
      .range(inicio, inicio + pagina - 1);
    if (error) throw new Error(`Erro ao carregar incidentes: ${error.message}`);
    registros.push(...(data ?? []));
    if (!data || data.length < pagina) break;
    inicio += pagina;
  }

  return registros.map((row): Incidente => {
    const incidente: Record<string, unknown> = {};
    for (const [colBanco, colOrigem] of Object.entries(COLUNAS_INVERTIDAS)) {
      incidente[colOrigem] = row[colBanco] ?? null;
    }
    return incidente as unknown as Incidente;
  });
}

export async function atualizarCamposIncidente(
  number: string,
  campos: Partial<Record<(typeof CAMPOS_EDITAVEIS)[number], string>>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(campos)) {
    if ((CAMPOS_EDITAVEIS as readonly string[]).includes(campo)) {
      payload[MAPA_COLUNAS[campo as keyof Incidente]] = valor ?? null;
    }
  }
  if (Object.keys(payload).length === 0) return;

  const client = getClient();
  const { error } = await client.from(TABELA_INCIDENTES).update(payload).eq("number", number);
  if (error) throw new Error(`Erro ao atualizar incidente: ${error.message}`);
}

export async function carregarDiasNaoUteis(): Promise<DiaNaoUtil[]> {
  const client = getClient();
  const { data, error } = await client.from(TABELA_DIAS_NAO_UTEIS).select("*").order("data");
  if (error) throw new Error(`Erro ao carregar dias não úteis: ${error.message}`);
  return (data ?? []) as unknown as DiaNaoUtil[];
}

export async function adicionarDiaNaoUtil(dataIso: string, motivo = ""): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from(TABELA_DIAS_NAO_UTEIS)
    .upsert({ data: dataIso, motivo }, { onConflict: "data" });
  if (error) throw new Error(`Erro ao adicionar dia não útil: ${error.message}`);
}

export async function removerDiaNaoUtil(id: number): Promise<void> {
  const client = getClient();
  const { error } = await client.from(TABELA_DIAS_NAO_UTEIS).delete().eq("id", id);
  if (error) throw new Error(`Erro ao remover dia não útil: ${error.message}`);
}
