import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

from abas.ui_helpers import tabela_editavel

def renderizar(df_completo):
    st.markdown("### 📊 Volumetria de Incidentes (Geral)")
    
    df_vol = df_completo.copy()
    df_vol['Ano_Opened'] = df_vol['Opened'].dt.year.astype(str)
    df_vol['Mes_Opened_Sort'] = df_vol['Opened'].dt.to_period('M')
    
    def formatar_mes(dt):
        meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return f"{meses[dt.month - 1]}/{str(dt.year)[2:]}" if not pd.isna(dt) else "N/A"
    
    df_vol['Mes_Opened_Display'] = df_vol['Opened'].apply(formatar_mes)

    col_f1, col_f2, col_f3, col_f4 = st.columns(4)
    anos_disp = sorted(df_vol['Ano_Opened'].dropna().unique().tolist(), reverse=True)
    f_ano = col_f1.multiselect("Ano", anos_disp, default=anos_disp)
    
    meses_ordenados = df_vol.sort_values('Mes_Opened_Sort')['Mes_Opened_Display'].unique().tolist()
    f_mes = col_f2.multiselect("Mês", meses_ordenados, default=meses_ordenados)
    
    empresas_disp = sorted(df_vol['Empresa'].dropna().unique().tolist())
    f_empresa = col_f3.multiselect("Distribuidora", empresas_disp, default=['CE', 'RJ', 'SP'])
    
    macros_disp = sorted(df_vol['Macro'].dropna().unique().tolist())
    f_macro = col_f4.multiselect("Macro / Service Request", macros_disp)

    df_vol_filt = df_vol[
        (df_vol['Ano_Opened'].isin(f_ano) if f_ano else True) &
        (df_vol['Mes_Opened_Display'].isin(f_mes) if f_mes else True) &
        (df_vol['Empresa'].isin(f_empresa) if f_empresa else True) &
        (df_vol['Macro'].isin(f_macro) if f_macro else True)
    ]

    if not df_vol_filt.empty:
        df_total = df_vol_filt.groupby(['Mes_Opened_Sort', 'Mes_Opened_Display']).size().reset_index(name='Total')
        df_total = df_total.sort_values('Mes_Opened_Sort').tail(12)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df_total['Mes_Opened_Display'], y=df_total['Total'], mode='lines+markers+text',
                                 text=df_total['Total'], textposition='top center', line=dict(color='#2563eb', width=3)))
        fig.update_layout(title="Quantidade Total de Incidentes", height=400)
        st.plotly_chart(fig, use_container_width=True)

        df_dx = df_vol_filt[df_vol_filt['Mes_Opened_Sort'].isin(df_total['Mes_Opened_Sort'])]
        df_dx_grp = df_dx.groupby(['Mes_Opened_Display', 'Empresa']).size().reset_index(name='Qtd')
        fig_dx = px.bar(df_dx_grp, x='Mes_Opened_Display', y='Qtd', color='Empresa', barmode='group',
                        title="Incidentes por DX", color_discrete_map={'CE': '#3b82f6', 'RJ': '#10b981', 'SP': '#f59e0b'}, text_auto=True)
        fig_dx.update_layout(height=400)
        st.plotly_chart(fig_dx, use_container_width=True)

        st.divider()
        st.markdown("### 📋 Detalhamento Analítico")
        st.caption("Edite Macro, Categoria, Subcategoria ou Descrição diretamente na tabela e clique em salvar.")

        df_tab = df_vol_filt[['Number', 'Empresa', 'Macro', 'Categoria', 'SubCategoria', 'Descricao_Tratada', 'Opened', 'State']]
        df_tab = df_tab.sort_values('Opened', ascending=False)
        tabela_editavel(df_tab, df_tab.columns.tolist(), key='editor_geral')