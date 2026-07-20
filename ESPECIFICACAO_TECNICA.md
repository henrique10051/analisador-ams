# Especificação Técnica — Analisador AMS (ForceBeat)

## 1. Visão geral

Dashboard web para análise de chamados de incidente exportados do ServiceNow, usado para acompanhar SLA e TMA de uma operação de AMS (Application Management Services — suporte/manutenção de aplicações terceirizado) do contrato "RadSync", cobrindo três distribuidoras de energia: **CE** (Ceará/Coelce), **RJ** (Rio/Ampla) e **SP** (São Paulo).

O usuário faz upload de uma exportação do ServiceNow (CSV/XLSX); a aplicação processa os dados, calcula métricas de SLA (em horas úteis) e TMA (em dias corridos), e apresenta 8 abas analíticas mais um assistente de chat com IA.

## 2. Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Linguagem | Python 3.11 |
| UI | Streamlit (`>=1.30.0`) |
| Processamento de dados | pandas (`>=2.0.0`), numpy (`>=1.24.0`) |
| Visualização | Plotly (`>=5.18.0`) |
| Leitura de Excel | openpyxl (`>=3.1.0`) |
| IA / Chat | google-generativeai (`>=0.3.0`), modelo Gemini 2.5 Flash |
| Empacotamento desktop | PyInstaller (`>=6.0.0`) |
| CI/CD | GitHub Actions (`build-windows.yml`) |
| Hospedagem web | Render.com |

Não há `pyproject.toml`, lockfile ou testes automatizados no repositório.

## 3. Estrutura do projeto

```
analisador-ams/
├── app.py                     # Entry point: config da página, upload, orquestração das abas
├── processador_dados.py       # Pipeline de dados: parsing, extração de campos, cálculo de SLA/TMA
├── calculadora_sla.py         # Motor de cálculo de SLA em horas úteis (classe CalculadoraSLA)
├── sistema_incidentes_oop.py  # Reescrita OOP paralela — NÃO utilizada pelo app.py atualmente
├── build_exe.py               # Script PyInstaller para gerar o .exe Windows
├── start.sh                   # Script de start para Render.com
├── requirements.txt
├── README.md
├── .streamlit/secrets.toml    # Contém GEMINI_API_KEY
├── .github/workflows/build-windows.yml
└── abas/
    ├── geral.py                # Aba "Geral" — volumetria
    ├── sla.py                  # Aba "SLA"
    ├── tma.py                  # Aba "TMA"
    ├── categorias.py           # Aba "Categorias"
    ├── subcategorias.py        # Aba "Subcategorias"
    ├── macro_fechamento.py     # Aba "Macro Fechamento" — matriz pivô Macro × Close Code
    └── chat_ia.py              # Aba "Chat IA" — assistente Gemini
```

## 4. Pipeline de dados (`processador_dados.py`)

Função principal: `processar_base()` (cacheada via `@st.cache_data`).

1. Lê o arquivo enviado (Excel, com fallback para CSV).
2. Converte colunas `Opened`/`Resolved` para datetime.
3. `identificar_empresa(service_str)`: classifica cada chamado em `CE`/`RJ`/`SP`/`Outros` por casamento de palavras-chave no campo `Service`.
4. `extrair_partes_description(short_desc)`: usa regex para extrair de `Short description` a convenção `[MACRO](Categoria/Subcategoria) texto livre`, populando `Macro`, `Categoria`, `SubCategoria` e `Descricao_Tratada`.
5. `formatar_mes_pt(data)`: formata datas como mês/ano abreviado em português (ex: "Jul/26").
6. Calcula `SLA - Dias (8 h)` via `CalculadoraSLA.calcular_sla` e `TMA - Dias corridos` (diferença de dias corridos entre Opened/Resolved, com piso em 0).
7. Retorna `(df_resolvidos, df_completo)`.

### Motor de SLA (`calculadora_sla.py`)

