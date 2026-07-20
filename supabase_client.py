import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_client: Client | None = None


def _get_config():
    """Resolve URL + chave do Supabase.

    Prioriza a chave pública (anon, restrita por RLS - ver sql/rls_policies.sql),
    que é a que vai embarcada no .exe distribuído. A service_role só é usada
    em scripts administrativos locais (ex: carregar_base_inicial.py) que
    precisam rodar sem as políticas de RLS."""
    try:
        import streamlit as st
        if "SUPABASE_URL" in st.secrets:
            chave = st.secrets.get("SUPABASE_ANON_KEY") or st.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
            return st.secrets["SUPABASE_URL"], chave
    except Exception:
        pass
    url = os.environ.get("SUPABASE_URL")
    chave = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return url, chave


def get_client() -> Client:
    global _client
    if _client is None:
        url, key = _get_config()
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_ANON_KEY não configurados "
                "(.env local ou st.secrets no deploy)."
            )
        _client = create_client(url, key)
    return _client


def get_admin_client() -> Client:
    """Cliente com service_role, ignora RLS. Uso restrito a scripts
    administrativos locais (nunca embarcar no .exe distribuído)."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados no .env local.")
    return create_client(url, key)
