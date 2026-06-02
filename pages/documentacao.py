import streamlit as st
from streamlit_quill import st_quill
from database import init_db, listar_documentos, buscar_documento, salvar_documento, deletar_documento

st.set_page_config(page_title="Documentação", page_icon="📄", layout="wide")

# Inicializa o banco na primeira execução
init_db()

# ─── CSS ───────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .doc-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 10px;
    }
    .doc-title { font-size: 15px; font-weight: 600; color: #1F4E79; margin: 0; }
    .doc-meta  { font-size: 12px; color: #888; margin-top: 4px; }
    .doc-tag {
        display: inline-block;
        background: #EBF3FB;
        color: #1F4E79;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 11px;
        margin-right: 4px;
    }
    .section-title {
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #888;
        margin-bottom: 8px;
    }
</style>
""", unsafe_allow_html=True)

# ─── STATE ─────────────────────────────────────────────────────────────────
if "doc_selecionado_id" not in st.session_state:
    st.session_state.doc_selecionado_id = None

if "modo" not in st.session_state:
    st.session_state.modo = "lista"

CATEGORIAS = ["Técnico", "Manual do Usuário", "Processo", "Outros"]

# ─── LAYOUT ────────────────────────────────────────────────────────────────
col_lista, col_conteudo = st.columns([1, 2], gap="large")

with col_lista:
    st.markdown("## 📄 Documentações")

    busca      = st.text_input("🔍 Buscar", placeholder="Título ou categoria...", label_visibility="collapsed")
    cat_filtro = st.selectbox("Categoria", ["Todas"] + CATEGORIAS, label_visibility="collapsed")
    st.markdown("---")

    if st.button("＋ Nova documentação", use_container_width=True, type="primary"):
        st.session_state.doc_selecionado_id = None
        st.session_state.modo = "novo"
        st.rerun()

    st.markdown("<div class='section-title'>Documentos</div>", unsafe_allow_html=True)

    docs = listar_documentos(busca=busca, categoria=cat_filtro)

    if not docs:
        st.info("Nenhum documento encontrado.")
    else:
        for doc in docs:
            selecionado = st.session_state.doc_selecionado_id == doc["id"]
            borda = "border-left: 3px solid #1F4E79;" if selecionado else ""
            st.markdown(f"""
                <div class='doc-card' style='{borda}'>
                    <p class='doc-title'>{doc['titulo']}</p>
                    <div class='doc-meta'>
                        <span class='doc-tag'>{doc['categoria']}</span>
                        Atualizado em {doc['atualizado_em']}
                    </div>
                </div>
            """, unsafe_allow_html=True)
            if st.button("Abrir", key=f"abrir_{doc['id']}", use_container_width=True):
                st.session_state.doc_selecionado_id = doc["id"]
                st.session_state.modo = "visualizar"
                st.rerun()

# ─── PAINEL DIREITO ────────────────────────────────────────────────────────
with col_conteudo:

    # ── VISUALIZAR ──
    if st.session_state.modo == "visualizar" and st.session_state.doc_selecionado_id:
        doc = buscar_documento(st.session_state.doc_selecionado_id)
        if doc:
            col_tit, col_acoes = st.columns([3, 1])
            with col_tit:
                st.markdown(f"## {doc['titulo']}")
                st.markdown(
                    f"<span class='doc-tag'>{doc['categoria']}</span> &nbsp;"
                    f"<span style='color:#888;font-size:12px;'>Atualizado em {doc['atualizado_em']} por {doc['autor']}</span>",
                    unsafe_allow_html=True
                )
            with col_acoes:
                if st.button("✏️ Editar", use_container_width=True):
                    st.session_state.modo = "editar"
                    st.rerun()
                if st.button("🗑️ Excluir", use_container_width=True):
                    deletar_documento(doc["id"])
                    st.session_state.doc_selecionado_id = None
                    st.session_state.modo = "lista"
                    st.rerun()

            st.markdown("---")
            st.markdown(doc["conteudo"], unsafe_allow_html=True)

    # ── EDITAR / NOVO ──
    elif st.session_state.modo in ("editar", "novo"):
        doc = buscar_documento(st.session_state.doc_selecionado_id) if st.session_state.modo == "editar" else {}

        titulo    = st.text_input("Título", value=doc.get("titulo", "") if doc else "")
        categoria = st.selectbox(
            "Categoria", CATEGORIAS,
            index=CATEGORIAS.index(doc["categoria"]) if doc and doc.get("categoria") in CATEGORIAS else 0
        )
        autor = st.text_input("Autor", value=doc.get("autor", "Henrique Augusto") if doc else "Henrique Augusto")

        st.markdown("**Conteúdo**")
        conteudo = st_quill(
            value=doc.get("conteudo", "") if doc else "",
            html=True,
            key=f"quill_{st.session_state.doc_selecionado_id or 'novo'}"
        )

        col_salvar, col_cancelar = st.columns(2)
        with col_salvar:
            if st.button("💾 Salvar", use_container_width=True, type="primary"):
                if not titulo:
                    st.warning("Informe o título do documento.")
                else:
                    doc_id = doc.get("id") if doc else None
                    salvar_documento(titulo, categoria, autor, conteudo, doc_id=doc_id)
                    st.success("Documento salvo!")
                    if not doc_id:
                        todos = listar_documentos()
                        if todos:
                            st.session_state.doc_selecionado_id = todos[0]["id"]
                    st.session_state.modo = "visualizar"
                    st.rerun()
        with col_cancelar:
            if st.button("Cancelar", use_container_width=True):
                st.session_state.modo = "visualizar" if st.session_state.modo == "editar" else "lista"
                st.rerun()

    # ── ESTADO INICIAL ──
    else:
        st.markdown("### 👈 Selecione um documento ao lado para visualizar.")