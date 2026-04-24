"use client";

import { useEffect, useState } from "react";

const ENTITY_OPTIONS = [
  { value: "", label: "Wszystkie" },
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
  maszyna_id: "Maszyna",
  sprzet_id: "Sprzęt",
  entityId: "ID",
};

function humanizeEntity(entity, entityId) {
  const base = ENTITY_LABELS[entity] || entity || "-";
  return entityId ? `${base} #${entityId}` : base;
}

function humanizeAction(action) {
  return ACTION_LABELS[action] || action || "-";
}

function humanizeField(field) {
  return FIELD_LABELS[field] || field;
}

function humanizeValue(value) {
  if (value === null || value === undefined || value === "") return "brak";
  if (typeof value === "boolean") return value ? "tak" : "nie";
  if (value === "admin") return "administrator";
  if (value === "user") return "użytkownik";
  if (value === true) return "tak";
  if (value === false) return "nie";
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
    <>
      <div className="card historyFiltersCard">
        <div className="grid historyFiltersGrid">
          <label>
            <span>Obszar</span>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
            >
              {ENTITY_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Akcja</span>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              {ACTION_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="error historyError">{error}</p>}
      </div>

      <div className="tableWrap">
        <table className="table historyTable">
          <thead>
            <tr>
              <th>Data</th>
              <th>Użytkownik</th>
              <th>Akcja</th>
              <th>Obiekt</th>
              <th>Zmiany</th>
              <th>IP</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  Brak danych
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  <td data-label="Data">{fmtDate(row?.date)}</td>
                  <td data-label="Użytkownik">{row?.username ?? "-"}</td>
                  <td data-label="Akcja">
                    <span className="pill">{humanizeAction(row?.action)}</span>
                  </td>
                  <td data-label="Obiekt">
                    {humanizeEntity(row?.entity, row?.entityId)}
                  </td>
                  <td data-label="Zmiany" className="historyChangesCell">
                    {Array.isArray(row?.changes) && row.changes.length ? (
                      <div className="historyChangesList">
                        {row.changes.map((change, changeIndex) => (
                          <div className="historyChangeItem" key={changeIndex}>
                            <span className="historyChangeField">
                              {humanizeField(change.field)}
                            </span>
                            <span className="historyChangeArrow" aria-hidden="true">
                              →
                            </span>
                            <span className="historyChangeValue">
                              {humanizeValue(change.from)}
                            </span>
                            <span className="historyChangeArrow" aria-hidden="true">
                              →
                            </span>
                            <span className="historyChangeValue historyChangeValueNew">
                              {humanizeValue(change.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td data-label="IP">{row?.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
