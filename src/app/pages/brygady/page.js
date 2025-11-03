"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BrygadyPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ numer: "", brygadzista: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const res = await fetch("/api/brygady", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || "Błąd pobierania");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ numer: "", brygadzista: "" }); setEditId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const url = editId ? `/api/brygady/${editId}` : "/api/brygady";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");
      reset(); load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => { setEditId(r.id); setForm({ numer: r.numer, brygadzista: r.brygadzista }); };
  const handleDelete = async (id) => {
    if (!confirm("Usunąć brygadę?")) return;
    const res = await fetch(`/api/brygady/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div>
      <h1>Brygady 👷‍♂️</h1>

      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>
            <span>Numer*</span>
            <input
              value={form.numer}
              onChange={(e) => setForm({ ...form, numer: e.target.value })}
              required
              placeholder="np. B-01"
            />
          </label>
          <label>
            <span>Brygadzista*</span>
            <input
              value={form.brygadzista}
              onChange={(e) => setForm({ ...form, brygadzista: e.target.value })}
              required
              placeholder="Imię i nazwisko"
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
                <th>ID</th>
                <th>Numer</th>
                <th>Brygadzista</th>
                <th>Utworzono</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    <Link href={`/pages/brygady/${r.id}`}>{r.numer}</Link>
                  </td>
                  <td>{r.brygadzista}</td>
                  <td>{r.created_at ? String(r.created_at).slice(0, 19).replace("T", " ") : "-"}</td>
                  <td className="actionsCell">
                    <button onClick={() => handleEdit(r)}>✏️ Edytuj</button>
                    <button className="danger" onClick={() => handleDelete(r.id)}>🗑 Usuń</button>
                    <Link href={`/pages/brygady/${r.id}`} style={{ marginLeft: 8 }}>Szczegóły →</Link>
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
