---
name: Analisador AMS
description: Quadro de distribuição elétrica como console de SLA/TMA para a operação AMS RadSync
colors:
  brass:
    canonical-dark: "#c8963f"
    canonical-light: "#a3701f"
  circuit-cyan:
    canonical-dark: "#4fb8c4"
    canonical-light: "#0f7c88"
  violet-lamp:
    canonical-dark: "#9884d6"
    canonical-light: "#6a55ad"
  amber-lamp:
    canonical-dark: "#e0a83f"
    canonical-light: "#a8730f"
  signal-red:
    canonical-dark: "#dd5340"
    canonical-light: "#b23a26"
  lamp-green:
    canonical-dark: "#52b565"
    canonical-light: "#2f7d42"
  chassis-ink:
    canonical-dark: "#0e0f10"
    canonical-light: "#26241f"
  plate-paper:
    canonical-dark: "#1b1c1e"
    canonical-light: "#ece8dd"
  plate-paper-raised:
    canonical-dark: "#232427"
    canonical-light: "#f8f6f0"
  engraved-text:
    canonical-dark: "#e9e6dd"
    canonical-light: "#211f1a"
  fog:
    canonical-dark: "#9a9d9f"
    canonical-light: "#6f6a5f"
  hairline:
    canonical-dark: "#38393c"
    canonical-light: "#d8d2c0"
typography:
  display:
    fontFamily: "Oswald, sans-serif"
    fontWeight: 600
    letterSpacing: "0.06em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 500
rounded:
  sm: "2px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  breaker-tab-active:
    backgroundColor: "{colors.chassis-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  breaker-tab-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.fog}"
    rounded: "{rounded.sm}"
  mounted-plate:
    backgroundColor: "{colors.plate-paper-raised}"
    textColor: "{colors.engraved-text}"
    rounded: "{rounded.sm}"
---

# Design System: Analisador AMS

## Overview

**Creative North Star: "O Quadro de Distribuição"**

O Analisador AMS não é um dashboard de BI genérico — é o próprio quadro de distribuição elétrica que os analistas de AMS enxergam todos os dias em campo, traduzido em interface. Chumbo escovado, placas latonadas parafusadas, disjuntores como navegação, lâmpadas piloto verde/âmbar/vermelho como a linguagem de status de SLA, e medidores analógicos como indicadores de KPI. A referência não é nenhum dashboard SaaS: é a caixa de força que cobre um andar inteiro do escritório operacional da distribuidora.

O sistema roda em modo escuro por padrão ("painel fechado" — chumbo escuro com lâmpadas acesas), com uma variante clara opcional ("painel aberto" — gabinete esmaltado sob luz de dia), alternada por um interruptor físico no cabeçalho, não pelo `prefers-color-scheme` do sistema.

Rejeitado deliberadamente: o console de instrumentos genérico cor de cobre sobre grafite da primeira versão deste dashboard, e o padrão-categoria de dashboard SaaS (barra lateral, cards com sombra suave, azul/verde/laranja default).

**Key Characteristics:**
- Placas mantidas por parafusos de fenda desenhados nos quatro cantos (`.screwed`), reservado a Panel/Kpi e ao card de estado vazio — não replicado em toda superfície.
- Navegação por abas como fileira de disjuntores numerados, cada um com lâmpada piloto que acende quando ativo.
- Cores de status (verde/âmbar/vermelho) nunca usadas para identidade de distribuidora; CE/RJ/SP usam latão/ciano/violeta.
- Números sempre em monoespaçada tabular — leitura de instrumento, nunca proporcional.

## Colors

Paleta "Full palette": quatro papéis nomeados sobre chassi escuro, mais três cores de lâmpada piloto reservadas exclusivamente à semântica de status.

### Primary
- **Latão (Brass)** (`#c8963f` escuro / `#a3701f` claro): acento primário — placas gravadas, disjuntor de período ativo, ícone da marca.

