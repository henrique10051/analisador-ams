import streamlit as st

from repositorio_incidentes import atualizar_campos_incidente

CAMPOS_EDITAVEIS_PADRAO = ['Macro', 'Categoria', 'SubCategoria', 'Descricao_Tratada']

LABELS_PADRAO = {
    'Number': 'Chamado',
    'Empresa': 'DX',
    'Macro': 'Macro',
    'Categoria': 'Categoria',
    'SubCategoria': 'Subcategoria',
    'Descricao_Tratada': 'Descrição',
    'Opened': 'Abertura',
    'Resolved': 'Resolução',
    'State': 'Status',
    'SLA - Dias (8 h)': 'SLA (dias)',
    'TMA - Dias corridos': 'TMA (dias)',
    'Short description': 'Descrição original',
    'Assigned to': 'Responsável',
    'Close notes': 'Notas de fechamento',
    'Close code': 'Motivo de Fechamento',
}


def tabela_editavel(df, colunas, key, campos_editaveis=None, labels=None):
    """Renderiza uma tabela com Macro/Categoria/Subcategoria/Descrição (quando
    presentes) editáveis, com botão para persistir as mudanças no Supabase."""
    campos_editaveis = campos_editaveis if campos_editaveis is not None else CAMPOS_EDITAVEIS_PADRAO
    labels_finais = {**LABELS_PADRAO, **(labels or {})}

    df_tab = df[colunas].copy().reset_index(drop=True)
    editaveis_presentes = [c for c in campos_editaveis if c in colunas]
    desabilitadas = [c for c in colunas if c not in editaveis_presentes]

    column_config = {
        col: st.column_config.Column(label=labels_finais.get(col, col))
        for col in colunas
    }

    df_editado = st.data_editor(
        df_tab,
        use_container_width=True,
        hide_index=True,
        disabled=desabilitadas,
        column_config=column_config,
        key=key,
    )

    if editaveis_presentes and 'Number' in colunas:
        if st.button("💾 Salvar alterações", key=f"{key}_salvar"):
            qtd = 0
            for idx in df_tab.index:
                campos = {
                    col: df_editado.loc[idx, col]
                    for col in editaveis_presentes
                    if df_editado.loc[idx, col] != df_tab.loc[idx, col]
                }
                if campos:
                    atualizar_campos_incidente(df_tab.loc[idx, 'Number'], campos)
                    qtd += 1
            if qtd:
                st.success(f"{qtd} chamado(s) atualizado(s). Recarregue a página para refletir nas outras abas.")
                st.cache_data.clear()
            else:
                st.info("Nenhuma alteração detectada.")
