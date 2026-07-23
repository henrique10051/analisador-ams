# Integração com ServiceNow — plano de implementação

Guia de contexto para retomar esse trabalho depois, ou colar em uma conversa nova. Documenta a decisão tomada e o desenho da solução para trazer incidentes das filas TIBCO e ForceBeat ao vivo para o dashboard, enquanto a API oficial do ServiceNow não é liberada pela TI (previsão: ~1 mês a partir de 2026-07-23).

## Objetivo final (quando a API oficial existir)

- Dashboard com incidentes abertos ao vivo: contagem de SLA, tempo em aberto, responsável atual, tempo restante até o SLA vencer.
- Escrita de volta no ServiceNow: editar `short description` e `resolution notes` diretamente pela nossa aplicação.
- Autenticação via usuário de serviço com OAuth2/API key (Application Registry do ServiceNow), configurado pela TI — não usa credencial pessoal.

## Situação atual (bloqueio)

- Ainda não existe acesso de API liberado pela TI.
- O usuário tem acesso via login normal (usuário/senha) às filas TIBCO e ForceBeat.
- 2FA do login é via **SMS ou e-mail com código** — não é TOTP, então não dá para gerar o código programaticamente. Login 100% automatizado (do zero, a cada execução) não é viável sem acesso à caixa de SMS/e-mail, e não é desejável guardar senha + lidar com esse fluxo.

## Decisão: sessão de navegador persistente (solução ponte)

Em vez de automatizar o login inteiro, a aplicação reaproveita uma sessão já autenticada manualmente pelo usuário:

1. **Login manual único**: o usuário loga normalmente no ServiceNow (usuário/senha + código SMS/e-mail), como já faz hoje.
2. **Captura da sessão**: um script (Playwright) abre o navegador, guia o login manual (ou reaproveita um profile de navegador já logado) e extrai os cookies/token de sessão válidos.
3. **Persistência**: os cookies de sessão são salvos localmente (arquivo, não versionado — nunca commitar), com timestamp de captura.
4. **Coleta periódica**: um job (rodando localmente ou em um servidor pequeno, não na Vercel — precisa manter estado de sessão do navegador) usa essa sessão salva para:
   - Chamar a Table API do ServiceNow (`/api/now/table/incident`, filtrando pelas filas TIBCO/ForceBeat) se a sessão tiver escopo suficiente, **ou**
   - Fazer scraping das telas de lista/incidente, se a API não estiver acessível via sessão de usuário comum.
5. **Detecção de expiração**: se uma chamada retornar erro de autenticação (sessão expirada), o job para de tentar, marca o status como "sessão expirada" e avisa o usuário (ex: badge no dashboard, ou notificação) para relogar manualmente. Sem retry automático de login.
6. **Ingestão no dashboard**: os dados coletados alimentam uma tabela própria no Supabase (separada da tabela `incidentes` de upload manual, ou uma flag `origem: servicenow_live`), e o front-end consome isso para montar o card de "incidentes abertos ao vivo".

## Cálculo de SLA / tempo restante

- Se a sessão de usuário conseguir acessar a Table API, o ServiceNow já expõe SLA via tabela `task_sla` (percentual consumido, prazo, breach time) — preferir usar esse dado pronto em vez de recalcular na mão.
- Se só scraping de tela for possível, extrair os campos visíveis (SLA due, business time left) direto do HTML renderizado da tela de incidente/lista.
- Persistir o "tempo restante" como timestamp absoluto de vencimento (não como contagem regressiva estática), para o front recalcular o countdown em tempo real no client.

## Escopo desta fase (só leitura)

- **Sem escrita** nesta fase — a automação de sessão só lê incidentes/SLA. Editar `short description`/`resolution notes` fica para quando a API oficial (com usuário de serviço e permissões auditáveis) estiver disponível.
- Motivo: escrever no ServiceNow usando uma sessão pessoal automatizada tornaria qualquer edição indistinguível de uma ação manual do usuário, o que é arriscado em caso de bug e difícil de auditar.

## Segurança / o que não fazer

- Não guardar usuário/senha do ServiceNow na aplicação.
- Não tentar automatizar a leitura do código SMS/e-mail (ex: integrar com caixa de e-mail para extrair OTP) — aumenta a superfície de risco em vez de reduzir.
- Cookies de sessão salvos localmente devem ficar fora do controle de versão (adicionar ao `.gitignore`) e, idealmente, criptografados em repouso se o job rodar em um servidor compartilhado.
- Tratar essa integração como **temporária**: ao liberar a API oficial, desligar o job de sessão de navegador e migrar para OAuth2/API key com usuário de serviço.

## Perguntas em aberto para quando formos implementar

- Onde o job de coleta vai rodar (máquina local do usuário, um servidor sempre ligado, ou algum cron gerenciado)? A Vercel (serverless, sem estado persistente de navegador) não serve para isso.
- Qual a duração típica da sessão do ServiceNow antes de expirar, na prática?
- A sessão de usuário comum tem acesso à Table API (`/api/now/table/...`), ou só às telas renderizadas (exigindo scraping)?
- Qual o volume esperado de incidentes simultâneos nas filas TIBCO/ForceBeat, para dimensionar a frequência de polling sem sobrecarregar o ServiceNow.
