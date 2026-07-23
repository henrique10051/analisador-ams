"use client";

interface Props {
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  tamanhoPagina: number;
  onPaginaChange: (pagina: number) => void;
  onTamanhoChange: (tamanho: number) => void;
  opcoesTamanho?: number[];
}

export default function Pagination({
  pagina,
  totalPaginas,
  totalItens,
  tamanhoPagina,
  onPaginaChange,
  onTamanhoChange,
  opcoesTamanho = [25, 50, 100],
}: Props) {
  const inicio = totalItens === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(pagina * tamanhoPagina, totalItens);

  function paginasVisiveis(): (number | "…")[] {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const paginas = new Set<number>([1, 2, totalPaginas - 1, totalPaginas, pagina - 1, pagina, pagina + 1]);
    const ordenadas = Array.from(paginas)
      .filter((p) => p >= 1 && p <= totalPaginas)
      .sort((a, b) => a - b);

    const resultado: (number | "…")[] = [];
    let anterior = 0;
    for (const p of ordenadas) {
      if (anterior && p - anterior > 1) resultado.push("…");
      resultado.push(p);
      anterior = p;
    }
    return resultado;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 text-sm">
      <div className="flex items-center gap-2 text-fog font-mono text-xs">
        <span>
          {inicio}–{fim} de {totalItens}
        </span>
        <span className="text-line">·</span>
        <label className="flex items-center gap-1">
          <select
            value={tamanhoPagina}
            onChange={(e) => onTamanhoChange(Number(e.target.value))}
            className="bg-transparent border border-line rounded px-1.5 py-0.5 font-mono text-xs text-graphite"
          >
            {opcoesTamanho.map((t) => (
              <option key={t} value={t}>
                {t}/página
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="px-2 py-1 rounded border border-line text-graphite disabled:opacity-30 disabled:cursor-not-allowed hover:border-copper hover:text-copper"
          >
            ‹
          </button>
          {paginasVisiveis().map((p, idx) =>
            p === "…" ? (
              <span key={`e-${idx}`} className="px-1 text-fog">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPaginaChange(p)}
                className={`min-w-[28px] px-2 py-1 rounded border ${
                  p === pagina
                    ? "border-copper bg-copper text-white"
                    : "border-line text-graphite hover:border-copper hover:text-copper"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPaginaChange(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="px-2 py-1 rounded border border-line text-graphite disabled:opacity-30 disabled:cursor-not-allowed hover:border-copper hover:text-copper"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
