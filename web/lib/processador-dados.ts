import { CalculadoraSLA } from "./calculadora-sla";
import type { Incidente } from "./types";

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function identificarEmpresa(serviceStr: unknown): string {
  if (typeof serviceStr !== "string") return "Outros";
  const s = serviceStr.toUpperCase();
  if (s.includes("CEARA") || s.includes("COELCE")) return "CE";
  if (s.includes("RIO") || s.includes("AMPLA")) return "RJ";
  if (s.includes("SAO PAULO") || s.includes("SP")) return "SP";
  return "Outros";
}

export function extrairPartesDescription(shortDesc: unknown): {
  macro: string;
  categoria: string;
  subcategoria: string;
  descLimpa: string;
} {
  if (typeof shortDesc !== "string") {
    return { macro: "N/A", categoria: "N/A", subcategoria: "N/A", descLimpa: "N/A" };
  }

  let macro = "N/A";
  let categoria = "N/A";
  let subcategoria = "N/A";
  let descLimpa = shortDesc;

  const macroMatch = shortDesc.match(/\[(.*?)\]/);
  if (macroMatch) {
    macro = macroMatch[1].trim().toUpperCase();
    descLimpa = descLimpa.replace(macroMatch[0], "");
  }

  const catMatch = descLimpa.match(/\((.*?)\)/);
  if (catMatch) {
    const partes = catMatch[1].split("/");
    categoria = partes[0] ? partes[0].trim().toUpperCase() : "N/A";
    subcategoria = partes[1] ? partes[1].trim().toUpperCase() : "N/A";
    descLimpa = descLimpa.replace(catMatch[0], "");
  }

  descLimpa = descLimpa.replace(/\s+/g, " ").trim();
  if (!descLimpa) descLimpa = "N/A";

  return { macro, categoria, subcategoria, descLimpa };
}

export function formatarMesPt(data: Date | null): string {
  if (!data || isNaN(data.getTime())) return "N/A";
  return `${MESES_PT[data.getUTCMonth()]}/${String(data.getUTCFullYear()).slice(2)}`;
}

const MAPA_COLUNAS_SERVICENOW: Record<string, string> = {
  number: "Number",
  business_service: "Service",
  opened_at: "Opened",
  resolved_at: "Resolved",
  short_description: "Short description",
  state: "State",
  priority: "Priority",
  assignment_group: "Assignment group",
  assigned_to: "Assigned to",
  close_code: "Close code",
  close_notes: "Close notes",
  u_eus_es_ict_service: "ICT Service",
  u_eus_es_ict_subservice: "ICT Subservice",
  reopen_count: "Reopen count",
  opened_by: "Opened by",
  description: "Description",
};

export function normalizarColunas(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (rows.length === 0) return rows;
  const colunasOriginais = Object.keys(rows[0]);
  const renomear: Record<string, string> = {};
  for (const col of colunasOriginais) {
    const alvo = MAPA_COLUNAS_SERVICENOW[col.trim().toLowerCase()];
    if (alvo && !colunasOriginais.includes(alvo)) {
      renomear[col] = alvo;
    }
  }
  if (Object.keys(renomear).length === 0) return rows;
  return rows.map((row) => {
    const novo: Record<string, unknown> = { ...row };
    for (const [origem, destino] of Object.entries(renomear)) {
      novo[destino] = novo[origem];
    }
    return novo;
  });
}

/** Parseia datas no padrão ServiceNow (dayfirst: DD/MM/YYYY HH:mm:ss ou variações ISO)
 * como horário "de parede" (sem conversão de fuso), igual ao pandas com tz naive. */
export function parseDataServiceNow(valor: unknown): Date | null {
  if (valor == null || valor === "") return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;

  const s = String(valor).trim();

  // dd/mm/yyyy[ hh:mm[:ss]]
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const [, dd, mm, yyyy, hh, min, ss] = brMatch;
    return new Date(Date.UTC(
      Number(yyyy), Number(mm) - 1, Number(dd),
      hh ? Number(hh) : 0, min ? Number(min) : 0, ss ? Number(ss) : 0
    ));
  }

  // yyyy-mm-dd[ hh:mm[:ss]]
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [, yyyy, mm, dd, hh, min, ss] = isoMatch;
    return new Date(Date.UTC(
      Number(yyyy), Number(mm) - 1, Number(dd),
      hh ? Number(hh) : 0, min ? Number(min) : 0, ss ? Number(ss) : 0
    ));
  }

  const generico = new Date(s);
  return isNaN(generico.getTime()) ? null : generico;
}

export function processarBase(
  linhasBrutas: Record<string, unknown>[],
  diasNaoUteisExtra?: string[]
): Incidente[] {
  const calc = new CalculadoraSLA(diasNaoUteisExtra);
  const linhas = normalizarColunas(linhasBrutas);

  return linhas.map((row): Incidente => {
    const opened = parseDataServiceNow(row["Opened"]);
    const resolved = parseDataServiceNow(row["Resolved"]);
    const empresa = identificarEmpresa(row["Service"]);
    const { macro, categoria, subcategoria, descLimpa } = extrairPartesDescription(row["Short description"]);

    const sla = calc.calcularSla(opened, resolved);
    let tma: number | null = null;
    if (opened && resolved) {
      tma = (resolved.getTime() - opened.getTime()) / 86400000;
      if (tma < 0) tma = 0;
    }

    return {
      Number: String(row["Number"] ?? ""),
      Service: (row["Service"] as string) ?? null,
      Opened: opened ? opened.toISOString() : null,
      Resolved: resolved ? resolved.toISOString() : null,
      "Short description": (row["Short description"] as string) ?? null,
      State: (row["State"] as string) ?? null,
      Priority: (row["Priority"] as string) ?? null,
      "Assignment group": (row["Assignment group"] as string) ?? null,
      "ICT Service": (row["ICT Service"] as string) ?? null,
      "Assigned to": (row["Assigned to"] as string) ?? null,
      "Close code": (row["Close code"] as string) ?? null,
      "Close notes": (row["Close notes"] as string) ?? null,
      "Reopen count": row["Reopen count"] != null ? Number(row["Reopen count"]) : null,
      Empresa: empresa,
      Macro: macro,
      Categoria: categoria,
      SubCategoria: subcategoria,
      Descricao_Tratada: descLimpa,
      "SLA - Dias (8 h)": sla,
      "TMA - Dias corridos": tma,
    };
  });
}

export function derivarResolvidos(incidentes: Incidente[]): Incidente[] {
  return incidentes.filter((i) => i.Resolved != null && i["SLA - Dias (8 h)"] != null);
}

export function mesDisplay(iso: string | null): string {
  if (!iso) return "N/A";
  return formatarMesPt(new Date(iso));
}

export function mesSort(iso: string | null): string {
  if (!iso) return "9999-99";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
