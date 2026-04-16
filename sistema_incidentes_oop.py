import pandas as pd
import numpy as np
from datetime import datetime
import re
from dataclasses import dataclass
from typing import List, Dict, Optional

# ==========================================
# 1. MODELS (Entities)
# ==========================================
@dataclass
class Incidente:
    number: str
    service: str
    opened: datetime
    resolved: Optional[datetime]
    short_description: str
    state: str
    priority: str
    empresa: str = "Outros"
    categoria: str = "Não Categorizado"
    subcategoria: str = "Não Categorizado"
    macro: str = "Não Identificado"
    sla_horas: float = 0.0
    sla_dias: float = 0.0
    tma_dias: float = 0.0
    reopen_count: int = 0

# ==========================================
# 2. STRATEGIES & PROCESSORS
# ==========================================
class ExtratorDadosProcessor:
    """Strategy para identificar padrões de texto (Empresa, Categorias)."""
    
    @staticmethod
    def identificar_empresa(service_str: str) -> str:
        if not isinstance(service_str, str): return "Outros"
        service_str = service_str.upper()
        if "CEARA" in service_str or "COELCE" in service_str: return "CE"
        if "RIO" in service_str or "AMPLA" in service_str: return "RJ"
        if "SAO PAULO" in service_str or "SP" in service_str: return "SP"
        return "Outros"

    @staticmethod
    def extrair_categorias(short_desc: str) -> tuple:
        """
        Extrai Categoria, Subcategoria e Macro baseado no padrão do Service Now
        Ex: '(GESTAO TDC/TDCS ANTIGOS)Texto livre[OPERACAO]' -> ('GESTAO TDC', 'TDCS ANTIGOS', 'OPERACAO')
        """
        if not isinstance(short_desc, str):
            return "Não Categorizado", "Não Categorizado", "Não Identificado"
            
        categoria, subcategoria, macro = "Não Categorizado", "Não Categorizado", "Não Identificado"
        
        # Pega a macro em colchetes [MACRO]
        macro_match = re.search(r'\[(.*?)\]', short_desc)
        if macro_match: macro = macro_match.group(1).upper()
            
        # Pega categoria e subcategoria em parênteses (CAT/SUBCAT)
        cat_match = re.search(r'\((.*?)\)', short_desc)
        if cat_match:
            partes = cat_match.group(1).split('/')
            categoria = partes[0].strip().upper() if len(partes) > 0 else categoria
            subcategoria = partes[1].strip().upper() if len(partes) > 1 else subcategoria
            
        return categoria, subcategoria, macro

class CalculadoraTempoProcessor:
    """Strategy para cálculo avançado de SLA e TMA baseados na planilha Base."""
    
    # Feriados Brasileiros Nacionais (Você pode adicionar regionais aqui futuramente)
    FERIADOS_BR = [
        '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-29', '2024-04-21', 
        '2024-05-01', '2024-05-30', '2024-09-07', '2024-10-12', '2024-11-02', 
        '2024-11-15', '2024-11-20', '2024-12-25',
        '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-18', '2025-04-21',
        '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-11-02',
        '2025-11-15', '2025-11-20', '2025-12-25',
        '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21',
        '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
        '2026-11-15', '2026-11-20', '2026-12-25'
    ]
    
    @classmethod
    def calcular_tma(cls, opened: datetime, resolved: datetime) -> float:
        """TMA: Dias corridos entre criação e resolução"""
        if pd.isna(opened) or pd.isna(resolved): return 0.0
        diff = resolved - opened
        return diff.total_seconds() / (24 * 3600)
        
    @classmethod
    def calcular_sla_dias_uteis(cls, opened: datetime, resolved: datetime) -> float:
        """
        SLA: Baseado na planilha (9h às 18h com 1h de almoço = 8h úteis diárias).
        Utilizamos numpy busday_count para calcular exatamente os dias e frações.
        """
        if pd.isna(opened) or pd.isna(resolved) or resolved < opened: 
            return 0.0
            
        # Converter para formato numpy datetime64
        d1 = np.datetime64(opened.date())
        d2 = np.datetime64(resolved.date())
        
        # Total de dias úteis completos (excluindo FDS e Feriados)
        dias_uteis_inteiros = np.busday_count(d1, d2, holidays=cls.FERIADOS_BR)
        
        # Simulação aproximada de frações de horas para simplificar a matriz de negócio
        horas_uteis_abertura = min(max(18 - opened.hour, 0), 8) # Horas restantes no dia 1
        horas_uteis_fechamento = min(max(resolved.hour - 9, 0), 8) # Horas gastas no último dia
        
        # Ajuste fino: se finalizado no mesmo dia
        if d1 == d2:
            sla_horas = min(max((resolved - opened).total_seconds() / 3600, 0), 8)
        else:
            # (dias inteiros - 1 dia porque calculamos as horas separadas do primeiro e último) * 8 horas
            sla_horas = max((dias_uteis_inteiros - 1), 0) * 8 + horas_uteis_abertura + horas_uteis_fechamento
            
        return sla_horas / 8.0 # Converte horas totais de volta para Dias Úteis (1 dia útil = 8h)

