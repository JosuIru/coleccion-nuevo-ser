-- Migration: Fase 5 - Persistencia de IA avanzada
-- Crea tablas para misiones, conversaciones y logs de actividad + vistas/funciones auxiliares.

create table if not exists ai_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  mission_name text not null,
  source text not null,
  parameters jsonb not null default '{}'::jsonb,
  status text not null default 'generated',
  score int null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_missions_user_id on ai_missions(user_id);
create index if not exists idx_ai_missions_status on ai_missions(status);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references ai_missions(id) on delete set null,
  user_id uuid not null references auth.users(id),
  message text not null,
  role text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_user_id on ai_conversations(user_id);
create index if not exists idx_ai_conversations_mission_id on ai_conversations(mission_id);
create index if not exists idx_ai_conversations_created_at on ai_conversations(created_at desc);

create table if not exists ai_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  feature text not null,
  credits_used int not null,
  outcome text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_activity_log_user_id on ai_activity_log(user_id);
create index if not exists idx_ai_activity_log_created_at on ai_activity_log(created_at desc);

create or replace function fn_ai_update_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql stable;

drop trigger if exists trg_ai_missions_update_at on ai_missions;

create trigger trg_ai_missions_update_at
  before update on ai_missions
  for each row
  execute function fn_ai_update_timestamp();

drop materialized view if exists ai_missions_summary;
drop view if exists ai_missions_summary;

create or replace view ai_missions_summary as
select
  user_id,
  count(*) filter (where status = 'generated') as missions_generated,
  count(*) filter (where status = 'completed') as missions_completed,
  count(*) filter (where status = 'active') as missions_active,
  sum(score) filter (where score is not null) as total_score,
  max(updated_at) as last_update
from ai_missions
group by user_id;

grant select on ai_missions_summary to authenticated;

comment on table ai_missions is 'Misiones dinámicas generadas por el Game Master IA';
comment on table ai_conversations is 'Mensajes entre el jugador y los NPC del Game Master';
comment on table ai_activity_log is 'Eventos de consumo de recursos IA, útil para dashboards';

drop view if exists ai_active_users;

create view ai_active_users as
  select user_id, count(*) as mission_count
  from ai_missions
  where updated_at >= now() - interval '7 days'
  group by user_id;
