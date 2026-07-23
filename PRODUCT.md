# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Analistas e coordenadores da operação AMS (Application Management Services) do contrato "RadSync" (equipe/projeto interno "ForceBeat"), que acompanham SLA e TMA mês a mês para três distribuidoras de energia: CE (Coelce), RJ (Ampla) e SP. Também usado por gestores que precisam de números de SLA/TMA para reuniões de acompanhamento com o cliente.

## Product Purpose

Dashboard self-service de análise de chamados de incidente do ServiceNow. O usuário sobe uma exportação CSV/XLSX e obtém, em segundos, volumetria, cumprimento de SLA, tempo médio de atendimento (TMA) e causas-raiz de atraso por categoria/subcategoria — eliminando a extração manual e análise em planilha que precede o produto.

## Positioning

O diferencial central é o motor de cálculo de SLA/TMA: SLA computado em horas úteis (expediente 09h–18h com desconto de almoço, calendário de feriados nacionais + dias não úteis extras cadastráveis) e TMA em dias corridos, aplicado automaticamente sobre a exportação bruta do ServiceNow. Uma planilha manual não replica esse cálculo com a mesma confiabilidade e velocidade.

## Operating Context

- Upload de exportação ServiceNow (.csv/.xlsx) via a aba "Geral"; dados processados e persistidos de forma incremental (upsert por número do chamado) numa base acumulada no Supabase.
- 9 telas analíticas: Geral (volumetria), SLA, TMA, Categorias, Subcategorias, Macro Fechamento (matriz motivo de fechamento), Chat IA (assistente Gemini com contexto estatístico ao vivo), Base (tabela completa editável), Dias Não Úteis (calendário customizado usado no recálculo de SLA).
- Uso recorrente mensal/quinzenal pela mesma pequena equipe operacional, não uma ferramenta de uso público.

## Capabilities and Constraints

- Classificação automática por distribuidora (CE/RJ/SP/Outros) e extração de Macro/Categoria/Subcategoria a partir de convenção textual `[MACRO](Categoria/Subcategoria)` na descrição curta do chamado.
- Campos Macro/Categoria/Subcategoria/Descrição são editáveis diretamente nas tabelas e persistem no Supabase.
- Filtros padrão hardcoded no domínio do contrato atual: grupo de atribuição "FORCEBEAT" e serviço ICT "User Support" — acoplamento aceito por ora; não generalizar para multi-contrato sem pedido explícito.
- Sem autenticação/controle de acesso.
- Sem exportação de relatórios (PDF/Excel) — decisão em aberto no PRD original, não implementada.
- Calendário de feriados fixo (2023–2026) requer atualização manual anual; dias extras (pontes, paralisações) são cadastráveis pela própria interface.

## Brand Commitments

"ForceBeat" é o nome interno do projeto/contrato, sem identidade visual oficial (logo/paleta) a respeitar — não é uma marca externa com guidelines. A identidade visual atual do dashboard (paleta cobre/grafite, tipografia técnica — conceito "console de instrumentos + prancheta técnica") foi uma escolha de design própria deste trabalho, não um requisito de marca herdado.

## Evidence on Hand

Dados reais de produção: exportação ServiceNow de referência em `incident (1).csv` (~19 mil linhas) e base já populada no Supabase (~3.600 incidentes) usada durante o desenvolvimento. Nenhum testimonial, case study ou material de marketing existe ou deve ser inventado — este é um produto interno de operação, não uma superfície de aquisição.

## Product Principles

1. O número certo importa mais que o visual bonito — qualquer escolha de UI deve preservar a exatidão do motor de SLA/TMA herdado do app Python original.
2. Densidade de dados com legibilidade: esta é uma ferramenta de leitura de tabelas e séries mensais por uma equipe técnica, não uma superfície de conversão — priorizar escaneabilidade sobre expressão.
3. Edição in-line é uma função central (Macro/Categoria/Subcategoria/Descrição), não um extra — deve ser óbvia e seguramente reversível a qualquer momento.
4. Consistência entre as 9 telas: mesmo padrão de filtro, período, paginação e exportação de gráfico em todas as abas.

## Accessibility & Inclusion

Nenhum requisito formal documentado. Seguir boas práticas gerais de contraste e legibilidade (WCAG AA como referência de bom senso), sem exigência contratual específica conhecida.
