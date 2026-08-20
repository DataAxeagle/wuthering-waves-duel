create extension if not exists pgcrypto;

create table if not exists public.pvp_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  invite_hash text not null,
  status text not null default 'waiting' check (status in ('waiting','in_game','ended','abandoned')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  winner_seat smallint check (winner_seat in (0,1)),
  result_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  ended_at timestamptz
);

create table if not exists public.pvp_room_members (
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat smallint not null check (seat in (0,1)),
  display_name text not null check (char_length(display_name) between 1 and 16),
  avatar_id text not null default '',
  deck_name text,
  ready boolean not null default false,
  resume_hash text not null,
  last_seen_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, seat)
);

create table if not exists public.pvp_deck_submissions (
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  deck jsonb not null,
  ruleset_version text not null,
  submitted_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.pvp_matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.pvp_rooms(id) on delete cascade,
  ruleset_version text not null,
  state jsonb not null,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pvp_player_views (
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid references public.pvp_matches(id) on delete cascade,
  version bigint not null default 0,
  view jsonb not null default '{}'::jsonb,
  event jsonb,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.pvp_action_receipts (
  match_id uuid not null references public.pvp_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid not null,
  version bigint not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id, action_id)
);

create index if not exists pvp_rooms_expiry_idx on public.pvp_rooms (expires_at);
create index if not exists pvp_members_user_idx on public.pvp_room_members (user_id);
create index if not exists pvp_members_last_seen_idx on public.pvp_room_members (last_seen_at);

alter table public.pvp_rooms enable row level security;
alter table public.pvp_room_members enable row level security;
alter table public.pvp_deck_submissions enable row level security;
alter table public.pvp_matches enable row level security;
alter table public.pvp_player_views enable row level security;
alter table public.pvp_action_receipts enable row level security;

create or replace function public.is_pvp_room_member(p_room_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.pvp_room_members where room_id=p_room_id and user_id=(select auth.uid()));
$$;
revoke all on function public.is_pvp_room_member(uuid) from public, anon;
grant execute on function public.is_pvp_room_member(uuid) to authenticated;

drop policy if exists "room members read room" on public.pvp_rooms;
drop policy if exists "room members read members" on public.pvp_room_members;

drop policy if exists "players read own projected state" on public.pvp_player_views;
create policy "players read own projected state" on public.pvp_player_views for select to authenticated
using (user_id = (select auth.uid()));

-- Raw decks, authoritative match state and receipts intentionally have no client policies.
-- All writes go through the service-role Edge Function.

do $$
begin
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then raise exception 'supabase_realtime publication missing'; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='pvp_player_views') then
    alter publication supabase_realtime add table public.pvp_player_views;
  end if;
end $$;
alter table public.pvp_player_views replica identity full;

create or replace function public.set_pvp_ready(
  p_room_id uuid,
  p_user_id uuid,
  p_deck jsonb,
  p_ruleset_version text,
  p_ready boolean,
  p_deck_name text
) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_status text; v_ready_count integer;
begin
  select status into v_status from public.pvp_rooms where id=p_room_id for update;
  if not found or v_status<>'waiting' then raise exception 'room_not_waiting'; end if;
  perform 1 from public.pvp_room_members where room_id=p_room_id and user_id=p_user_id for update;
  if not found then raise exception 'not_room_member'; end if;
  insert into public.pvp_deck_submissions(room_id,user_id,deck,ruleset_version,submitted_at)
  values(p_room_id,p_user_id,p_deck,p_ruleset_version,now())
  on conflict(room_id,user_id) do update set deck=excluded.deck,ruleset_version=excluded.ruleset_version,submitted_at=now();
  update public.pvp_room_members set ready=p_ready,deck_name=p_deck_name,last_seen_at=now() where room_id=p_room_id and user_id=p_user_id;
  update public.pvp_player_views set event=jsonb_build_object('type','ready_changed','at',now()),updated_at=now() where room_id=p_room_id;
  update public.pvp_rooms set updated_at=now(),expires_at=now()+interval '30 minutes' where id=p_room_id;
  select count(*) into v_ready_count from public.pvp_room_members where room_id=p_room_id and ready;
  return v_ready_count=2;
end $$;
revoke all on function public.set_pvp_ready(uuid,uuid,jsonb,text,boolean,text) from public,anon,authenticated;
grant execute on function public.set_pvp_ready(uuid,uuid,jsonb,text,boolean,text) to service_role;

create or replace function public.start_pvp_match(
  p_room_id uuid,
  p_ruleset_version text,
  p_state jsonb,
  p_view_zero jsonb,
  p_view_one jsonb,
  p_deck_zero jsonb,
  p_deck_one jsonb
) returns table(started boolean, match_id uuid)
language plpgsql security definer set search_path=public as $$
declare
  v_status text; v_match_id uuid; v_user_zero uuid; v_user_one uuid;
  v_deck_zero jsonb; v_deck_one jsonb; v_ready_count integer;
