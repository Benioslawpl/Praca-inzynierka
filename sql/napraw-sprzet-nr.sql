-- Run after deploying the application with the required equipment number field.

create unique index if not exists sprzet_nr_key
  on public.sprzet(nr);
