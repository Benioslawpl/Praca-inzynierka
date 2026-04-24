"use client";

import { useEffect, useState } from "react";

const ENTITY_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "budowy", label: "Budowy" },
  { value: "budowy_brygady", label: "Przypisania brygad" },
  { value: "budowy_maszyny", label: "Przypisania maszyn" },
  { value: "budowy_sprzet", label: "Przypisania sprzętu" },
  { value: "maszyny", label: "Maszyny" },
  { value: "brygady", label: "Brygady" },
  { value: "members", label: "Członkowie brygad" },
  { value: "maszyny_details", label: "Historia maszyn" },
  { value: "sprzet", label: "Sprzęt" },
  { value: "sprzet_details", label: "Historia sprzętu" },
  { value: "users", label: "Użytkownicy" },
  { value: "auth", label: "Logowanie" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "create", label: "Utworzono" },
  { value: "update", label: "Zmieniono" },
  { value: "delete", label: "Usunięto" },
  { value: "login", label: "Zalogowano" },
  { value: "logout", label: "Wylogowano" },
];

const ENTITY_LABELS = Object.fromEntries(
  ENTITY_OPTIONS.filter((item) => item.value).map((item) => [item.value, item.label])
);

const ACTION_LABELS = Object.fromEntries(
  ACTION_OPTIONS.filter((item) => item.value).map((item) => [item.value, item.label])
);

const FIELD_LABELS = {
  username: "Login",
  role: "Rola",
  blocked: "Blokada",
  rodzaj: "Rodzaj",
  marka: "Marka",
  model: "Model",
  operator: "Operator",
  brygadzista: "Brygadzista",
  lokalizacja: "Lokalizacja",
  inwestor: "Inwestor",
  kierownik: "Kierownik",
  status: "Status",
  data_rozpoczecia: "Data rozpoczęcia",
  data_zakonczenia: "Data zakończenia",
  numer: "Numer",
  nr: "Numer",
  imie: "Imię",
  nazwisko: "Nazwisko",
  rola: "Rola",
  telefon: "Telefon",
  przebieg: "Przebieg",
  awaria: "Awaria",
  wykonawca: "Wykonawca",
  uwagi: "Uwagi",
  data_zdarzenia: "Data zdarzenia",
  created_at: "Data utworzenia",
  password_reset: "Hasło",
  brygada_id: "Brygada",
  brygada_numer: "Brygada",
  maszyna_id: "Maszyna",
  sprzet_id: "Sprzęt",
  budowa_id: "Budowa",
  budowa_numer: "Budowa",
  data_od: "Data od",
  data_do: "Data do",
};

function humanizeEntity(entity, entityId) {
  const base = ENTITY_LABELS[entity] || entity || "-";
  return entityId ? `${base} #${entityId}` : base;
}

function humanizeObject(row) {
  if (row?.objectLabel) return row.objectLabel;
  return humanizeEntity(row?.entity, row?.entityId);
}

function humanizeAction(action) {
  return ACTION_LABELS[action] || action || "-";
}

function actionClass(action) {
  if (action === "create" || action === "login") return "pill ok";
  if (action === "delete") return "pill bad";
  return "pill";
}

function humanizeField(field) {
  return FIELD_LABELS[field] || field;
}

function humanizeValue(value) {
  if (value === null || value === undefined || value === "") return "brak";
  if (typeof value === "boolean") return value ? "tak" : "nie";
  if (value === "admin") return "administrator";
  if (value === "user") return "użytkownik";
  if (value === "planowana") return "planowana";
  if (value === "w_toku") return "w toku";
  if (value === "wstrzymana") return "wstrzymana";
  if (value === "zakonczona") return "zakończona";
  return String(value);
}

export default function LogsClient() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ entity: "", action: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      const params = new URLSearchParams();

      if (filters.entity) params.set("entity", filters.entity);
      if (filters.action) params.set("action", filters.action);
      params.set("limit", "200");

      const res = await fetch("/api/logs?" + params.toString(), {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRows([]);
        setError(data?.error || `Błąd ${res.status}`);
        return;
      }

      setRows(Array.isArray(data) ? data : []);
    };

    load();
  }, [filters]);

  const fmtDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("pl-PL");
    } catch {
      return String(value).slice(0, 19).replace("T", " ");
    }
  };

  return (
    <div className="historyStack">
      <div className="historyToolbar">
        <div className="historyFilters">
          <label className="historyFilterField">
            <span>Obszar</span>
            <select
              value={filters.entity}
              onChange={(e) =>
                setFilters((current) => ({ ...current, entity: e.target.value }))
              }
            >
              {ENTITY_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="historyFilterField">
            <span>Akcja</span>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters((current) => ({ ...current, action: e.target.value }))
              }
            >
              {ACTION_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="historyCount">
          <strong>{rows.length}</strong>
          <span>rekordów</span>
        </div>
      </div>

      {error && <p className="error historyError">{error}</p>}

      <div className="historyFeed">
        {rows.length === 0 ? (
          <div className="historyEmpty">
            <strong>Brak danych</strong>
            <p>Nie znaleziono wpisów dla wybranych filtrów.</p>
          </div>
        ) : (
          rows.map((row, index) => (
            <article className="historyEntry" key={index}>
              <div className="historyEntryTop">
                <div className="historyEntryMain">
                  <strong className="historyEntryObject">{humanizeObject(row)}</strong>
                  <span className="historyEntryMeta">
                    {row?.username ?? "-"} • {fmtDate(row?.date)}
                  </span>
                </div>

                <div className="historyEntrySide">
                  <span className={actionClass(row?.action)}>
                    {humanizeAction(row?.action)}
                  </span>
                </div>
              </div>

              <div className="historyEntryBody">
                <div className="historyEntryInfo">
                  <span className="historyInfoLabel">Obszar</span>
                  <span>{ENTITY_LABELS[row?.entity] || row?.entity || "-"}</span>
                </div>

                <div className="historyEntryInfo">
                  <span className="historyInfoLabel">IP</span>
                  <span>{row?.ip ?? "-"}</span>
                </div>
              </div>

              <div className="historyEntryChanges">
                {Array.isArray(row?.changes) && row.changes.length ? (
                  row.changes.slice(0, 3).map((change, changeIndex) => (
                    <div className="historyChangeLine" key={changeIndex}>
                      <span className="historyChangeLineField">
                        {humanizeField(change.field)}
                      </span>
                      <span className="historyChangeLineValue">
                        {humanizeValue(change.from)}
                      </span>
                      <span className="historyChangeLineArrow" aria-hidden="true">
                        →
                      </span>
                      <span className="historyChangeLineValueNew">
                        {humanizeValue(change.to)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="historyNoChanges">Brak szczegółowych zmian</span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
