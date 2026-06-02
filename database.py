import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "ams_docs.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Cria as tabelas se não existirem."""
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documentos (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo    TEXT    NOT NULL,
            categoria TEXT    NOT NULL,
            autor     TEXT    NOT NULL,
            conteudo  TEXT,
            criado_em TEXT    NOT NULL,
            atualizado_em TEXT NOT NULL
        )
    """)
    # Insere dados de exemplo se a tabela estiver vazia
    cursor = conn.execute("SELECT COUNT(*) FROM documentos")
    if cursor.fetchone()[0] == 0:
        agora = datetime.now().strftime("%d/%m/%Y")
        exemplos = [
            ("Visão Geral da Aplicação", "Técnico", "Henrique Augusto",
             "<h2>Visão Geral</h2><p>O Analisador AMS ForceBeat é uma aplicação desenvolvida em Streamlit para análise de indicadores de incidentes ServiceNow nas regionais SP, CE e RJ.</p>",
             agora, agora),
            ("Como usar a aba SLA", "Manual do Usuário", "Henrique Augusto",
             "<h2>Aba SLA</h2><p>Exibe os indicadores de cumprimento de SLA por período, analista e regional.</p>",
             agora, agora),
            ("Estrutura do Banco de Dados", "Técnico", "Henrique Augusto",
             "<h2>Banco de Dados</h2><p>A tabela principal é <strong>incidentes</strong>, com 48 colunas mapeadas a partir da extração ServiceNow.</p>",
             agora, agora),
        ]
        conn.executemany("""
            INSERT INTO documentos (titulo, categoria, autor, conteudo, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?)
        """, exemplos)
    conn.commit()
    conn.close()

def listar_documentos(busca="", categoria="Todas"):
    conn = get_connection()
    query = "SELECT * FROM documentos WHERE 1=1"
    params = []
    if busca:
        query += " AND (titulo LIKE ? OR categoria LIKE ?)"
        params += [f"%{busca}%", f"%{busca}%"]
    if categoria != "Todas":
        query += " AND categoria = ?"
        params.append(categoria)
    query += " ORDER BY atualizado_em DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def buscar_documento(doc_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM documentos WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def salvar_documento(titulo, categoria, autor, conteudo, doc_id=None):
    agora = datetime.now().strftime("%d/%m/%Y")
    conn = get_connection()
    if doc_id:
        conn.execute("""
            UPDATE documentos
            SET titulo=?, categoria=?, autor=?, conteudo=?, atualizado_em=?
            WHERE id=?
        """, (titulo, categoria, autor, conteudo, agora, doc_id))
    else:
        conn.execute("""
            INSERT INTO documentos (titulo, categoria, autor, conteudo, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (titulo, categoria, autor, conteudo, agora, agora))
    conn.commit()
    conn.close()

def deletar_documento(doc_id):
    conn = get_connection()
    conn.execute("DELETE FROM documentos WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()