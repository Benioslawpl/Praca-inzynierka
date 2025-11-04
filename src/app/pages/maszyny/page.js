"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ rodzaj: "", marka: "", model: "", operator: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const res = await fetch("/api/maszyny", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || "Błąd pobierania");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm({ rodzaj: "", marka: "", model: "", operator: "" });
    setEditId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/maszyny/${editId}` : "/api/maszyny";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");
      reset();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({
      rodzaj: r.rodzaj,
      marka: r.marka,
      model: r.model,
      operator: r.operator,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Usunąć maszynę?")) return;
    const res = await fetch(`/api/maszyny/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div>
      <h1>Maszyny 🚜</h1>

      
      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>
            <span>Rodzaj*</span>
            <input
              value={form.rodzaj}
              onChange={(e) => setForm({ ...form, rodzaj: e.target.value })}
              required
              placeholder="np. Koparka"
            />
          </label>
          <label>
            <span>Marka*</span>
            <input
              value={form.marka}
              onChange={(e) => setForm({ ...form, marka: e.target.value })}
              required
              placeholder="np. CAT"
            />
          </label>
          <label>
            <span>Model*</span>
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
              placeholder="np. 320D"
            />
          </label>
          <label>
            <span>Operator*</span>
            <input
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              required
              placeholder="np. Jan Kowalski"
            />
          </label>
        </div>

        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : editId ? "Zapisz" : "Dodaj"}
          </button>
          {editId && (
            <button type="button" className="secondary" onClick={reset}>
              Anuluj
            </button>
          )}
        </div>

        {error && <p className="error">⚠ {error}</p>}
      </form>

      
      <div className="tableWrap">
        {rows.length === 0 ? (
          <p>Brak danych</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nr</th>
                <th>Rodzaj</th>
                <th>Marka</th>
                <th>Model</th>
                <th>Operator</th>
                <th>Utworzono</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nr}>
                  <td>{r.nr}</td>
                  <td>{r.rodzaj}</td>
                  <td>{r.marka}</td>
                  <td>{r.model}</td>
                  <td>{r.operator}</td>
                  <td>
                    {r.created_at
                      ? String(r.created_at).slice(0, 19).replace("T", " ")
                      : "-"}
                  </td>
                  <td className="actionsCell">
                    <Link
                      href={`/pages/maszyny/${r.id}`}
                      className="info-btn"
                      title="Informacje"
                    >
                      ℹ️
                    </Link>
                    <button onClick={() => handleEdit(r)}>✏️ Edytuj</button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(r.id)}
                    >
                      🗑 Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
