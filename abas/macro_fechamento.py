import streamlit as st
import pandas as pd

def renderizar(df_resolvidos):
    st.subheader("🎯 Matriz de Macro Fechamento")
    
    # 1. Filtro de Data (Últimos 30 dias por padrão)
    if not df_resolvidos.empty:
        # Usamos a data de Resolução aqui, pois o fechamento é o foco
        data_maxima = df_resolvidos['Resolved'].max().date()
        data_minima_padrao = data_maxima - pd.Timedelta(days=30)
    else:
        data_maxima = pd.Timestamp.today().date()
        data_minima_padrao = data_maxima - pd.Timedelta(days=30)

    st.markdown("**Período de Fechamento:**")
    col_data1, col_data2, col_vazio = st.columns([1, 1, 2])
    data_inicio = col_data1.date_input("Início", data_minima_padrao, key="macro_ini")
    data_fim = col_data2.date_input("Fim", data_maxima, key="macro_fim")

    # 2. Filtros de Referência (Fila)
    with st.expander("🛠️ Filtros de Grupo", expanded=False):
        grupos = sorted(df_resolvidos['Assignment group'].unique())
        f_grupo = st.multiselect("Grupo", grupos, default=[g for g in grupos if 'FORCEBEAT' in g], key="macro_g")

    # Aplicação da filtragem
    inicio_dt = pd.to_datetime(data_inicio)
    fim_dt = pd.to_datetime(data_fim) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)

    df_f = df_resolvidos[
        (df_resolvidos['Resolved'] >= inicio_dt) & 
        (df_resolvidos['Resolved'] <= fim_dt) &
        (df_resolvidos['Assignment group'].isin(f_grupo))
    ]

    if not df_f.empty:
        # 3. Criar a Matriz (Pivot Table)
        # Linhas: Macro | Colunas: Close Code
        matriz = df_f.groupby(['Macro', 'Close code']).size().unstack(fill_value=0)
        
        st.markdown("### 📊 Resumo Quantitativo")
        st.dataframe(matriz, use_container_width=True)

        st.divider()

        # 4. Área de Detalhamento
        st.markdown("### 🔍 Investigar Incidentes")
        col_sel1, col_sel2 = st.columns(2)
        
        # Opções dinâmicas baseadas no que existe no período filtrado
        macros_disp = sorted(df_f['Macro'].unique())
        codes_disp = sorted(df_f['Close code'].unique())
        
        sel_macro = col_sel1.selectbox("Selecione a Macro:", macros_disp, key="sel_macro_f")
        sel_code = col_sel2.selectbox("Selecione o Close Code:", codes_disp, key="sel_code_f")

        # Filtrar detalhes da "célula" selecionada
        df_detalhe = df_f[
            (df_f['Macro'] == sel_macro) & 
            (df_f['Close code'] == sel_code)
        ].sort_values('Resolved', ascending=False)

        if not df_detalhe.empty:
            st.success(f"Exibindo **{len(df_detalhe)}** incidentes para **{sel_macro}** / **{sel_code}**")
            
            # Tabela de Detalhes com as colunas analíticas
            st.dataframe(
                df_detalhe[['Number', 'Empresa', 'Categoria', 'SubCategoria', 'Descricao_Tratada', 'Resolved', 'Assigned to', 'Close notes']], 
                use_container_width=True, 
                hide_index=True
            )
        else:
            st.info("Nenhum incidente para esta combinação no período.")
            
    else:
        st.warning("Nenhum dado encontrado para o período de 30 dias selecionado.")