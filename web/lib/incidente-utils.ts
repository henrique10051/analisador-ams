import type { Incidente } from "./types";

/** Chamado cuja descrição curta não seguiu a convenção `[MACRO](Categoria/Subcategoria)`,
 * ficando sem classificação automática — precisa de triagem manual. */
export function foraDoPadrao(inc: Incidente): boolean {
  return inc.Macro === "N/A" || inc.Categoria === "N/A" || inc.SubCategoria === "N/A";
}
