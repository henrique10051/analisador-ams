import pandas as pd
import re
from calculadora_sla import CalculadoraSLA

def identificar_empresa(service_str):
    if not isinstance(service_str, str): return "Outros"
    s = service_str.upper()
    if "CEARA" in s or "COELCE" in s: return "CE"
    if "RIO" in s or "AMPLA" in s: return "RJ"
    if "SAO PAULO" in s or "SP" in s: return "SP"
    return "Outros"

def extrair_partes_description(short_desc):
    if not isinstance(short_desc, str):
        return "N/A", "N/A", "N/A", "N/A"
    
    macro, categoria, subcategoria, desc_limpa = "N/A", "N/A", "N/A", short_desc
    
    macro_match = re.search(r'\[(.*?)\]', short_desc)
    if macro_match:
        macro = macro_match.group(1).strip().upper()
        desc_limpa = desc_limpa.replace(macro_match.group(0), "")
        
    cat_match = re.search(r'\((.*?)\)', desc_limpa)
    if cat_match:
        conteudo = cat_match.group(1)
        partes = conteudo.split('/')
        categoria = partes[0].strip().upper() if len(partes) > 0 else "N/A"
        subcategoria = partes[1].strip().upper() if len(partes) > 1 else "N/A"
        desc_limpa = desc_limpa.replace(cat_match.group(0), "")
    
    desc_limpa = re.sub(r'\s+', ' ', desc_limpa).strip()
    if not desc_limpa: desc_limpa = "N/A"
        
    return macro, categoria, subcategoria, desc_limpa

def formatar_mes_pt(data):
    meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    if pd.isna(data): return "N/A"
    return f"{meses[data.month - 1]}/{str(data.year)[2:]}"

def processar_base(caminho):
    calc = CalculadoraSLA()
    import io

    # Lê os bytes uma vez só
    if hasattr(caminho, 'read'):
        conteudo = caminho.read()
    else:
        with open(caminho, 'rb') as f:
            conteudo = f.read()

    df = None

    # Tenta Excel primeiro
    try:
        df = pd.read_excel(io.BytesIO(conteudo))
        print("✅ Lido como Excel, colunas:", list(df.columns[:5]))
    except Exception as e:
        print(f"❌ Excel falhou: {e}")

    # Fallback CSV
    if df is None:
        for enc in ('latin-1', 'cp1252', 'utf-8-sig', 'utf-8'):
            try:
                df = pd.read_csv(io.BytesIO(conteudo), encoding=enc)
                print(f"✅ Lido como CSV ({enc}), colunas:", list(df.columns[:5]))
                break
            except Exception as e:
                print(f"❌ CSV {enc} falhou: {e}")

    if df is None:
        raise ValueError("Não foi possível ler o arquivo. Verifique se é um Excel ou CSV válido.")

    df['Opened'] = pd.to_datetime(df['Opened'], errors='coerce')
    df['Resolved'] = pd.to_datetime(df['Resolved'], errors='coerce')
    df['Empresa'] = df['Service'].apply(identificar_empresa)
    
    partes = df['Short description'].apply(extrair_partes_description)
    df['Macro'] = [x[0] for x in partes]
    df['Categoria'] = [x[1] for x in partes]
    df['SubCategoria'] = [x[2] for x in partes]
    df['Descricao_Tratada'] = [x[3] for x in partes]
    
    df['SLA - Dias (8 h)'] = df.apply(lambda r: calc.calcular_sla(r['Opened'], r['Resolved']), axis=1)
    df['TMA - Dias corridos'] = (df['Resolved'] - df['Opened']).dt.total_seconds() / 86400.0
    df.loc[df['TMA - Dias corridos'] < 0, 'TMA - Dias corridos'] = 0
    
    df_res = df.dropna(subset=['Resolved', 'SLA - Dias (8 h)']).copy()
    df_res['Mes_Resolved_Sort'] = df_res['Resolved'].dt.to_period('M')
    df_res['Mes_Display'] = df_res['Resolved'].apply(formatar_mes_pt)
    
    return df_res, df