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

create index if not exists idx_budowy_brygady_budowa_id
  on public.budowy_brygady(budowa_id);

create index if not exists idx_budowy_maszyny_budowa_id
  on public.budowy_maszyny(budowa_id);

create index if not exists idx_budowy_maszyny_maszyna_id
  on public.budowy_maszyny(maszyna_id);
