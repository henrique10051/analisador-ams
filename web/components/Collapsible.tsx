"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function Collapsible({ label, children, defaultOpen = false }: Props) {
  const [aberto, setAberto] = useState(defaultOpen);

  return (
    <div className="border border-line rounded-sm bg-paper-raised">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="font-display text-xs font-semibold tracking-[0.06em] uppercase text-fog">
          {label}
        </span>
        <span className={`font-mono text-xs text-fog transition-transform ${aberto ? "rotate-180" : ""}`}>▾</span>
      </button>
      {aberto && <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>}
    </div>
  );
}
