import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from abas.ui_helpers import tabela_editavel

def renderizar(df_resolvidos):
    st.subheader("Configuração da Aba de SLA")
    
    with st.expander("🛠️ Filtros da Tabela de SLA (Configurados por padrão)", expanded=False):
        c_f1, c_f2, c_f3 = st.columns(3)
        grupos = sorted(df_resolvidos['Assignment group'].dropna().unique().tolist())
        def_g = [g for g in grupos if 'FORCEBEAT' in str(g)]
        f_grupo = c_f1.multiselect("Grupo de Atribuição", grupos, default=def_g)
        
        servicos = sorted(df_resolvidos['ICT Service'].dropna().unique().tolist())
        def_s = [s for s in servicos if 'User Support' in str(s)]
        f_servico = c_f2.multiselect("Serviço ICT", servicos, default=def_s)
        
        estados = sorted(df_resolvidos['State'].dropna().unique().tolist())
        def_e = [e for e in estados if e in ['Closed', 'Resolved']]
        f_estado = c_f3.multiselect("Estado do Ticket", estados, default=def_e)

    df_sla = df_resolvidos[
        (df_resolvidos['Assignment group'].isin(f_grupo) if f_grupo else True) &
        (df_resolvidos['ICT Service'].isin(f_servico) if f_servico else True) &
        (df_resolvidos['State'].isin(f_estado) if f_estado else True)
    ]

    if not df_sla.empty:
        col1, col2, col3 = st.columns(3)
        col1.metric("Média SLA", f"{df_sla['SLA - Dias (8 h)'].mean():.2f} d")
        col2.metric("Total Tickets (SLA)", len(df_sla))
        col3.metric("Max SLA", f"{df_sla['SLA - Dias (8 h)'].max():.1f} d")

        df_m = df_sla.groupby(['Mes_Resolved_Sort', 'Mes_Display']).agg(
            Média=('SLA - Dias (8 h)', 'mean'), Máximo=('SLA - Dias (8 h)', 'max'), Mínimo=('SLA - Dias (8 h)', 'min')
        ).reset_index()

        fig_media = px.bar(df_m, x='Mes_Display', y='Média', text_auto='.2f', title="Média de SLA (Dias Úteis)")
        fig_media.update_layout(height=400)
        st.plotly_chart(fig_media, use_container_width=True)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df_m['Mes_Display'], y=df_m['Máximo'], mode='lines+markers+text', name='Max', text=[f"{v:.1f}" for v in df_m['Máximo']], textposition='top center', line=dict(color='#f97316', width=3)))
        fig.add_trace(go.Scatter(x=df_m['Mes_Display'], y=df_m['Mínimo'], mode='lines+markers+text', name='Min', text=[f"{v:.1f}" for v in df_m['Mínimo']], textposition='bottom center', line=dict(color='#10b981', width=3)))
        fig.update_layout(title="Extremos de SLA", height=400, legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
        st.plotly_chart(fig, use_container_width=True)

        st.divider()
        st.markdown("### 🔍 Detalhes do Mês (Top Infratores SLA)")
        mes_sel = st.selectbox("Analise os tickets de um mês específico:", reversed(df_m['Mes_Display'].tolist()))
        df_tab = df_sla[df_sla['Mes_Display'] == mes_sel].sort_values('SLA - Dias (8 h)', ascending=False)
        df_tab = df_tab[['Number', 'Empresa', 'Macro', 'Categoria', 'SubCategoria', 'Descricao_Tratada', 'SLA - Dias (8 h)', 'Short description', 'Assigned to']]
        tabela_editavel(df_tab, df_tab.columns.tolist(), key='editor_sla')
    else:
        st.warning("Selecione filtros válidos para visualizar o SLA.")