### Secondary
- **Ciano de Circuito** (`#4fb8c4` escuro / `#0f7c88` claro): acento secundário — linha "Mínimo" nos gráficos de extremos, DX = RJ.
- **Violeta de Lâmpada** (`#9884d6` escuro / `#6a55ad` claro): DX = SP, reservado para não colidir com as cores de status.

### Neutral
- **Chassi (Ink)** (`#0e0f10` escuro / `#26241f` claro): fascia do cabeçalho e trilho de disjuntores — sempre o tom mais escuro do sistema, mesmo no modo claro.
- **Placa (Paper)** (`#1b1c1e` escuro / `#ece8dd` claro): fundo de trabalho onde tabelas e gráficos ficam montados.
- **Placa Elevada** (`#232427` escuro / `#f8f6f0` claro): superfície de cards/painéis (Panel, Kpi).
- **Tinta Gravada** (`#e9e6dd` escuro / `#211f1a` claro): texto primário — sempre o inverso do fundo, nunca cinza puro.
- **Névoa (Fog)** (`#9a9d9f` escuro / `#6f6a5f` claro): texto secundário, legendas, placeholders.
- **Linha de Rasgo (Hairline)** (`#38393c` escuro / `#d8d2c0` claro): toda borda e grade de gráfico.

### Named Rules
**The Lamp Semantics Rule.** Verde (`--color-lamp-green`), âmbar (`--color-amber`) e vermelho (`--color-signal`) são reservados exclusivamente a estado (sucesso/atenção/erro/breach de SLA). Nunca usar essas três cores para identidade decorativa, marca ou DX.

## Typography

**Display Font:** Oswald (com fallback sans-serif) — caixa condensada industrial, a fonte de placa de equipamento gravada.
**Body Font:** IBM Plex Sans — legibilidade em texto corrido e formulários.
**Label/Mono Font:** IBM Plex Mono — todo número (chamados, SLA, TMA, KPIs, eixos de gráfico) é tabular-mono, efeito "leitura de instrumento".

**Character:** Oswald fornece a voz de placa gravada/rótulo de painel; IBM Plex Sans mantém a legibilidade de trabalho nas descrições e filtros; IBM Plex Mono garante que toda coluna numérica alinhe como um mostrador digital.

### Hierarchy
- **Display** (600, `text-xl`–`text-2xl`, tracking 0.02–0.06em, uppercase em rótulos de placa): títulos de aba, rótulos de painel, texto de disjuntor.
- **Label** (500–600, `text-[10px]`–`text-xs`, tracking 0.06–0.1em, uppercase): rótulos de filtro, cabeçalho de tabela, eyebrow de cada aba.
- **Body** (400, `text-sm`): parágrafos, mensagens, descrições de chamado.
- **Mono/Numérico** (400–600, tabular-nums): todo valor numérico e toda coluna de tabela editável.

### Named Rules
**The Tabular Numerals Rule.** Nenhum número de negócio (SLA, TMA, contagem, data) é renderizado em fonte proporcional. Se é um dado, é monoespaçado.

## Layout

Container principal `max-w-7xl` centralizado. Cabeçalho fixo em duas camadas: fascia (marca + upload + tema) e barramento de disjuntores (navegação). Conteúdo em pilha vertical de painéis (`space-y-6`), cada painel ocupando a largura total do container — sem grid de cards lado a lado para gráficos, priorizando leitura sequencial de cima para baixo (volumetria → detalhe). Densidade alta nas tabelas (linhas de ~28px), respiro maior entre painéis (24px).

## Elevation & Depth

Sistema majoritariamente plano — sem `box-shadow` difuso. Profundidade é sugerida por parafusos de canto (`.screwed`), bisel interno sutil (`shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`) e pela diferença tonal entre chassi (mais escuro) e placa (mais clara), como painéis metálicos montados sobre um gabinete.

