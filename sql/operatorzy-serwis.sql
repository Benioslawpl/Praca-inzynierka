alter table public.maszyny
  add column if not exists serwis_co_ile_mth integer,
  add column if not exists ostatni_serwis_mth numeric;

create table if not exists public.user_maszyny (
  id bigserial primary key,
  user_id bigint not null unique references public.users(id) on delete cascade,
  maszyna_id bigint not null references public.maszyny(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_maszyny_maszyna_id
  on public.user_maszyny(maszyna_id);

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
