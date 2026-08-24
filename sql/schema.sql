-- Complete schema for a new PostgreSQL database.

create table if not exists public.users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  role text not null default 'user',
  is_active boolean not null default true,
  blocked boolean not null default false
);

create table if not exists public.brygady (
  id bigserial primary key,
  numer text not null,
  brygadzista text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.brygada_czlonkowie (
  id bigserial primary key,
  brygada_id bigint not null references public.brygady(id) on delete cascade,
  imie text not null,
  nazwisko text not null,
  rola text,
  telefon text
);

create table if not exists public.maszyny (
  id bigserial primary key,
  nr text not null unique,
  rodzaj text not null,
  marka text not null,
  model text not null,
  operator text not null,
  created_at timestamptz not null default now(),
  serwis_co_ile_mth integer,
  ostatni_serwis_mth numeric
);

create table if not exists public.sprzet (
  id bigserial primary key,
  nr text not null unique,
  rodzaj text not null,
  marka text not null,
  model text not null,
  operator text not null,
  created_at timestamptz not null default now(),
  serwis_co_ile_mth integer,
  ostatni_serwis_mth numeric
);

create table if not exists public.budowy (
  id bigserial primary key,
  numer text not null unique,
  nazwa text not null,
  lokalizacja text not null,
  inwestor text,
  kierownik text,
  status text not null default 'planowana',
  data_rozpoczecia date,
  data_zakonczenia date,
  uwagi text,
  created_at timestamptz not null default now()
);

create table if not exists public.budowy_brygady (
  id bigserial primary key,
  budowa_id bigint not null references public.budowy(id) on delete cascade,
  brygada_id bigint not null references public.brygady(id) on delete cascade,
  data_od date,
  data_do date,
  uwagi text,
  created_at timestamptz not null default now()
);

create table if not exists public.budowy_maszyny (
  id bigserial primary key,
  budowa_id bigint not null references public.budowy(id) on delete cascade,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  data_od date,
  data_do date,
  uwagi text,
  created_at timestamptz not null default now()
);

create table if not exists public.maszyna_operatorzy (
  id bigserial primary key,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  data_od date not null default current_date,
  data_do date,
  aktywne boolean not null default true,
  created_at timestamptz not null default now()
);

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

create table if not exists public.maszyny_details (
  id bigserial primary key,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  przebieg bigint,
  awaria text,
  wykonawca text,
  uwagi text,
  created_at timestamptz not null default now(),
  data_zdarzenia date default current_date,
  zrodlo text not null default 'serwis',
  reporter_username text
);

create table if not exists public.sprzet_details (
  id bigserial primary key,
  sprzet_id bigint not null references public.sprzet(id) on delete cascade,
  data_zdarzenia date,
  przebieg numeric,
  awaria text,
  wykonawca text,
  uwagi text,
  status_awarii text not null default 'brak'
);

create index if not exists idx_brygada_czlonkowie_brygada
  on public.brygada_czlonkowie(brygada_id);

create index if not exists idx_budowy_brygady_budowa_id
  on public.budowy_brygady(budowa_id);

create index if not exists idx_budowy_brygady_brygada_data_do
  on public.budowy_brygady(brygada_id, data_do);

create index if not exists idx_budowy_maszyny_budowa_id
  on public.budowy_maszyny(budowa_id);

create index if not exists idx_budowy_maszyny_maszyna_id
  on public.budowy_maszyny(maszyna_id);

create index if not exists idx_budowy_kierownik
  on public.budowy(kierownik);

create index if not exists idx_sprzet_operator
  on public.sprzet(operator);

create index if not exists idx_sprzet_details_sprzet_data
  on public.sprzet_details(sprzet_id, data_zdarzenia desc, id desc);

create index if not exists idx_maszyny_details_maszyna_data
  on public.maszyny_details(maszyna_id, data_zdarzenia desc, id desc);

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

create index if not exists idx_maszyna_raporty_maszyna_created
  on public.maszyna_raporty(maszyna_id, created_at desc, id desc);
