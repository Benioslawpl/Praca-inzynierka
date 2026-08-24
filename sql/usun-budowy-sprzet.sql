-- Uruchom po wdrożeniu wersji aplikacji bez endpointów /api/budowy/[id]/sprzet.
-- Tabela była pusta i nie jest już częścią aktualnego modelu danych.

drop table if exists public.budowy_sprzet;
