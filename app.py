import streamlit as st
from processador_dados import processar_base
import abas.geral as geral
import abas.sla as sla
import abas.tma as tma
import abas.categorias as categorias
import abas.subcategorias as subcategorias
import abas.macro_fechamento as macro_fechamento
import abas.chat_ia as chat_ia

# Configuração da Página
st.set_page_config(
    page_title="Analisador AMS - ForceBeat", 
    page_icon="📊", 
    layout="wide"
)

def main():
    # Sidebar para Upload
    st.sidebar.header("📁 Entrada de Dados")
    file_data = st.sidebar.file_uploader("Upload da extração ServiceNow", type=['csv', 'xlsx'])

    if not file_data:
        st.markdown("# 📊 Sistema Analisador AMS")
        st.info("👈 Por favor, carregue um arquivo CSV ou Excel para iniciar a análise.")
        return

    # Processamento dos dados com cache para não travar a navegação
    @st.cache_data
    def carregar_e_processar(file):
        return processar_base(file)

    with st.spinner("Processando indicadores..."):
        df_resolvidos, df_completo = carregar_e_processar(file_data)

    # Definição das Abas do Sistema
    tabs = st.tabs([
        "📈 Geral", 
        "🎯 SLA", 
        "⏱️ TMA", 
        "📊 Categorias", 
        "📂 Subcategorias", 
        "🔒 Macro Fechamento", 
        "🤖 Chat IA", 
        "📋 Base"
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
        st.dataframe(df_completo, hide_index=True)

if __name__ == "__main__":
    main()