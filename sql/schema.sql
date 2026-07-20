-- Analisador AMS - schema do Supabase
-- Rodar uma vez no SQL Editor do projeto Supabase.

create table if not exists incidentes (
    number              text primary key,
    service             text,
    opened              timestamptz,
    resolved            timestamptz,
    short_description   text,
    state               text,
    priority            text,
    assignment_group    text,
    ict_service         text,
    assigned_to         text,
    close_code          text,
    close_notes         text,
    reopen_count        integer,
    empresa             text,
    macro               text,
    categoria           text,
    subcategoria        text,
    descricao_tratada   text,
    sla_dias            numeric,
    tma_dias            numeric,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists idx_incidentes_resolved on incidentes (resolved);
create index if not exists idx_incidentes_opened on incidentes (opened);
create index if not exists idx_incidentes_empresa on incidentes (empresa);

-- Dias em que o AMS não trabalhou mas não estão no calendário de feriados
-- padrão (pontes, paralisações, etc). Usado para excluir do cálculo de SLA.
create table if not exists dias_nao_uteis (
    id          bigint generated always as identity primary key,
    data        date not null unique,
    motivo      text,
    criado_em   timestamptz not null default now()
);

-- mantém updated_at em dia a cada upsert
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incidentes_updated_at on incidentes;
create trigger trg_incidentes_updated_at
    before update on incidentes
    for each row
    execute function set_updated_at();
