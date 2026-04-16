import streamlit as st
import pandas as pd
import plotly.express as px

def renderizar(df_resolvidos):
    st.subheader("Configuração da Aba de Subcategorias")
    
    data_max = df_resolvidos['Opened'].max().date()
    data_ini_def = data_max - pd.Timedelta(days=30)

    col_d1, col_d2, _ = st.columns([1, 1, 2])
    d_ini = col_d1.date_input("Início", data_ini_def, key="sub_ini_final")
    d_fim = col_d2.date_input("Fim", data_max, key="sub_fim_final")

    with st.expander("🛠️ Filtros Técnicos"):
        c1, c2 = st.columns(2)
        grupos = sorted(df_resolvidos['Assignment group'].unique())
        f_grupo = c1.multiselect("Grupo", grupos, default=[g for g in grupos if 'FORCEBEAT' in g], key="sub_g_tech")
        estados = sorted(df_resolvidos['State'].unique())
        f_estado = c2.multiselect("Estado", estados, default=[e for e in estados if e in ['Closed', 'Resolved']], key="sub_e_tech")

    # Filtro de Categoria
    categorias_disp = sorted(df_resolvidos['Categoria'].unique())
    f_categoria = st.multiselect("Filtrar Subcategorias por Categoria:", categorias_disp, default=categorias_disp)

    inicio_dt = pd.to_datetime(d_ini)
    fim_dt = pd.to_datetime(d_fim) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)

    df_f = df_resolvidos[
        (df_resolvidos['Opened'] >= inicio_dt) & (df_resolvidos['Opened'] <= fim_dt) &
        (df_resolvidos['Assignment group'].isin(f_grupo)) &
        (df_resolvidos['State'].isin(f_estado)) &
        (df_resolvidos['Categoria'].isin(f_categoria))
    ]

    if not df_f.empty:
        # Agrupamento por Subcategoria e DX
        df_plot = df_f.groupby(['SubCategoria', 'Empresa']).size().reset_index(name='Total')
        
        # Ordem das subcategorias (mais volumosa no topo)
        ordem_sub = df_f['SubCategoria'].value_counts().index.tolist()

        color_map = {'CE': '#3b82f6', 'RJ': '#10b981', 'SP': '#f59e0b', 'Outros': '#94a3b8'}

        # Gráfico igual ao do print (Barras Horizontais Empilhadas por DX)
        fig = px.bar(
            df_plot, x='Total', y='SubCategoria', orientation='h', 
            color='Empresa', color_discrete_map=color_map,
            title="Volume de Incidentes por Subcategoria e DX",
            category_orders={"SubCategoria": ordem_sub[::-1]},
            text_auto=True
        )
        
        altura_dinamica = max(400, df_f['SubCategoria'].nunique() * 30)
        fig.update_layout(height=altura_dinamica, yaxis_title="", barmode='stack')
        st.plotly_chart(fig, use_container_width=True)

        st.divider()
        st.markdown("### 🔍 Detalhes por Subcategoria")
        sub_sel = st.selectbox("Selecione a Subcategoria para ver os detalhes:", ordem_sub, key="select_sub_final")
        
        df_det = df_f[df_f['SubCategoria'] == sub_sel].sort_values('Opened', ascending=False)
        st.dataframe(
            df_det[['Number', 'Empresa', 'Categoria', 'Descricao_Tratada', 'Opened', 'TMA - Dias corridos', 'SLA - Dias (8 h)', 'Assigned to']], 
            use_container_width=True, hide_index=True
        )
    else:
        st.warning("Nenhum dado encontrado para os filtros selecionados.")