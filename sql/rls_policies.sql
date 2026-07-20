-- Restringe o que a chave pública (anon) do Supabase pode fazer.
-- Objetivo: o executável distribuído para as máquinas dos usuários usa a
-- chave "anon", NÃO a service_role — então mesmo que alguém extraia a
-- chave do binário, o acesso fica limitado ao que está definido aqui
-- (sem DROP/TRUNCATE, sem acesso a outras tabelas do projeto, sem apagar
-- histórico de incidentes).
--
-- Rodar uma vez no SQL Editor do Supabase, depois de sql/schema.sql.

alter table incidentes enable row level security;
alter table dias_nao_uteis enable row level security;

-- incidentes: a chave pública pode ler, inserir e atualizar (upsert),
-- mas nunca apagar — protege o histórico contra deleção acidental/maliciosa.
drop policy if exists "incidentes_select_anon" on incidentes;
create policy "incidentes_select_anon" on incidentes
    for select to anon using (true);

drop policy if exists "incidentes_insert_anon" on incidentes;
create policy "incidentes_insert_anon" on incidentes
    for insert to anon with check (true);

drop policy if exists "incidentes_update_anon" on incidentes;
create policy "incidentes_update_anon" on incidentes
    for update to anon using (true) with check (true);

-- dias_nao_uteis: tabela de baixo risco (só datas/motivos cadastrados
-- manualmente pela equipe) — a chave pública pode gerenciar livremente.
drop policy if exists "dias_nao_uteis_all_anon" on dias_nao_uteis;
create policy "dias_nao_uteis_all_anon" on dias_nao_uteis
    for all to anon using (true) with check (true);