begin
  select status into v_status from public.pvp_rooms where id=p_room_id for update;
  if not found or v_status <> 'waiting' then return query select false, null::uuid; return; end if;
  perform 1 from public.pvp_room_members where room_id=p_room_id for update;
  select count(*) into v_ready_count from public.pvp_room_members where room_id=p_room_id and ready;
  if v_ready_count <> 2 then return query select false, null::uuid; return; end if;
  select m.user_id,d.deck into v_user_zero,v_deck_zero from public.pvp_room_members m join public.pvp_deck_submissions d using(room_id,user_id) where m.room_id=p_room_id and m.seat=0 and d.ruleset_version=p_ruleset_version;
  select m.user_id,d.deck into v_user_one,v_deck_one from public.pvp_room_members m join public.pvp_deck_submissions d using(room_id,user_id) where m.room_id=p_room_id and m.seat=1 and d.ruleset_version=p_ruleset_version;
  if v_user_zero is null or v_user_one is null or v_deck_zero is distinct from p_deck_zero or v_deck_one is distinct from p_deck_one then return query select false, null::uuid; return; end if;
  insert into public.pvp_matches(room_id,ruleset_version,state) values(p_room_id,p_ruleset_version,p_state) returning id into v_match_id;
  insert into public.pvp_player_views(room_id,user_id,match_id,version,view,event,updated_at) values
    (p_room_id,v_user_zero,v_match_id,1,p_view_zero,jsonb_build_object('type','match_started'),now()),
    (p_room_id,v_user_one,v_match_id,1,p_view_one,jsonb_build_object('type','match_started'),now())
  on conflict(room_id,user_id) do update set match_id=excluded.match_id,version=1,view=excluded.view,event=excluded.event,updated_at=now();
  update public.pvp_rooms set status='in_game',updated_at=now(),expires_at=now()+interval '30 minutes' where id=p_room_id;
  return query select true,v_match_id;
