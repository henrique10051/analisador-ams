import math
import pandas as pd

from supabase_client import get_client

TABELA_INCIDENTES = "incidentes"
TABELA_DIAS_NAO_UTEIS = "dias_nao_uteis"

_MAPA_COLUNAS = {
    "Number": "number",
    "Service": "service",
    "Opened": "opened",
    "Resolved": "resolved",
    "Short description": "short_description",
    "State": "state",
    "Priority": "priority",
    "Assignment group": "assignment_group",
    "ICT Service": "ict_service",
    "Assigned to": "assigned_to",
    "Close code": "close_code",
    "Close notes": "close_notes",
    "Reopen count": "reopen_count",
    "Empresa": "empresa",
    "Macro": "macro",
    "Categoria": "categoria",
    "SubCategoria": "subcategoria",
    "Descricao_Tratada": "descricao_tratada",
    "SLA - Dias (8 h)": "sla_dias",
    "TMA - Dias corridos": "tma_dias",
}

_COLUNAS_INVERTIDAS = {v: k for k, v in _MAPA_COLUNAS.items()}


def _limpar_valor(v):
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, pd.Timestamp):
        if pd.isna(v):
            return None
        return v.isoformat()
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    return v


def dataframe_para_registros(df: pd.DataFrame) -> list[dict]:
    """Converte o dataframe já processado (df_completo) em registros no
    formato da tabela `incidentes`, removendo duplicados de Number
    (mantendo o último, que costuma ser o dado mais atualizado)."""
    df = df.drop_duplicates(subset=["Number"], keep="last")

    registros = []
    for _, row in df.iterrows():
        registro = {}
        for col_origem, col_destino in _MAPA_COLUNAS.items():
            registro[col_destino] = _limpar_valor(row.get(col_origem)) if col_origem in df.columns else None
        registros.append(registro)
    return registros


def upsert_incidentes(df: pd.DataFrame, tamanho_lote: int = 500, client=None) -> int:
    """Insere incidentes novos e atualiza os existentes (upsert por `number`).
    Retorna a quantidade de registros enviados."""
    registros = dataframe_para_registros(df)
    if not registros:
        return 0

    client = client or get_client()
    total = 0
    for i in range(0, len(registros), tamanho_lote):
        lote = registros[i:i + tamanho_lote]
        client.table(TABELA_INCIDENTES).upsert(lote, on_conflict="number").execute()
        total += len(lote)
    return total


def carregar_incidentes() -> pd.DataFrame:
    """Carrega todos os incidentes do Supabase, já convertidos para o
    formato de colunas usado pelo restante do app (df_completo)."""
    client = get_client()
    registros = []
    pagina = 1000
    inicio = 0
    while True:
        resp = (
            client.table(TABELA_INCIDENTES)
            .select("*")
            .range(inicio, inicio + pagina - 1)
            .execute()
        )
        dados = resp.data
        registros.extend(dados)
        if len(dados) < pagina:
            break
        inicio += pagina

    if not registros:
        colunas = list(_MAPA_COLUNAS.keys())
        return pd.DataFrame(columns=colunas)

    df = pd.DataFrame(registros)
    df = df.rename(columns=_COLUNAS_INVERTIDAS)
    df["Opened"] = pd.to_datetime(df["Opened"], errors="coerce", utc=True).dt.tz_localize(None)
    df["Resolved"] = pd.to_datetime(df["Resolved"], errors="coerce", utc=True).dt.tz_localize(None)
    return df


_CAMPOS_EDITAVEIS = {"Macro", "Categoria", "SubCategoria", "Descricao_Tratada"}


def atualizar_campos_incidente(number: str, campos: dict):
    """Atualiza campos pontuais (ex: Macro/Categoria/SubCategoria/Descricao_Tratada)
    de um incidente já existente, identificado pelo Number."""
    payload = {
        _MAPA_COLUNAS[campo]: _limpar_valor(valor)
        for campo, valor in campos.items()
        if campo in _CAMPOS_EDITAVEIS
    }
    if not payload:
        return
    client = get_client()
    client.table(TABELA_INCIDENTES).update(payload).eq("number", number).execute()


def carregar_dias_nao_uteis() -> pd.DataFrame:
    client = get_client()
    resp = client.table(TABELA_DIAS_NAO_UTEIS).select("*").order("data").execute()
    return pd.DataFrame(resp.data)


def adicionar_dia_nao_util(data_iso: str, motivo: str = ""):
    client = get_client()
    client.table(TABELA_DIAS_NAO_UTEIS).upsert(
        {"data": data_iso, "motivo": motivo}, on_conflict="data"
    ).execute()


def remover_dia_nao_util(dia_id: int):
    client = get_client()
    client.table(TABELA_DIAS_NAO_UTEIS).delete().eq("id", dia_id).execute()
