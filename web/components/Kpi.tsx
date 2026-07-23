interface Props {
  label: string;
  value: string;
  accent?: string;
}

export default function Kpi({ label, value, accent }: Props) {
  return (
    <div className="screwed gauge-mount bg-paper-raised border border-line rounded-sm p-4 relative overflow-hidden">
      <span className="screw-bl" />
      <span className="screw-br" />
      <div className="flex items-start justify-between mb-2">
        <div className="font-display text-[11px] font-semibold tracking-[0.1em] uppercase text-fog">
          {label}
        </div>
        <span
          className="pilot-lamp lamp-flicker mt-0.5 inline-block h-2 w-2 rounded-full shrink-0"
          style={{ color: accent ?? "var(--color-fog)", backgroundColor: accent ?? "var(--color-fog)" }}
          aria-hidden
        />
      </div>
      <div
        className="font-mono text-[28px] leading-none font-semibold tabular-nums text-graphite"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
