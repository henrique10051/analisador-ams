"use client";

export type PeriodoPreset = "3" | "6" | "12" | "24" | "tudo";

const OPCOES: { value: PeriodoPreset; label: string }[] = [
  { value: "3", label: "3M" },
  { value: "6", label: "6M" },
  { value: "12", label: "12M" },
  { value: "24", label: "24M" },
  { value: "tudo", label: "Tudo" },
];

interface Props {
  value: PeriodoPreset;
  onChange: (valor: PeriodoPreset) => void;
  label?: string;
}

export default function PeriodSelect({ value, onChange, label = "Período" }: Props) {
  return (
    <div>
      <label className="block font-display text-[11px] font-semibold tracking-[0.1em] uppercase text-fog mb-1">
        {label}
      </label>
      <div className="inline-flex rounded-sm border border-line bg-ink p-0.5 gap-0.5">
        {OPCOES.map((op) => {
          const ativo = value === op.value;
          return (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange(op.value)}
              className={`toggle-throw px-2.5 py-1 text-[11px] font-mono font-medium whitespace-nowrap rounded-[2px] transition-all ${
                ativo
                  ? "bg-copper text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
