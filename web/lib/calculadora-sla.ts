const FERIADOS_STRINGS = [
  "2023-01-01", "2023-02-20", "2023-02-21", "2023-04-07", "2023-04-21",
  "2023-05-01", "2023-06-08", "2023-09-07", "2023-10-12", "2023-11-02",
  "2023-11-15", "2023-11-20", "2023-12-25",
  "2024-01-01", "2024-02-12", "2024-02-13", "2024-03-29", "2024-04-21",
  "2024-05-01", "2024-05-30", "2024-09-07", "2024-10-12", "2024-11-02",
  "2024-11-15", "2024-11-20", "2024-12-25",
  "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
  "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
  "2025-11-15", "2025-11-20", "2025-12-25",
  "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03", "2026-04-21",
  "2026-05-01", "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02",
  "2026-11-15", "2026-11-20", "2026-12-25",
];

function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Equivalente a numpy.busday_count(d1, d2, holidays): dias úteis em [d1, d2). */
function busdayCount(d1: Date, d2: Date, holidays: Set<string>): number {
  let count = 0;
  let cur = dateOnlyUTC(d1);
  const end = dateOnlyUTC(d2);
  while (cur.getTime() < end.getTime()) {
    const dow = cur.getUTCDay(); // 0=Sun, 6=Sat
    const iso = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) {
      count += 1;
    }
    cur = addDaysUTC(cur, 1);
  }
  return count;
}

export class CalculadoraSLA {
  private horaInicio = 9;
  private horaFim = 18;
  private feriados: Set<string>;

  constructor(diasNaoUteisExtra?: string[]) {
    this.feriados = new Set(FERIADOS_STRINGS);
    for (const d of diasNaoUteisExtra ?? []) {
      this.feriados.add(d.slice(0, 10));
    }
  }

  private horaDecimal(d: Date): number {
    return d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  }

  private calcularHorasAbertura(d: Date): number {
    const hour = d.getUTCHours();
    if (hour >= 18) return 0;
    if (hour < 9) return 8;
    const h = this.horaDecimal(d);
    if (h <= 12) return 12 - h + 5;
    if (h >= 13) return 18 - h;
    return 5;
  }

  private calcularHorasFechamento(d: Date): number {
    const hour = d.getUTCHours();
    if (hour < 9) return 0;
    if (hour >= 18) return 8;
    const h = this.horaDecimal(d);
    if (h <= 12) return h - 9;
    if (h >= 13) return 3 + (h - 13);
    return 3;
  }

  /** aberto/resolvido: Date em horário "local" do chamado, tratado como UTC (sem fuso). */
  calcularSla(aberto: Date | null, resolvido: Date | null): number | null {
    if (!aberto || !resolvido || isNaN(aberto.getTime()) || isNaN(resolvido.getTime())) return null;
    if (resolvido.getTime() < aberto.getTime()) return null;

    const d1 = dateOnlyUTC(aberto);
    const d2 = dateOnlyUTC(resolvido);

    try {
      if (d1.getTime() === d2.getTime()) {
        const hi = Math.max(9.0, this.horaDecimal(aberto));
        const hf = Math.min(18.0, this.horaDecimal(resolvido));
        const desc = hi <= 12 && hf >= 13 ? 1 : 0;
        return Math.max(0, hf - hi - desc) / 8.0;
      }
      const diasUteis = busdayCount(d1, d2, this.feriados);
      const h1 = this.calcularHorasAbertura(aberto);
      const h2 = this.calcularHorasFechamento(resolvido);
      return (h1 + Math.max(diasUteis - 1, 0) * 8 + h2) / 8.0;
    } catch {
      return null;
    }
  }
}
