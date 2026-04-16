import streamlit as st
import pandas as pd
import plotly.express as px

def renderizar(df_resolvidos):
    st.subheader("Configuração da Aba de Categorias")
    
    if not df_resolvidos.empty:
        data_max = df_resolvidos['Opened'].max().date()
        data_ini_def = data_max - pd.Timedelta(days=30)
    else:
        data_max = pd.Timestamp.today().date()
        data_ini_def = data_max - pd.Timedelta(days=30)

    st.markdown("**Período de Abertura:**")
    col_d1, col_d2, _ = st.columns([1, 1, 2])
    d_ini = col_d1.date_input("Início", data_ini_def, key="cat_ini")
    d_fim = col_d2.date_input("Fim", data_max, key="cat_fim")

    with st.expander("🛠️ Filtros Técnicos"):
        c1, c2, c3 = st.columns(3)
        grupos = sorted(df_resolvidos['Assignment group'].unique())
        f_grupo = c1.multiselect("Grupo", grupos, default=[g for g in grupos if 'FORCEBEAT' in g], key="g_cat_tech")
        
        estados = sorted(df_resolvidos['State'].unique())
        f_estado = c2.multiselect("Estado", estados, default=[e for e in estados if e in ['Closed', 'Resolved']], key="e_cat_tech")

        macros = sorted(df_resolvidos['Macro'].unique())
        f_macro = c3.multiselect("Macro", macros, default=[m for m in macros if m != 'N/A'], key="m_cat_tech")

    inicio_dt = pd.to_datetime(d_ini)
    fim_dt = pd.to_datetime(d_fim) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)

    df_f = df_resolvidos[
        (df_resolvidos['Opened'] >= inicio_dt) & (df_resolvidos['Opened'] <= fim_dt) &
        (df_resolvidos['Assignment group'].isin(f_grupo)) & 
        (df_resolvidos['State'].isin(f_estado)) &
        (df_resolvidos['Macro'].isin(f_macro))
    ]

    if not df_f.empty:
        # Agrupamento por Categoria e DX
        df_plot = df_f.groupby(['Categoria', 'Empresa']).size().reset_index(name='Total')
        
        # Ordenar categorias pelo total geral (soma de todas as DXs) para o gráfico ficar bonito
        ordem = df_f['Categoria'].value_counts().index.tolist()

        color_map = {'CE': '#3b82f6', 'RJ': '#10b981', 'SP': '#f59e0b', 'Outros': '#94a3b8'}
        
        fig = px.bar(
            df_plot, x='Total', y='Categoria', orientation='h', 
            color='Empresa', color_discrete_map=color_map,
            title="Volume de Incidentes por Categoria e DX",
            category_orders={"Categoria": ordem[::-1]}, # Maior no topo
            text_auto=True
        )
        
        altura_dinamica = max(400, df_f['Categoria'].nunique() * 35)
        fig.update_layout(height=altura_dinamica, yaxis_title="", barmode='stack')
        st.plotly_chart(fig, use_container_width=True)

        st.divider()
        st.markdown("### 🔍 Detalhes por Categoria")
        cat_sel = st.selectbox("Selecione a Categoria:", ordem, key="select_cat_final")
        
        df_det = df_f[df_f['Categoria'] == cat_sel].sort_values('Opened', ascending=False)
        st.dataframe(df_det[['Number', 'Empresa', 'SubCategoria', 'Descricao_Tratada', 'Opened', 'TMA - Dias corridos', 'SLA - Dias (8 h)']], use_container_width=True, hide_index=True)
    else:
        st.warning("Nenhum dado encontrado para os filtros selecionados.")