- Expediente: 09:00–18:00, com desconto implícito de 1h de almoço (12:00–13:00).
- Calendário de feriados nacionais brasileiros fixo (2023–2026).
- `calcular_sla(aberto, resolvido)`: usa `numpy.busday_count` para dias úteis entre abertura/fechamento, soma frações de hora útil do dia de abertura e do dia de fechamento, retorna SLA em "dias" de 8h. Retorna `None` se datas ausentes ou fechamento anterior à abertura.

### Implementação OOP paralela (`sistema_incidentes_oop.py`)

Código não utilizado pelo `app.py` — modelo `Incidente` (dataclass), `IncidenteRepository`, `AnalisadorIncidentesService`, com uma **fórmula de SLA diferente e mais simplificada** que a de `calculadora_sla.py`. Representa risco de divergência de lógica de negócio caso seja reativado sem consolidação.

## 5. Colunas de entrada esperadas

Exportação ServiceNow com (no mínimo): `Number`, `Service`, `Opened`, `Resolved`, `Short description`, `State`, `Priority`, `Assignment group`, `ICT Service`, `Assigned to`, `Close code`, `Close notes`, `Reopen count`.

## 6. Abas da aplicação

1. **Geral** — filtros por ano/mês/empresa/macro; gráfico de linha de volume mensal; barras agrupadas por empresa/mês; tabela detalhada.
2. **SLA** — filtros (grupo de atendimento, ICT Service, estado, default "FORCEBEAT"/"User Support"); cards de média/contagem/máximo; barra de SLA médio mensal; linha de máx/mín; drilldown de "piores casos" do mês.
3. **TMA** — mesma estrutura da aba SLA, para tempo de resolução em dias corridos.
4. **Categorias** — filtro por período (padrão últimos 30 dias); barras empilhadas horizontais por Categoria × Empresa; tabela detalhe.
5. **Subcategorias** — mesmo padrão, um nível abaixo (filtrável por Categoria).
6. **Macro Fechamento** — pivô Macro × Close Code; drilldown por combinação selecionada, incluindo `Close notes`.
7. **Chat IA** — chat com Gemini 2.5 Flash; injeta estatísticas ao vivo (total de chamados, top 10 categorias, movimentação de subcategorias) no prompt de sistema; responde em português, usa tabelas Markdown.
8. **Base** (inline em `app.py`) — tabela completa dos dados tratados.

## 7. Execução e build

- **Dev local:** `streamlit run app.py`
- **Deploy web (Render.com):** `start.sh` → `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0`
- **Executável Windows:** `build_exe.py` gera `dist/AnalisadorAMS.exe` via PyInstaller (`--onefile`, console habilitado para debug), mais `EXECUTAR.bat` e `LEIA-ME.txt`.
- **CI:** `.github/workflows/build-windows.yml` builda o exe em `windows-latest`, injeta `GEMINI_API_KEY` a partir de GitHub Secrets, publica artefato (retenção 90 dias).

## 8. Regras de negócio codificadas (hardcoded)

- Filtro padrão "FORCEBEAT" no grupo de atendimento e "User Support" no ICT Service, repetido em `sla.py`, `tma.py`, `categorias.py`, `subcategorias.py`, `macro_fechamento.py` — acopla fortemente o app a este contrato específico.
- Calendário de feriados fixo até 2026 — requer manutenção anual.
- Todo o texto de UI está em português (pt-BR).

## 9. Pontos de atenção conhecidos

- **Segurança:** `.streamlit/secrets.toml` contém uma chave de API do Gemini commitada no repositório, e `.gitignore` não exclui `.streamlit/`. Recomenda-se rotacionar a chave e remover o arquivo do controle de versão.
- **Duplicação de lógica:** SLA e extração de categorias implementados duas vezes (`processador_dados.py`/`calculadora_sla.py` vs. `sistema_incidentes_oop.py`), com fórmulas de SLA diferentes; a versão OOP está morta (não importada em lugar nenhum).
- **Sem testes automatizados** no repositório.
- **Sem lockfile** — dependências fixadas apenas com `>=`, risco de reprodutibilidade.
- **README menciona "exportação de relatórios"** que não existe no código — toda saída é in-app (tabelas/gráficos Streamlit).
