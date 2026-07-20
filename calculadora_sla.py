import pandas as pd
import numpy as np

class CalculadoraSLA:
    def __init__(self, dias_nao_uteis_extra=None):
        self.hora_inicio = 9
        self.hora_fim = 18
        feriados_strings = [
            '2023-01-01', '2023-02-20', '2023-02-21', '2023-04-07', '2023-04-21', 
            '2023-05-01', '2023-06-08', '2023-09-07', '2023-10-12', '2023-11-02', 
            '2023-11-15', '2023-11-20', '2023-12-25',
            '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-29', '2024-04-21', 
            '2024-05-01', '2024-05-30', '2024-09-07', '2024-10-12', '2024-11-02', 
            '2024-11-15', '2024-11-20', '2024-12-25',
            '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-18', '2025-04-21',
            '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-11-02',
            '2025-11-15', '2025-11-20', '2025-12-25',
            '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21',
            '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
            '2026-11-15', '2026-11-20', '2026-12-25'
        ]
        feriados = [np.datetime64(f) for f in feriados_strings]
        if dias_nao_uteis_extra:
            feriados += [np.datetime64(d) for d in dias_nao_uteis_extra]
        # remove duplicados mantendo o tipo np.datetime64
        self.feriados = list({str(f): f for f in feriados}.values())
    
    def _calcular_horas_abertura(self, hora_dt):
        if pd.isna(hora_dt) or not hasattr(hora_dt, 'hour'): return 0
        if hora_dt.hour >= 18: return 0
        if hora_dt.hour < 9: return 8
        h_decimal = hora_dt.hour + hora_dt.minute/60.0 + hora_dt.second/3600.0
        if h_decimal <= 12: return (12 - h_decimal) + 5 
        elif h_decimal >= 13: return 18 - h_decimal
        else: return 5

    def _calcular_horas_fechamento(self, hora_dt):
        if pd.isna(hora_dt) or not hasattr(hora_dt, 'hour'): return 0
        if hora_dt.hour < 9: return 0
        if hora_dt.hour >= 18: return 8
        h_decimal = hora_dt.hour + hora_dt.minute/60.0 + hora_dt.second/3600.0
        if h_decimal <= 12: return h_decimal - 9
        elif h_decimal >= 13: return 3 + (h_decimal - 13) 
        else: return 3

    def calcular_sla(self, aberto, resolvido):
        if pd.isna(aberto) or pd.isna(resolvido) or not hasattr(aberto, 'date'): return None
        if resolvido < aberto: return None
        try:
            d1, d2 = np.datetime64(aberto.date()), np.datetime64(resolvido.date())
            dias_uteis = np.busday_count(d1, d2, holidays=self.feriados)
            if d1 == d2:
                hi = max(9.0, aberto.hour + aberto.minute/60.0 + aberto.second/3600.0)
                hf = min(18.0, resolvido.hour + resolvido.minute/60.0 + resolvido.second/3600.0)
                desc = 1 if (hi <= 12 and hf >= 13) else 0
                return max(0, hf - hi - desc) / 8.0
            else:
                h1, h2 = self._calcular_horas_abertura(aberto), self._calcular_horas_fechamento(resolvido)
                return (h1 + max((dias_uteis - 1), 0) * 8 + h2) / 8.0
        except: return None