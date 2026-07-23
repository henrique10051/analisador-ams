"use client";

import { useMemo, useState } from "react";
import type { Incidente } from "@/lib/types";
import { CAMPOS_EDITAVEIS } from "@/lib/types";
import { foraDoPadrao } from "@/lib/incidente-utils";
import Pagination from "@/components/Pagination";

const LABELS: Record<string, string> = {
  Number: "Chamado",
  Empresa: "DX",
  Macro: "Macro",
  Categoria: "Categoria",
  SubCategoria: "Subcategoria",
  Descricao_Tratada: "Descrição",
  Opened: "Abertura",
  Resolved: "Resolução",
  State: "Status",
  "SLA - Dias (8 h)": "SLA (dias)",
  "TMA - Dias corridos": "TMA (dias)",
  "Short description": "Descrição original",
  "Assigned to": "Responsável",
  "Close notes": "Notas de fechamento",
  "Close code": "Motivo de Fechamento",
};

const COLUNAS_NUMERICAS = new Set(["SLA - Dias (8 h)", "TMA - Dias corridos", "Reopen count"]);
const COLUNAS_DATA = new Set(["Opened", "Resolved"]);

type Direcao = "asc" | "desc";

function valorOrdenacao(linha: Incidente, col: string): string | number {
  const valor = linha[col as keyof Incidente];
  if (valor == null) return COLUNAS_NUMERICAS.has(col) || COLUNAS_DATA.has(col) ? -Infinity : "";
  if (COLUNAS_DATA.has(col)) return new Date(valor as string).getTime();
  if (COLUNAS_NUMERICAS.has(col)) return Number(valor);
  return String(valor).toLowerCase();
}

const CORES_DX: Record<string, string> = {
  CE: "bg-copper-soft text-copper",
  RJ: "bg-circuit-soft text-circuit",
  SP: "bg-violet-soft text-violet",
  Outros: "bg-line text-fog",
};

function formatarValor(col: string, valor: unknown): string {
  if (valor == null || valor === "") return "—";
  if ((col === "Opened" || col === "Resolved") && typeof valor === "string") {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("pt-BR", { timeZone: "UTC" });
    }
  }
  if (typeof valor === "number") {
    return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
  }
  return String(valor);
}

interface Props {
  linhas: Incidente[];
  colunas: (keyof Incidente)[];
  onAtualizado?: () => void;
}

