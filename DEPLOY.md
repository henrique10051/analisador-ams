# Deploy do Analisador AMS na Vercel

Guia de contexto para preparar e executar o deploy. Este arquivo foi escrito para ser colado em uma conversa nova com o Claude (ou lido por qualquer pessoa) que vai cuidar da etapa de deploy — traz tudo que precisa saber sobre o estado atual do projeto sem precisar reconstruir o contexto.

## O que é o projeto

Dashboard interno (Next.js 16 / App Router / TypeScript) para a operação de AMS (Application Management Services) do contrato "RadSync", cobrindo três distribuidoras de energia: CE, RJ, SP. Migrado de um app Streamlit (Python) original — o código Python antigo ainda está na raiz do repo como referência, mas **não é mais o que vai para produção**. O app novo vive inteiramente em `web/`.

Documentação de produto/design já existente no repo (vale ler antes de mexer em UI):
- `PRODUCT.md` — contexto de produto, usuários, diferencial.
- `DESIGN.md` — sistema de design ("quadro de distribuição elétrica" — modo escuro por padrão, disjuntores como navegação, medidores analógicos como KPI). Qualquer ajuste visual deve seguir esse arquivo.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- Tailwind CSS v4 (tokens via `@theme inline` em `web/app/globals.css`).
- Supabase (Postgres) como banco — tabelas `incidentes` e `dias_nao_uteis` (schema em `sql/schema.sql`, políticas em `sql/rls_policies.sql`).
- `@google/generative-ai` (Gemini) para a aba Chat IA.
- `recharts`, `xlsx`, `papaparse`, `html-to-image`.

## Estrutura relevante

```
analisador-ams/                  ← raiz do repositório
├── PRODUCT.md, DESIGN.md        ← contexto de produto e design (ler antes de UI)
├── sql/schema.sql               ← schema do Supabase (rodar 1x no SQL editor do projeto)
├── sql/rls_policies.sql         ← políticas de RLS
├── app.py, abas/, ...           ← app Python antigo (Streamlit) — NÃO é o que deploya
└── web/                         ← projeto Next.js que vai para a Vercel
    ├── app/
    │   ├── page.tsx             ← página única, 9 abas (client-side)
    │   ├── layout.tsx           ← fontes + script anti-flash de tema (dark/light)
    │   └── api/
    │       ├── upload/route.ts          ← recebe CSV/XLSX, processa, upsert em lote
    │       ├── incidentes/route.ts      ← GET carrega base / PATCH edita campos
    │       ├── incidente-manual/route.ts← cadastro avulso de 1 chamado
    │       ├── dias-nao-uteis/route.ts  ← CRUD do calendário de dias não úteis
    │       └── chat/route.ts            ← proxy para Gemini
    ├── lib/                     ← lógica de negócio (SLA/TMA, Supabase, parsing)
    ├── components/              ← componentes de UI compartilhados
    └── .env.local               ← env vars locais (NÃO versionado, ver abaixo)
```

## Variáveis de ambiente necessárias

Três variáveis, usadas apenas no servidor (nenhuma prefixada com `NEXT_PUBLIC_`, então não vazam pro client):

| Variável | Onde usar | Onde conseguir |
|---|---|---|
| `SUPABASE_URL` | `web/lib/supabase.ts` | Painel do Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | `web/lib/supabase.ts` | Painel do Supabase → Project Settings → API → chave `anon public` (restrita por RLS, ver `sql/rls_policies.sql`) |
| `GEMINI_API_KEY` | `web/app/api/chat/route.ts` | Google AI Studio → gerar uma chave **nova** |

**Importante sobre a chave do Gemini**: a chave original deste projeto (usada no app Python) ficou em algum momento commitada no histórico do git (`.streamlit/secrets.toml`), então está considerada exposta. **Gere uma chave nova** no Google AI Studio antes do deploy e use só essa — não reaproveitar a antiga.

Essas três variáveis já existem localmente em `web/.env.local` (git-ignorado). Para configurar na Vercel: Project Settings → Environment Variables → adicionar as três, nos ambientes Production/Preview/Development conforme necessário.

## Passo a passo do deploy

1. **Banco**: confirmar que o schema já está aplicado no projeto Supabase (rodar `sql/schema.sql` e `sql/rls_policies.sql` no SQL editor, se ainda não foi feito — plausivelmente já foi, já que a base já tem ~3.600 incidentes reais carregados durante o desenvolvimento).
2. **Repositório**: garantir que o repo está no GitHub/GitLab/Bitbucket conectável à Vercel (confirmar com o usuário se já está, e se pode dar push do estado atual).
3. **Criar o projeto na Vercel** apontando para este repositório.
4. **Root Directory**: configurar como `web/` (o projeto Next.js não está na raiz do repo — isso é o ponto mais fácil de esquecer).
5. **Framework Preset**: Vercel deve detectar Next.js automaticamente ao apontar o Root Directory certo. Build Command/Install Command podem ficar nos defaults (`next build` / `npm install`).
6. **Environment Variables**: adicionar as três da tabela acima.
7. **Deploy.**
8. **Pós-deploy**, testar manualmente:
   - Página carrega e lista os incidentes já existentes na base (GET `/api/incidentes`).
   - Upload de um CSV/XLSX pequeno sincroniza corretamente (POST `/api/upload`).
   - Cadastro manual de 1 chamado funciona (POST `/api/incidente-manual`).
   - Aba Chat IA responde (depende da `GEMINI_API_KEY` nova estar configurada).
   - Alternância de tema claro/escuro persiste ao recarregar (usa `localStorage`).

## Pontos de atenção técnicos

- **Duração das funções serverless**: as rotas `upload`, `incidentes` e `chat` têm `export const maxDuration = 60` (60 segundos). No plano **Hobby** da Vercel, o limite real pode ser menor dependendo do plano/runtime vigente na conta — vale confirmar o plano do usuário e, se for Hobby, testar upload do CSV grande (`incident (1).csv`, ~19 mil linhas) para garantir que não estoura o tempo. Se estourar, considerar processar em lotes menores ou avisar o usuário sobre upgrade de plano.
- **Tamanho de payload de upload**: Vercel tem limite de tamanho de corpo de requisição para Serverless Functions (varia por plano, historicamente ~4.5MB no Hobby). Um CSV muito grande pode esbarrar nisso — se acontecer, a solução é migrar o upload para ler o arquivo direto no client e enviar em chunks, ou usar upload direto pro Supabase Storage. Não implementado ainda; só implementar se o teste real mostrar que é necessário.
- **`runtime = "nodejs"`**: todas as API routes já estão marcadas explicitamente com esse runtime (não Edge), necessário porque usam `xlsx`/`papaparse`/SDKs Node-only.
- Não há autenticação no app — qualquer pessoa com a URL pública consegue ver e editar dados. Se isso for um problema para o deploy público, é uma conversa a ter com o usuário antes (Vercel tem proteção por senha/SSO em planos pagos, ou dá pra adicionar auth própria depois).

## O que não fazer sem perguntar

- Não reaproveitar a chave antiga do Gemini.
- Não fazer force-push nem mudar histórico do git.
- Não remover o código Python da raiz sem confirmar com o usuário (ele pode querer manter como referência/arquivo por enquanto).
