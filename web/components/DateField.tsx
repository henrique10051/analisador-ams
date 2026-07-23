interface Props {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}

export default function DateField({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-fog mb-1">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-sm px-2.5 py-1.5 text-sm bg-paper-raised text-graphite font-mono focus:border-copper outline-none"
      />
    </div>
  );
}
