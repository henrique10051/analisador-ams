// Cores das lâmpadas piloto por distribuidora — deliberadamente distintas
// das cores semânticas de status (verde/âmbar/vermelho = cumprimento de SLA).
export const CORES_EMPRESA: Record<string, string> = {
  CE: "#c8963f", // latão
  RJ: "#4fb8c4", // ciano
  SP: "#9884d6", // violeta
  Outros: "#7a7f85", // cinza chumbo
};

export const GRUPOS_DEFAULT_PADRAO = "FORCEBEAT";
export const SERVICO_DEFAULT_PADRAO = "User Support";
export const ESTADOS_DEFAULT_PADRAO = ["Closed", "Resolved"];
