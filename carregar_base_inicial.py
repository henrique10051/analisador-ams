"""Script único: carrega a planilha base histórica (aba 'Extracao') no Supabase.

Uso:
    python carregar_base_inicial.py "Base apresentação AMS_10_04_26_new.xlsm"
"""
import sys

import pandas as pd

from processador_dados import (
    identificar_empresa,
    extrair_partes_description,
)
from calculadora_sla import CalculadoraSLA
from repositorio_incidentes import upsert_incidentes
from supabase_client import get_admin_client


def montar_dataframe_completo(caminho_xlsm: str) -> pd.DataFrame:
    df = pd.read_excel(caminho_xlsm, sheet_name="Extracao")

    df = df.rename(columns={
        "Short description/Categoria": "Short description",
    })

    df["Opened"] = pd.to_datetime(df["Opened"], errors="coerce")
    df["Resolved"] = pd.to_datetime(df["Resolved"], errors="coerce")
    df["Empresa"] = df["Service"].apply(identificar_empresa)

    partes = df["Short description"].apply(extrair_partes_description)
    df["Macro"] = [x[0] for x in partes]
    df["Categoria"] = [x[1] for x in partes]
    df["SubCategoria"] = [x[2] for x in partes]
    df["Descricao_Tratada"] = [x[3] for x in partes]

    calc = CalculadoraSLA()
    df["SLA - Dias (8 h)"] = df.apply(lambda r: calc.calcular_sla(r["Opened"], r["Resolved"]), axis=1)
    df["TMA - Dias corridos"] = (df["Resolved"] - df["Opened"]).dt.total_seconds() / 86400.0
    df.loc[df["TMA - Dias corridos"] < 0, "TMA - Dias corridos"] = 0

    return df


if __name__ == "__main__":
    caminho = sys.argv[1] if len(sys.argv) > 1 else "Base apresentação AMS_10_04_26_new.xlsm"
    print(f"Lendo {caminho} ...")
    df = montar_dataframe_completo(caminho)
    print(f"{len(df)} linhas lidas (antes de deduplicar Number).")

    qtd = upsert_incidentes(df, client=get_admin_client())
    print(f"{qtd} incidentes enviados ao Supabase (upsert por Number).")
