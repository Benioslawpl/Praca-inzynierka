"use client";

import { useEffect, useState } from "react";

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
            <span>Encja</span>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
            >
              <option value="">Wszystkie</option>
              <option>maszyny</option>
              <option>brygady</option>
              <option>members</option>
              <option>maszyny_details</option>
              <option>sprzet</option>
              <option>sprzet_details</option>
            </select>
          </label>

          <label>
            <span>Akcja</span>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">Wszystkie</option>
              <option>create</option>
              <option>update</option>
              <option>delete</option>
              <option>login</option>
              <option>logout</option>
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
                    <span className="pill">{row?.action ?? "-"}</span>
                  </td>
                  <td data-label="Obiekt">
                    {row?.entity}
                    {row?.entityId ? ` #${row.entityId}` : ""}
                  </td>
                  <td data-label="Zmiany" className="historyChangesCell">
                    {Array.isArray(row?.changes) && row.changes.length ? (
                      <div className="historyChangesList">
                        {row.changes.map((change, changeIndex) => (
                          <div className="historyChangeItem" key={changeIndex}>
                            <span className="historyChangeField">
                              {change.field}
                            </span>
                            <span className="historyChangeArrow" aria-hidden="true">
                              →
                            </span>
                            <span className="historyChangeValue">
                              {String(change.from)}
                            </span>
                            <span className="historyChangeArrow" aria-hidden="true">
                              →
                            </span>
                            <span className="historyChangeValue historyChangeValueNew">
                              {String(change.to)}
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
