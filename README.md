# System zarządzania zasobami technicznymi

Aplikacja webowa wdrożona na Vercel, wspierająca zarządzanie maszynami,
sprzętem, brygadami, budowami i serwisem zasobów technicznych.

## Wdrożenie

Projekt jest wdrażany przez Vercel z połączonego repozytorium. Każdy push do
gałęzi produkcyjnej tworzy nowe wdrożenie aplikacji.

W panelu Vercel muszą być ustawione następujące zmienne środowiskowe:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=dlugi-losowy-sekret
```

`JWT_SECRET` służy do podpisywania sesji użytkowników. Nie należy go
umieszczać w kodzie ani w repozytorium.

## Baza danych

Baza PostgreSQL działa w Supabase. Skrypty znajdują się w katalogu `sql`:

- `schema.sql` - pełny schemat 12 aktualnych tabel, relacji i indeksów.
- `budowy.sql` - budowy oraz przypisania brygad i maszyn.
- `operatorzy-serwis.sql` - operatorzy, raporty i dane serwisowe.
- `optymalizacja-bazy.sql` - indeksy i statystyki tabel.
- `napraw-sprzet-nr.sql` - unikalność numeru sprzętu w istniejącej bazie.

## Role użytkowników

- `admin` - pełne zarządzanie użytkownikami i zasobami.
- `biuro` - zarządzanie budowami, brygadami, sprzętem i maszynami.
- `kierownik` - podgląd własnych budów oraz przypisanych zasobów.
- `brygadzista` - podgląd brygady, jej sprzętu i budów.
- `operator` - obsługa przypisanej maszyny, motogodzin i zgłoszeń awarii.

## Moduły aplikacji

- maszyny - ewidencja, operatorzy, serwisy i raporty;
- sprzęt - ewidencja i przypisanie do brygadzisty;
- brygady - członkowie i brygadziści;
- budowy - przypisane brygady oraz maszyny;
- użytkownicy - konta, role i blokowanie dostępu.

## Weryfikacja kodu

Przed wdrożeniem wykonywane są polecenia:

```bash
npm test
npm run lint
npm run build
```
