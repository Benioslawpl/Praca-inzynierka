"use client";
import { useEffect, useState } from "react";

export default function LogsClient() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ entity: "", action: "" });

  const load = async () => {
    const p = new URLSearchParams();
    if (filters.entity) p.set("entity", filters.entity);
    if (filters.action) p.set("action", filters.action);
    p.set("limit", "200");
    const res = await fetch("/api/logs?" + p.toString(), { cache: "no-store" });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
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
      </div>

      <div className="tableWrap">
        <table className="table">
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
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{String(r.at).slice(0, 19).replace("T", " ")}</td>
                <td>{r.username}</td>
                <td>{r.action}</td>
                <td>
                  {r.entity}
                  {r.entity_id ? `#${r.entity_id}` : ""}
                </td>
                <td>
                  {Array.isArray(r.changes) && r.changes.length ? (
                    r.changes.map((c, i) => (
                      <div key={i}>
                        <b>{c.field}</b>: {String(c.from)} → {String(c.to)}
                      </div>
                    ))
                  ) : (
                    "-"
                  )}
                </td>
                <td>{r.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}