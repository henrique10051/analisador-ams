import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

def renderizar(df_resolvidos):
    st.subheader("Configuração da Aba de TMA")
    
    with st.expander("🛠️ Filtros da Tabela de TMA (Configurados por padrão)", expanded=False):
        c_ft1, c_ft2, c_ft3 = st.columns(3)
        grupos_tma = sorted(df_resolvidos['Assignment group'].dropna().unique().tolist())
        def_g_tma = [g for g in grupos_tma if 'FORCEBEAT' in str(g)]
        f_grupo_tma = c_ft1.multiselect("Grupo de Atribuição (TMA)", grupos_tma, default=def_g_tma, key="g_tma")
        
        servicos_tma = sorted(df_resolvidos['ICT Service'].dropna().unique().tolist())
        def_s_tma = [s for s in servicos_tma if 'User Support' in str(s)]
        f_servico_tma = c_ft2.multiselect("Serviço ICT (TMA)", servicos_tma, default=def_s_tma, key="s_tma")
        
        estados_tma = sorted(df_resolvidos['State'].dropna().unique().tolist())
        def_e_tma = [e for e in estados_tma if e in ['Closed', 'Resolved']]
        f_estado_tma = c_ft3.multiselect("Estado do Ticket (TMA)", estados_tma, default=def_e_tma, key="e_tma")

    df_tma = df_resolvidos[
        (df_resolvidos['Assignment group'].isin(f_grupo_tma) if f_grupo_tma else True) &
        (df_resolvidos['ICT Service'].isin(f_servico_tma) if f_servico_tma else True) &
        (df_resolvidos['State'].isin(f_estado_tma) if f_estado_tma else True)
    ]

    if not df_tma.empty:
        col1, col2, col3 = st.columns(3)
        col1.metric("Média TMA (Geral)", f"{df_tma['TMA - Dias corridos'].mean():.2f} dias")
        col2.metric("Total Tickets (TMA)", len(df_tma))
        col3.metric("Max TMA Registrado", f"{df_tma['TMA - Dias corridos'].max():.1f} dias")

        df_tma_mes = df_tma.groupby(['Mes_Resolved_Sort', 'Mes_Display']).agg(
            Média=('TMA - Dias corridos', 'mean'), Máximo=('TMA - Dias corridos', 'max'), Mínimo=('TMA - Dias corridos', 'min')
        ).reset_index()

        g1, g2 = st.columns(2)
        with g1:
            fig_tma_media = px.bar(df_tma_mes, x='Mes_Display', y='Média', text_auto='.2f', title="Média de TMA (Dias Corridos)", color_discrete_sequence=['#8b5cf6'])
            fig_tma_media.update_traces(textposition='outside')
            st.plotly_chart(fig_tma_media, use_container_width=True)
            
        with g2:
            fig_tma_maxmin = go.Figure()
            fig_tma_maxmin.add_trace(go.Scatter(x=df_tma_mes['Mes_Display'], y=df_tma_mes['Máximo'], mode='lines+markers+text', name='Max', line=dict(color='#f97316', width=3), text=[f"{v:.1f}" for v in df_tma_mes['Máximo']], textposition='top center'))
            fig_tma_maxmin.add_trace(go.Scatter(x=df_tma_mes['Mes_Display'], y=df_tma_mes['Mínimo'], mode='lines+markers+text', name='Min', line=dict(color='#10b981', width=3), text=[f"{v:.1f}" for v in df_tma_mes['Mínimo']], textposition='bottom center'))
            fig_tma_maxmin.update_layout(title="Extremos de TMA", legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
            st.plotly_chart(fig_tma_maxmin, use_container_width=True)

        st.divider()
        st.markdown("### 🔍 Detalhes do Mês (Top Infratores TMA)")
        mes_sel_tma = st.selectbox("Selecione um mês para ver os tickets que mais demoraram:", reversed(df_tma_mes['Mes_Display'].tolist()), key="select_mes_tma")
        df_tma_detalhe = df_tma[df_tma['Mes_Display'] == mes_sel_tma].sort_values('TMA - Dias corridos', ascending=False)
        st.dataframe(df_tma_detalhe[['Number', 'Empresa', 'Macro', 'TMA - Dias corridos', 'SLA - Dias (8 h)', 'Short description', 'Assigned to']], use_container_width=True, hide_index=True)
    else:
        st.warning("Selecione filtros válidos para visualizar o TMA.")