import streamlit as st
import pandas as pd

from repositorio_incidentes import (
    carregar_dias_nao_uteis,
    adicionar_dia_nao_util,
    remover_dia_nao_util,
)


def renderizar():
    st.markdown("### 🗓️ Dias em que o AMS não trabalhou")
    st.caption(
        "Cadastre aqui pontes, paralisações ou outros dias fora do calendário "
        "oficial de feriados. Eles passam a ser descontados do cálculo de SLA "
        "assim que a base for reprocessada."
    )

    with st.form("form_dia_nao_util", clear_on_submit=True):
        col1, col2, col3 = st.columns([2, 3, 1])
        data = col1.date_input("Data")
        motivo = col2.text_input("Motivo", placeholder="Ex: Ponte de feriado - Corpus Christi")
        enviar = col3.form_submit_button("Adicionar", use_container_width=True)

        if enviar:
            adicionar_dia_nao_util(data.isoformat(), motivo)
            st.success(f"Dia {data.strftime('%d/%m/%Y')} adicionado.")
            st.rerun()

    st.divider()

    df = carregar_dias_nao_uteis()
    if df.empty:
        st.info("Nenhum dia não útil extra cadastrado ainda.")
        return

    df_exibir = df.copy()
    df_exibir["data"] = pd.to_datetime(df_exibir["data"]).dt.strftime("%d/%m/%Y")

    for _, row in df_exibir.sort_values("data").iterrows():
        col1, col2, col3 = st.columns([2, 4, 1])
        col1.write(row["data"])
        col2.write(row.get("motivo") or "—")
        if col3.button("Remover", key=f"del_{row['id']}"):
            remover_dia_nao_util(int(row["id"]))
            st.rerun()
