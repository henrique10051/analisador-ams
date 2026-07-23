export interface Incidente {
  Number: string;
  Service: string | null;
  Opened: string | null; // ISO
  Resolved: string | null; // ISO
  "Short description": string | null;
  State: string | null;
  Priority: string | null;
  "Assignment group": string | null;
  "ICT Service": string | null;
  "Assigned to": string | null;
  "Close code": string | null;
  "Close notes": string | null;
  "Reopen count": number | null;
  Empresa: string;
  Macro: string;
  Categoria: string;
  SubCategoria: string;
  Descricao_Tratada: string;
  "SLA - Dias (8 h)": number | null;
  "TMA - Dias corridos": number | null;
}

export const CAMPOS_EDITAVEIS = [
  "Macro",
  "Categoria",
  "SubCategoria",
  "Descricao_Tratada",
] as const;

export interface DiaNaoUtil {
  id: number;
  data: string;
  motivo: string | null;
}
