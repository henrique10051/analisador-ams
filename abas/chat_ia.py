import streamlit as st
import google.generativeai as genai
import pandas as pd

def renderizar(df_resolvidos):
    st.subheader("🤖 Analista Estratégico AMS (Gemini 2.5)")

    # 1. Verificação de Segurança de Dados
    if df_resolvidos is None or df_resolvidos.empty:
        st.warning("A base de dados está vazia ou não foi carregada corretamente.")
        return

    # 2. Configuração do Modelo
    try:
        api_key = st.secrets.get("GEMINI_API_KEY")
        if not api_key:
            st.error("Chave API não encontrada. Verifique o arquivo .streamlit/secrets.toml")
            return
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('models/gemini-2.5-flash')
    except Exception as e:
        st.error(f"Erro na conexão com o Google AI: {e}")
        return

    # 3. Gestão do Histórico
    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # 4. Input do Chat
    if prompt := st.chat_input("Como posso ajudar na análise hoje?"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Analisando indicadores..."):
                try:
                    # --- PREPARAÇÃO SEGURA DOS DADOS ---
                    # Garantindo que não existam NaT ou erros de cálculo
                    data_max = df_resolvidos['Opened'].max()
                    if pd.isna(data_max):
                        data_max_str = "Data não disponível"
                        dez_dias_atras = pd.Timestamp.now()
                    else:
                        data_max_str = data_max.strftime('%d/%m/%Y')
                        dez_dias_atras = data_max - pd.Timedelta(days=10)

                    # Filtros rápidos para o prompt
                    recentes = df_resolvidos[df_resolvidos['Opened'] >= dez_dias_atras]
                    resumo_cats = df_resolvidos['Categoria'].value_counts().head(10).to_dict()
                    resumo_subs = recentes['SubCategoria'].value_counts().head(10).to_dict()

                    # --- SYSTEM PROMPT ---
                    system_prompt = f"""
                    Você é um Especialista em AMS (Application Management Services).
                    Sua missão é auxiliar o Henrique na gestão do projeto RadSync.
                    
                    DADOS TÉCNICOS:
                    - Total de Tickets: {len(df_resolvidos)}
                    - Data da última atualização: {data_max_str}
                    - Top 10 Categorias: {resumo_cats}
                    - Movimentação nos últimos 10 dias (Subcategorias): {resumo_subs}
                    
                    REGRAS:
                    - Responda SEMPRE em português.
                    - Se pedirem ranking ou relatório, use Tabelas Markdown.
                    - Seja proativo: se o SLA estiver alto, sugira uma revisão na categoria afetada.
                    """

                    response = model.generate_content(f"{system_prompt}\n\nPergunta: {prompt}")
                    
                    if response and response.text:
                        st.markdown(response.text)
                        st.session_state.messages.append({"role": "assistant", "content": response.text})
                    else:
                        st.error("A IA não conseguiu gerar uma resposta. Tente reformular.")
                        
                except Exception as e:
                    st.error(f"Erro no processamento da resposta: {e}")

    # Sidebar para controle de memória
    if st.sidebar.button("Limpar Histórico", key="clear_chat"):
        st.session_state.messages = []
        st.rerun()