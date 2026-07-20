import streamlit as st
from processador_dados import processar_base, derivar_resolvidos
from repositorio_incidentes import upsert_incidentes, carregar_incidentes, carregar_dias_nao_uteis
import abas.geral as geral
import abas.sla as sla
import abas.tma as tma
import abas.categorias as categorias
import abas.subcategorias as subcategorias
import abas.macro_fechamento as macro_fechamento
import abas.chat_ia as chat_ia
import abas.dias_nao_uteis as dias_nao_uteis
from abas.ui_helpers import tabela_editavel

# Configuração da Página
st.set_page_config(
    page_title="Analisador AMS - ForceBeat", 
    page_icon="📊", 
    layout="wide"
)

def main():
    st.markdown("# 📊 Sistema Analisador AMS")

    # Sidebar para Upload
    st.sidebar.header("📁 Entrada de Dados")
    file_data = st.sidebar.file_uploader("Upload da extração ServiceNow", type=['csv', 'xlsx'])

    dias_extra = carregar_dias_nao_uteis()
    lista_dias_extra = dias_extra['data'].tolist() if not dias_extra.empty else []

    if file_data is not None:
        with st.spinner("Processando e salvando na base..."):
            _, df_completo_novo = processar_base(file_data, dias_nao_uteis_extra=lista_dias_extra)
            qtd = upsert_incidentes(df_completo_novo)
        st.sidebar.success(f"{qtd} chamados sincronizados com a base.")

    with st.spinner("Carregando base acumulada..."):
        df_completo = carregar_incidentes()

    if df_completo.empty:
        st.info("👈 Nenhum dado na base ainda. Carregue um arquivo CSV ou Excel para começar.")
        return

    df_resolvidos = derivar_resolvidos(df_completo)

    # Definição das Abas do Sistema
    tabs = st.tabs([
        "📈 Geral",
        "🎯 SLA",
        "⏱️ TMA",
        "📊 Categorias",
        "📂 Subcategorias",
        "🔒 Macro Fechamento",
        "🤖 Chat IA",
        "📋 Base",
        "🗓️ Dias Não Úteis",
    ])

    # Chamada de cada módulo (aba)
    with tabs[0]:
        geral.renderizar(df_completo)

    with tabs[1]:
        sla.renderizar(df_resolvidos)

    with tabs[2]:
        tma.renderizar(df_resolvidos)

    with tabs[3]:
        categorias.renderizar(df_resolvidos)

    with tabs[4]:
        subcategorias.renderizar(df_resolvidos)

    with tabs[5]:
        macro_fechamento.renderizar(df_resolvidos)

    with tabs[6]:
        chat_ia.renderizar(df_resolvidos)

    with tabs[7]:
        st.subheader("📋 Base de Dados Completa (Tratada)")
        tabela_editavel(df_completo, df_completo.columns.tolist(), key='editor_base')

    with tabs[8]:
        dias_nao_uteis.renderizar()

if __name__ == "__main__":
    main()