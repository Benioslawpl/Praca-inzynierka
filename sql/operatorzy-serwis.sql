alter table public.maszyny
  add column if not exists serwis_co_ile_mth integer,
  add column if not exists ostatni_serwis_mth numeric;

alter table public.maszyny_details
  add column if not exists zrodlo text not null default 'serwis',
  add column if not exists reporter_username text;

create table if not exists public.maszyna_operatorzy (
  id bigserial primary key,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  data_od date not null default current_date,
  data_do date,
  aktywne boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_maszyna_operatorzy_maszyna_id
  on public.maszyna_operatorzy(maszyna_id);

create index if not exists idx_maszyna_operatorzy_user_id
  on public.maszyna_operatorzy(user_id);

create unique index if not exists uniq_maszyna_operatorzy_active_machine
  on public.maszyna_operatorzy(maszyna_id)
  where aktywne = true;

create unique index if not exists uniq_maszyna_operatorzy_active_user
  on public.maszyna_operatorzy(user_id)
  where aktywne = true;

create table if not exists public.maszyna_raporty (
  id bigserial primary key,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  user_id bigint references public.users(id) on delete set null,
  data_raportu date not null default current_date,
  motogodziny numeric,
  awaria boolean not null default false,
  opis text,
  status_awarii text not null default 'nowa',
  created_at timestamptz not null default now()
);

create index if not exists idx_maszyna_raporty_maszyna_id
  on public.maszyna_raporty(maszyna_id);

create index if not exists idx_maszyna_raporty_created_at
  on public.maszyna_raporty(created_at desc);