end $$;
revoke all on function public.start_pvp_match(uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.start_pvp_match(uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;

create or replace function public.commit_pvp_state(
  p_match_id uuid,
  p_expected_version bigint,
  p_actor_id uuid,
  p_action_id uuid,
  p_state jsonb,
  p_result jsonb,
  p_view_zero jsonb,
  p_view_one jsonb,
  p_event_zero jsonb,
  p_event_one jsonb,
  p_winner_seat smallint
) returns table(new_version bigint, duplicate boolean, stored_result jsonb)
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_version bigint;
  v_user_zero uuid;
  v_user_one uuid;
  v_receipt public.pvp_action_receipts%rowtype;
begin
  select * into v_receipt from public.pvp_action_receipts
  where match_id = p_match_id and user_id = p_actor_id and action_id = p_action_id;
  if found then
    return query select v_receipt.version, true, v_receipt.result;
    return;
  end if;

  select room_id into v_room_id from public.pvp_matches where id=p_match_id;
  if v_room_id is null then raise exception 'match_not_found'; end if;
  perform 1 from public.pvp_rooms where id=v_room_id and status='in_game' for update;
  if not found then raise exception 'match_ended'; end if;
  if not exists(select 1 from public.pvp_room_members where room_id=v_room_id and user_id=p_actor_id) then raise exception 'not_room_member'; end if;
  select * into v_receipt from public.pvp_action_receipts where match_id=p_match_id and user_id=p_actor_id and action_id=p_action_id;
  if found then return query select v_receipt.version,true,v_receipt.result; return; end if;

  update public.pvp_matches
     set state = p_state, version = version + 1, updated_at = now()
   where id = p_match_id and version = p_expected_version
   returning version into v_version;
  if not found then
    select * into v_receipt from public.pvp_action_receipts where match_id=p_match_id and user_id=p_actor_id and action_id=p_action_id;
    if found then return query select v_receipt.version,true,v_receipt.result; return; end if;
    raise exception 'stale_version' using errcode = '40001';
  end if;

  select user_id into v_user_zero from public.pvp_room_members where room_id = v_room_id and seat = 0;
  select user_id into v_user_one from public.pvp_room_members where room_id = v_room_id and seat = 1;
  if v_user_zero is null or v_user_one is null then raise exception 'room_not_full'; end if;

  insert into public.pvp_player_views(room_id,user_id,match_id,version,view,event,updated_at)
  values
    (v_room_id,v_user_zero,p_match_id,v_version,p_view_zero,p_event_zero,now()),
    (v_room_id,v_user_one,p_match_id,v_version,p_view_one,p_event_one,now())
  on conflict (room_id,user_id) do update set match_id=excluded.match_id, version=excluded.version, view=excluded.view, event=excluded.event, updated_at=now();

  insert into public.pvp_action_receipts(match_id,user_id,action_id,version,result)
  values (p_match_id,p_actor_id,p_action_id,v_version,p_result);
  update public.pvp_room_members set last_seen_at=now() where room_id=v_room_id and user_id=p_actor_id;
  if p_winner_seat in (0,1) then
    update public.pvp_rooms set status='ended',winner_seat=p_winner_seat,result_reason='game',ended_at=now(),updated_at=now(),expires_at=now()+interval '24 hours' where id=v_room_id and status='in_game';
  else
    update public.pvp_rooms set updated_at=now(),expires_at=now()+interval '30 minutes' where id=v_room_id and status='in_game';
  end if;
  return query select v_version, false, p_result;
end $$;

revoke all on function public.commit_pvp_state(uuid,bigint,uuid,uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,smallint) from public, anon, authenticated;
grant execute on function public.commit_pvp_state(uuid,bigint,uuid,uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,smallint) to service_role;

create or replace function public.finish_pvp_room(p_room_id uuid,p_actor_id uuid,p_reason text)
returns smallint language plpgsql security definer set search_path=public as $$
declare v_status text; v_actor_seat smallint; v_opponent_seen timestamptz; v_winner smallint;
begin
  select status into v_status from public.pvp_rooms where id=p_room_id and status in ('waiting','in_game') for update;
  if not found then raise exception 'room_ended'; end if;
  select seat into v_actor_seat from public.pvp_room_members where room_id=p_room_id and user_id=p_actor_id for update;
  if v_actor_seat is null then raise exception 'not_room_member'; end if;
  if p_reason='claim-timeout' then
    select last_seen_at into v_opponent_seen from public.pvp_room_members where room_id=p_room_id and seat<>v_actor_seat for update;
    if v_opponent_seen is null then raise exception 'opponent_not_found'; end if;
    if v_opponent_seen > now()-interval '5 minutes' then raise exception 'disconnect_grace_active'; end if;
    v_winner:=v_actor_seat;
  elsif p_reason='forfeit' then
    if exists(select 1 from public.pvp_room_members where room_id=p_room_id and seat<>v_actor_seat) then v_winner:=1-v_actor_seat; else v_winner:=null; end if;
  else raise exception 'invalid_finish_reason';
  end if;
  update public.pvp_rooms set status='ended',winner_seat=v_winner,result_reason=p_reason,ended_at=now(),updated_at=now(),expires_at=now()+interval '24 hours' where id=p_room_id;
  update public.pvp_player_views set event=jsonb_build_object('type','room_ended','winnerSeat',v_winner,'reason',p_reason),updated_at=now() where room_id=p_room_id;
  return v_winner;
end $$;
revoke all on function public.finish_pvp_room(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finish_pvp_room(uuid,uuid,text) to service_role;

create or replace function public.resume_pvp_seat(p_room_id uuid, p_resume_hash text, p_new_user_id uuid)
returns table(seat smallint, display_name text)
language plpgsql security definer set search_path=public as $$
declare v_old_user_id uuid; v_seat smallint; v_name text;
begin
  perform 1 from public.pvp_rooms where id=p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  select user_id, pvp_room_members.seat, pvp_room_members.display_name
    into v_old_user_id, v_seat, v_name
    from public.pvp_room_members
   where room_id=p_room_id and resume_hash=p_resume_hash
   for update;
  if not found then raise exception 'invalid_resume_token'; end if;
  if v_old_user_id <> p_new_user_id then
    update public.pvp_rooms set host_user_id=p_new_user_id where id=p_room_id and host_user_id=v_old_user_id;
    update public.pvp_deck_submissions set user_id=p_new_user_id where room_id=p_room_id and user_id=v_old_user_id;
    update public.pvp_player_views set user_id=p_new_user_id where room_id=p_room_id and user_id=v_old_user_id;
    update public.pvp_action_receipts set user_id=p_new_user_id where user_id=v_old_user_id and match_id in (select id from public.pvp_matches where room_id=p_room_id);
    update public.pvp_room_members set user_id=p_new_user_id, last_seen_at=now() where room_id=p_room_id and user_id=v_old_user_id;
  else
    update public.pvp_room_members set last_seen_at=now() where room_id=p_room_id and user_id=v_old_user_id;
  end if;
  return query select v_seat, v_name;
end $$;
revoke all on function public.resume_pvp_seat(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.resume_pvp_seat(uuid,text,uuid) to service_role;

create or replace function public.cleanup_expired_pvp_rooms() returns integer
language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  update public.pvp_rooms r set status='abandoned',updated_at=now(),expires_at=now()
   where r.status='in_game' and not exists(select 1 from public.pvp_room_members m where m.room_id=r.id and m.last_seen_at>now()-interval '30 minutes');
  delete from public.pvp_rooms
  where (status in ('waiting','abandoned') and expires_at <= now())
     or (status = 'ended' and ended_at < now() - interval '24 hours');
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.cleanup_expired_pvp_rooms() from public,anon,authenticated;

create extension if not exists pg_cron;
select cron.schedule(
  'cleanup-wuthering-waves-pvp-rooms',
  '17 * * * *',
  $schedule$select public.cleanup_expired_pvp_rooms();$schedule$
)
where not exists (select 1 from cron.job where jobname='cleanup-wuthering-waves-pvp-rooms');