export default function EditableTable({ linhas, colunas, onAtualizado }: Props) {
  const [edicoes, setEdicoes] = useState<Record<string, Partial<Record<string, string>>>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(25);
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: Direcao } | null>(null);

  const editaveisPresentes = CAMPOS_EDITAVEIS.filter((c) => colunas.includes(c));

  const linhasOrdenadas = useMemo(() => {
    if (!ordenacao) return linhas;
    const { coluna, direcao } = ordenacao;
    const sinal = direcao === "asc" ? 1 : -1;
    return [...linhas].sort((a, b) => {
      const va = valorOrdenacao(a, coluna);
      const vb = valorOrdenacao(b, coluna);
      if (va < vb) return -1 * sinal;
      if (va > vb) return 1 * sinal;
      return 0;
    });
  }, [linhas, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(linhasOrdenadas.length / tamanhoPagina));

  // Mantém a página dentro do intervalo válido sem precisar de um efeito à parte.
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhasPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * tamanhoPagina;
    return linhasOrdenadas.slice(inicio, inicio + tamanhoPagina);
  }, [linhasOrdenadas, paginaAtual, tamanhoPagina]);

  function handleOrdenar(col: string) {
    setOrdenacao((atual) => {
      if (!atual || atual.coluna !== col) return { coluna: col, direcao: "asc" };
      if (atual.direcao === "asc") return { coluna: col, direcao: "desc" };
      return null;
    });
  }

  function handleChange(number: string, campo: string, valor: string) {
    setEdicoes((prev) => ({
      ...prev,
      [number]: { ...prev[number], [campo]: valor },
    }));
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    let qtd = 0;
    try {
      for (const [number, campos] of Object.entries(edicoes)) {
        const camposLimpos = Object.fromEntries(
          Object.entries(campos).filter(([, v]) => v !== undefined)
        );
        if (Object.keys(camposLimpos).length === 0) continue;
        const res = await fetch("/api/incidentes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number, campos: camposLimpos }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar.");
        qtd += 1;
      }
      setEdicoes({});
      setMensagem(qtd > 0 ? `${qtd} chamado(s) atualizado(s).` : "Nenhuma alteração detectada.");
      if (qtd > 0) onAtualizado?.();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  const temEdicoes = Object.values(edicoes).some((c) => Object.keys(c ?? {}).length > 0);

  return (
    <div className="w-full">
      <div className="overflow-x-auto border border-line rounded-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-ink">
            <tr>
              {colunas.map((col) => {
                const ativa = ordenacao?.coluna === col;
                return (
                  <th key={String(col)} className="text-left whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOrdenar(col as string)}
                      className={`w-full flex items-center gap-1 px-3 py-2 font-display text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors ${
                        ativa ? "text-copper" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {LABELS[col as string] ?? col}
                      <span className={`font-mono text-[10px] leading-none ${ativa ? "" : "opacity-40"}`}>
                        {ativa ? (ordenacao!.direcao === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {linhasPagina.map((linha, idx) => {
              const alerta = foraDoPadrao(linha);
              return (
              <tr
                key={linha.Number}
                title={alerta ? "Fora do padrão: Macro/Categoria/Subcategoria não reconhecidos na descrição." : undefined}
                className={`border-t hover:bg-copper-soft/30 ${
                  alerta ? "border-l-2 border-l-signal bg-signal-soft/30 border-line" : `border-line ${idx % 2 === 1 ? "bg-white/[0.02]" : ""}`
                }`}
              >
                {colunas.map((col) => {
                  const editavel = editaveisPresentes.includes(col as (typeof CAMPOS_EDITAVEIS)[number]);
                  const valorAtual =
                    edicoes[linha.Number]?.[col as string] ?? (linha[col] as string | number | null);
                  const numerica = COLUNAS_NUMERICAS.has(col as string);

                  if (col === "Empresa" && !editavel) {
                    return (
                      <td key={String(col)} className="px-3 py-1.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-sm px-1.5 py-0.5 font-mono text-xs font-semibold ${
                            CORES_DX[String(valorAtual)] ?? "bg-line text-fog"
                          }`}
                        >
                          {String(valorAtual ?? "—")}
                        </span>
                      </td>
                    );
                  }

                  if (col === "Number") {
                    return (
                      <td key={String(col)} className="px-3 py-1.5 whitespace-nowrap font-mono">
                        <span className="inline-flex items-center gap-1.5">
                          {alerta && (
                            <span
                              className="pilot-lamp inline-block h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: "var(--color-signal)", color: "var(--color-signal)" }}
                              aria-hidden
                            />
                          )}
                          {String(valorAtual ?? "—")}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={String(col)}
                      className={`px-3 py-1.5 whitespace-nowrap ${numerica ? "font-mono text-right" : ""}`}
                    >
                      {editavel ? (
                        <input
                          className="w-full min-w-[120px] rounded border border-transparent hover:border-line focus:border-copper px-1 py-0.5 outline-none bg-transparent"
                          value={valorAtual == null ? "" : String(valorAtual)}
                          onChange={(e) => handleChange(linha.Number, col as string, e.target.value)}
                        />
                      ) : (
                        formatarValor(col as string, linha[col])
                      )}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={linhas.length}
        tamanhoPagina={tamanhoPagina}
        onPaginaChange={setPagina}
        onTamanhoChange={(t) => {
          setTamanhoPagina(t);
          setPagina(1);
        }}
      />

      {editaveisPresentes.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={salvar}
            disabled={!temEdicoes || salvando}
            className="rounded-sm bg-copper text-white px-4 py-1.5 text-sm font-display font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-copper/90"
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          {mensagem && <span className="text-sm text-fog">{mensagem}</span>}
        </div>
      )}
    </div>
  );
}
