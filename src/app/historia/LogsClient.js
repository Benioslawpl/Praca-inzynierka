"use client";
import { useEffect, useState } from "react";

export default function LogsClient() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ entity: "", action: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      const p = new URLSearchParams();
      if (filters.entity) p.set("entity", filters.entity);
      if (filters.action) p.set("action", filters.action);
      p.set("limit", "200");

      const res = await fetch("/api/logs?" + p.toString(), {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRows([]);
        setError(data?.error || `Blad ${res.status}`);
        return;
      }

      setRows(Array.isArray(data) ? data : []);
    };

    load();
  }, [filters]);

  const fmtDate = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString("pl-PL");
    } catch {
      return String(v).slice(0, 19).replace("T", " ");
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
        >
          <label>
            <span>Encja</span>
            <select
              value={filters.entity}
              onChange={(e) =>
                setFilters({ ...filters, entity: e.target.value })
              }
            >
              <option value="">Wszystkie</option>
              <option>maszyny</option>
              <option>brygady</option>
              <option>members</option>
              <option>maszyny_details</option>
            </select>
          </label>
          <label>
            <span>Akcja</span>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
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
        {error && (
          <p className="error" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Uzytkownik</th>
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
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r?.date)}</td>
                  <td>{r?.username ?? "-"}</td>
                  <td>{r?.action ?? "-"}</td>
                  <td>
                    {r?.entity}
                    {r?.entityId ? `#${r.entityId}` : ""}
                  </td>
                  <td>
                    {Array.isArray(r?.changes) && r.changes.length
                      ? r.changes.map((c, j) => (
                          <div key={j}>
                            <b>{c.field}</b>: {String(c.from)} -&gt;{" "}
                            {String(c.to)}
                          </div>
                        ))
                      : "-"}
                  </td>
                  <td>{r?.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
