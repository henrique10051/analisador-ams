# PRD — Analisador AMS (ForceBeat)

## 1. Contexto e problema

A operação de AMS (Application Management Services) do contrato "RadSync" atende três distribuidoras de energia (CE, RJ, SP) via ServiceNow. Hoje, acompanhar o cumprimento de SLA e o tempo médio de atendimento (TMA) exige extrair manualmente relatórios do ServiceNow e analisá-los em planilhas. Isso é lento, propenso a erro e dificulta a identificação rápida de gargalos por categoria, subcategoria ou responsável.

## 2. Objetivo do produto

Fornecer um dashboard self-service onde qualquer pessoa da operação possa subir uma exportação do ServiceNow e obter, em segundos, uma visão consolidada de volumetria, SLA, TMA e causas-raiz de atraso, além de poder tirar dúvidas sobre os dados via chat com IA.

## 3. Público-alvo

- Analistas e coordenadores da operação AMS/RadSync que monitoram o contrato mês a mês.
- Gestores que precisam de números de SLA/TMA para reuniões de acompanhamento com o cliente.

## 4. Escopo atual (o que já está construído)

### 4.1 Ingestão de dados
- Upload de arquivo `.csv` ou `.xlsx` exportado do ServiceNow via sidebar.
- Processamento automático: classificação por distribuidora (CE/RJ/SP/Outros), extração de Macro/Categoria/Subcategoria a partir da descrição curta, cálculo de SLA (horas úteis, considerando feriados e expediente 09h–18h) e TMA (dias corridos).

### 4.2 Dashboards (8 abas)
| Aba | Funcionalidade principal |
|---|---|
| Geral | Volumetria de chamados por mês/empresa/macro |
| SLA | Média/máximo/mínimo de SLA mensal, ranking de piores casos |
| TMA | Mesma análise da aba SLA, para tempo de resolução em dias corridos |
| Categorias | Volume por categoria × empresa, últimos 30 dias por padrão |
| Subcategorias | Drilldown de categoria para subcategoria |
| Macro Fechamento | Matriz Macro × motivo de fechamento, com detalhe de ticket |
| Chat IA | Perguntas em linguagem natural sobre os dados, respondidas com contexto estatístico injetado |
| Base | Tabela completa dos dados tratados |

### 4.3 Distribuição
- App web hospedado (Render.com).
- Executável standalone para Windows (não requer instalação de Python), distribuído como artefato de build no GitHub Actions.

## 5. Fora de escopo (hoje)

- Exportação de relatórios (PDF/Excel) a partir do dashboard — **mencionado no README mas não implementado**; precisa de decisão: remover a menção ou priorizar a feature.
- Persistência de dados entre sessões (cada upload é processado em memória, nada é salvo em banco).
- Autenticação/controle de acesso — o app não possui login.
- Suporte a outras distribuidoras além de CE/RJ/SP (tudo mais cai em "Outros").
- Testes automatizados.

## 6. Riscos e dívidas técnicas relevantes ao produto

1. **Chave de API exposta**: a chave do Gemini está commitada em `.streamlit/secrets.toml`, sem estar no `.gitignore`. Risco de uso indevido/custo — recomenda-se rotacionar a chave e remover do versionamento antes de qualquer divulgação mais ampla do repositório.
2. **Lógica de negócio duplicada**: existe uma segunda implementação (`sistema_incidentes_oop.py`) com uma fórmula de SLA diferente da usada em produção, não conectada ao app. Se alguém reativar esse código sem perceber a divergência, os números de SLA reportados podem ficar inconsistentes.
3. **Acoplamento ao contrato atual**: filtros padrão como "FORCEBEAT" e "User Support" estão hardcoded em várias abas. Se o produto precisar atender outro contrato/cliente, isso exige refatoração em múltiplos arquivos.
4. **Calendário de feriados fixo até 2026** — precisa de atualização anual manual ou o cálculo de SLA quebra silenciosamente para datas futuras.

## 7. Métricas de sucesso sugeridas

- Tempo de geração de um relatório de SLA/TMA: de "horas em planilha" para "menos de 1 minuto" pós-upload.
- Redução de divergências entre números reportados ao cliente vs. dados brutos do ServiceNow (hoje sujeitos a erro manual).
- Adoção: nº de uploads/análises realizadas por mês pela equipe.

## 8. Próximos passos sugeridos (não implementados, para priorização)

- Decidir sobre exportação de relatórios (PDF/Excel) — alinhar com o README ou removê-lo do escopo declarado.
- Corrigir o vazamento de credencial e adicionar `.streamlit/secrets.toml` ao `.gitignore`.
- Consolidar ou remover `sistema_incidentes_oop.py` para eliminar a duplicação de lógica de SLA.
- Tornar os filtros de grupo/serviço (hoje hardcoded como "FORCEBEAT"/"User Support") configuráveis, caso o produto precise atender outros contratos.
- Adicionar cobertura de testes para o motor de cálculo de SLA/TMA, dado seu impacto direto em números reportados a clientes.