# ==========================================
# 3. REPOSITORY (Data Layer)
# ==========================================
class IncidenteRepository:
    """Pipeline de carregamento de dados (Pandas)"""
    
    def carregar_arquivo(self, filepath: str) -> List[Incidente]:
        # Suporta tanto XLS/XLSX quanto CSV exportado diretamente
        try:
            df = pd.read_excel(filepath)
        except:
            df = pd.read_csv(filepath)
            
        # Converte Datas
        df['Opened'] = pd.to_datetime(df['Opened'], errors='coerce')
        df['Resolved'] = pd.to_datetime(df['Resolved'], errors='coerce')
        
        incidentes = []
        for _, row in df.iterrows():
            # Executa a Strategy de extração de campos
            empresa = ExtratorDadosProcessor.identificar_empresa(row.get('Service', ''))
            cat, subcat, macro = ExtratorDadosProcessor.extrair_categorias(row.get('Short description', ''))
            
            # Executa a Strategy de Tempos (Pipeline)
            abertura = row.get('Opened')
            fechamento = row.get('Resolved')
            
            tma = CalculadoraTempoProcessor.calcular_tma(abertura, fechamento)
            sla = CalculadoraTempoProcessor.calcular_sla_dias_uteis(abertura, fechamento)
            
            inc = Incidente(
                number=row.get('Number', ''),
                service=row.get('Service', ''),
                opened=abertura,
                resolved=fechamento,
                short_description=row.get('Short description', ''),
                state=row.get('State', ''),
                priority=row.get('Priority', ''),
                empresa=empresa,
                categoria=cat,
                subcategoria=subcat,
                macro=macro,
                sla_horas=sla * 8.0,
                sla_dias=sla,
                tma_dias=tma,
                reopen_count=row.get('Reopen count', 0)
            )
            
            # Filtra apenas tickets incidentes válidos
            if inc.number: 
                incidentes.append(inc)
                
        return incidentes

# ==========================================
# 4. SERVICE FACADE (Business Logic)
# ==========================================
class AnalisadorIncidentesService:
    """Facade unificado chamado pela interface do Streamlit"""
    
    def __init__(self):
        self.repository = IncidenteRepository()
        
    def processar_arquivo(self, filepath: str) -> List[Incidente]:
        return self.repository.carregar_arquivo(filepath)
        
    def gerar_relatorio_completo(self, incidentes: List[Incidente]) -> Dict:
        """Gera os DataFrames agregados que o Streamlit irá usar para plotar"""
        df = pd.DataFrame([vars(i) for i in incidentes])
        
        # Filtra apenas resolvidos/fechados para análise de SLA/TMA
        df_resolvidos = df[df['resolved'].notnull()].copy()
        df_resolvidos['mes_ano'] = df_resolvidos['opened'].dt.to_period('M').astype(str)
        
        relatorio = {
            'total_incidentes': len(df),
            'sla': {
                'geral': {
                    'media': df_resolvidos['sla_dias'].mean() if not df_resolvidos.empty else 0,
                    'mediana': df_resolvidos['sla_dias'].median() if not df_resolvidos.empty else 0,
                    'minimo': df_resolvidos['sla_dias'].min() if not df_resolvidos.empty else 0,
                    'maximo': df_resolvidos['sla_dias'].max() if not df_resolvidos.empty else 0,
                },
                'por_mes': {},
                'por_empresa': {}
            },
            'tma': {
                'geral': {
                    'media': df_resolvidos['tma_dias'].mean() if not df_resolvidos.empty else 0,
                    'mediana': df_resolvidos['tma_dias'].median() if not df_resolvidos.empty else 0,
                    'total_incidentes': len(df_resolvidos)
                },
                'por_empresa': {}
            },
            'categorias': df['categoria'].value_counts().to_dict()
        }
        
        # SLA por mês (Evolução)
        for mes in df_resolvidos['mes_ano'].unique():
            df_mes = df_resolvidos[df_resolvidos['mes_ano'] == mes]
            relatorio['sla']['por_mes'][mes] = {
                'media': df_mes['sla_dias'].mean(),
                'minimo': df_mes['sla_dias'].min(),
                'maximo': df_mes['sla_dias'].max()
            }
            
        # Agrupamento por Empresa
        for emp in ['CE', 'RJ', 'SP']:
            df_emp = df_resolvidos[df_resolvidos['empresa'] == emp]
            
            relatorio['sla']['por_empresa'][emp] = {
                'media': df_emp['sla_dias'].mean() if not df_emp.empty else 0,
                'mediana': df_emp['sla_dias'].median() if not df_emp.empty else 0,
                'total_incidentes': len(df_emp)
            }
            relatorio['tma']['por_empresa'][emp] = {
                'media': df_emp['tma_dias'].mean() if not df_emp.empty else 0,
                'total_incidentes': len(df_emp)
            }
            
        return relatorio