### Named Rules
**The Bolted-Not-Floating Rule.** Nada "flutua" sobre um fundo com sombra suave. Toda superfície elevada é uma placa aparafusada sobre o chassi — borda + parafuso, nunca `box-shadow` genérico.

## Shapes

Cantos quase retos (`rounded-sm` = 2px) em todo lugar — nada de `rounded-xl`/`rounded-full` exceto nas lâmpadas piloto (círculos) e no trilho de tema (pill). Bordas de 1px em `--color-line` delimitam toda placa. Disjuntores de navegação e chips de DX usam cantos levemente arredondados (2px) para sugerir corpo de switch físico, nunca pill shape.

## Components

### Painéis (Panel / Kpi)
- **Forma:** `rounded-sm`, borda `border-line`, 4 parafusos de fenda latonados nos cantos (`.screwed`).
- **Entrada:** animação `panel-in`/`gauge-mount` (settle suave, ~0.35–0.5s, respeita `prefers-reduced-motion`).
- **Kpi:** lâmpada piloto no canto superior direito (cor = accent semântico), valor grande em mono tabular.

### Disjuntores (navegação de abas)
- **Forma:** retângulo estreito com lâmpada piloto acima do rótulo e número de posição abaixo (`01`–`09`).
- **Ativo:** borda latão, fundo `ink-raised`, lâmpada verde acesa com `lamp-flicker`.
- **Inativo:** borda translúcida, texto `white/45`, lâmpada apagada.
- **Interação:** `.toggle-throw` — leve scale-down de 0.18s ao clicar, simulando o "clique" físico do disjuntor.

### Interruptor de tema (ThemeToggle)
- **Estilo:** rocker switch em miniatura (trilho + êmbolo deslizante), rotulado "Painel aberto" / "Painel fechado" em vez de "claro"/"escuro".

### Botão de upload
- **Estilo:** mesmo corpo de disjuntor; lâmpada verde acende e permanece por ~900ms após sucesso, comunicando "circuito fechado com sucesso".

### Seletor de período (PeriodSelect)
- **Estilo:** trilho de segmentos sobre fundo `ink`, cada posição um botão retangular; o segmento ativo recebe fundo latão com bisel interno, como uma chave rotativa multi-posição.

### Tabelas (EditableTable)
- **Cabeçalho:** placa `ink`, rótulos mono uppercase brancos translúcidos, ordenação por clique com indicador ▲/▼/⇅.
- **Linhas:** listradas com overlay branco 2% de opacidade (nunca preto — o fundo já é escuro).
- **Chips de DX:** pílula pequena mono, cor = latão (CE) / ciano (RJ) / violeta (SP) / cinza (Outros).

### Gráficos
- Grade e eixos em `--color-line`/`--color-fog`; séries em latão/ciano/violeta para DX, latão para métricas primárias, âmbar/ciano para extremos máx/mín.
- Todo valor é rotulado diretamente no gráfico (`LabelList`), nunca dependente apenas de hover.

## Do's and Don'ts

### Do:
- **Do** reservar verde/âmbar/vermelho exclusivamente para semântica de status/SLA.
- **Do** usar `.screwed` apenas em Panel e Kpi — é a assinatura visual do sistema, não um efeito a espalhar em todo elemento.
- **Do** manter todo número em `font-mono` com `tabular-nums`.
- **Do** default para o tema escuro ("painel fechado"); o claro é a variante, não o padrão.

### Don't:
- **Don't** usar `box-shadow` difuso solto — profundidade vem de borda + parafuso + diferença tonal chassi/placa.
- **Don't** usar azul/verde/laranja genéricos de dashboard para as cores de DX (CE/RJ/SP) — são latão/ciano/violeta.
- **Don't** aplicar a animação `toggle-throw` em elementos que não sejam controles de clique único (disjuntores, botões, interruptor) — não usar em cards ou texto.
- **Don't** trocar Oswald por uma sans-serif genérica (Inter, Space Grotesk) nos títulos — a voz de placa gravada é a identidade tipográfica do sistema.
