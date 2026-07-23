"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { toBlob, toJpeg } from "html-to-image";

interface Props {
  targetRef: RefObject<HTMLElement | null>;
  filename: string;
}

type Status = "idle" | "copiando" | "copiado" | "baixando" | "erro";

// Export always renders on a forced white background (see backgroundColor
// below), regardless of the app's active theme. html-to-image bakes each
// element's resolved (getComputedStyle) color into the clone at capture
// time — in dark mode that resolves --color-graphite etc. to their
// near-white, dark-canvas values, which vanish on the white export. So we
// flip the document to the light theme for the duration of the capture,
// which makes every var() resolve to light-theme colors before cloning.
async function comTemaClaro<T>(fn: () => Promise<T>): Promise<T> {
  const root = document.documentElement;
  const temaOriginal = root.getAttribute("data-theme");
  root.setAttribute("data-theme", "light");
  try {
    return await fn();
  } finally {
    if (temaOriginal === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", temaOriginal);
  }
}

export default function ChartToolbar({ targetRef, filename }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  function resetDepoisDe(ms: number) {
    setTimeout(() => setStatus("idle"), ms);
  }

  async function copiar() {
    if (!targetRef.current) return;
    setStatus("copiando");
    try {
      const blob = await comTemaClaro(() =>
        toBlob(targetRef.current!, { backgroundColor: "#ffffff", pixelRatio: 2 })
      );
      if (!blob) throw new Error("Falha ao gerar imagem.");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus("copiado");
      resetDepoisDe(1600);
    } catch {
      setStatus("erro");
      resetDepoisDe(2000);
    }
  }

  async function baixar() {
    if (!targetRef.current) return;
    setStatus("baixando");
    try {
      const dataUrl = await comTemaClaro(() =>
        toJpeg(targetRef.current!, { backgroundColor: "#ffffff", pixelRatio: 2, quality: 0.95 })
      );
      const link = document.createElement("a");
      link.download = `${filename}.jpg`;
      link.href = dataUrl;
      link.click();
      setStatus("idle");
    } catch {
      setStatus("erro");
      resetDepoisDe(2000);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={copiar}
        title="Copiar gráfico para a área de transferência"
        className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1 text-[11px] font-mono text-fog hover:border-copper hover:text-copper transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="12" height="12" rx="1.5" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
        </svg>
        {status === "copiando" ? "Copiando…" : status === "copiado" ? "Copiado!" : "Copiar"}
      </button>
      <button
        type="button"
        onClick={baixar}
        title="Baixar gráfico em JPEG"
        className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1 text-[11px] font-mono text-fog hover:border-copper hover:text-copper transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
        {status === "baixando" ? "Baixando…" : "JPEG"}
      </button>
      {status === "erro" && <span className="text-[11px] font-mono text-signal">Falhou</span>}
    </div>
  );
}
