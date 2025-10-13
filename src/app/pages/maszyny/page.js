"use client";
import { useEffect, useState } from "react";

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const empty = {
    Rozdaj: "",
    Marka: "",
    Typ: "",
    Przebieg: "",
    Ostatni_Serwix: "",
    Data_Kupna: "",
  };
  const [form, setForm] = useState(empty);

  const fetchRows = async () => {
    setError("");
    const res = await fetch("/api/resources", { cache: "no-store" });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const reset = () => {
    setForm(empty);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editId ? `/api/resources/${editId}` : "/api/resources";
      const method = editId ? "PUT" : "POST";

      const payload = {
        ...form,
        Przebieg: form.Przebieg === "" ? null : Number(form.Przebieg),
        Ostatni_Serwix:
          form.Ostatni_Serwix === "" ? null : Number(form.Ostatni_Serwix),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      fetchRows();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({
      Rozdaj: r.Rozdaj ?? "",
      Marka: r.Marka ?? "",
      Typ: r.Typ ?? "",
      Przebieg: r.Przebieg ?? "",
      Ostatni_Serwix: r.Ostatni_Serwix ?? "",
      Data_Kupna: r.Data_Kupna ? String(r.Data_Kupna).slice(0, 10) : "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Na pewno usunąć?")) return;
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) fetchRows();
  };

  return (
    <div>
      <h1>Maszyny 🚜</h1>

      {/* Formularz */}
      <form className="card" onSubmit={handleSubmit}>
        <div className="grid">
          <label>
            <span>Rozdaj*</span>
            <input
              value={form.Rozdaj}
              onChange={(e) => setForm({ ...form, Rozdaj: e.target.value })}
              required
              placeholder="np. Koparka"
            />
          </label>
          <label>
            <span>Marka*</span>
            <input
              value={form.Marka}
              onChange={(e) => setForm({ ...form, Marka: e.target.value })}
              required
              placeholder="np. CAT"
            />
          </label>
          <label>
            <span>Typ*</span>
            <input
              value={form.Typ}
              onChange={(e) => setForm({ ...form, Typ: e.target.value })}
              required
              placeholder="np. 320D"
            />
          </label>
          <label>
            <span>Przebieg [km]</span>
            <input
              type="number"
              value={form.Przebieg}
              onChange={(e) => setForm({ ...form, Przebieg: e.target.value })}
              placeholder="np. 12000"
              min="0"
            />
          </label>
          <label>
            <span>Ostatni serwis (km od)</span>
            <input
              type="number"
              value={form.Ostatni_Serwix}
              onChange={(e) =>
                setForm({ ...form, Ostatni_Serwix: e.target.value })
              }
              placeholder="np. 300"
              min="0"
            />
          </label>
          <label>
            <span>Data kupna</span>
            <input
              type="date"
              value={form.Data_Kupna}
              onChange={(e) => setForm({ ...form, Data_Kupna: e.target.value })}
            />
          </label>
        </div>

        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : editId ? "Zapisz zmiany" : "Dodaj"}
          </button>
          {editId && (
            <button type="button" className="secondary" onClick={reset}>
              Anuluj edycję
            </button>
          )}
        </div>

        {error && <p className="error">⚠ {error}</p>}
      </form>

      {/* Tabela */}
      <div className="tableWrap">
        {rows.length === 0 ? (
          <p>Brak danych</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Rozdaj</th>
                <th>Marka</th>
                <th>Typ</th>
                <th>Przebieg [km]</th>
                <th>Ostatni serwis (km)</th>
                <th>Data kupna</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.Rozdaj}</td>
                  <td>{r.Marka}</td>
                  <td>{r.Typ}</td>
                  <td>{r.Przebieg}</td>
                  <td>{r.Ostatni_Serwix}</td>
                  <td>{r.Data_Kupna ? String(r.Data_Kupna).slice(0, 10) : ""}</td>
                  <td className="actionsCell">
                    <button onClick={() => handleEdit(r)}>✏️ Edytuj</button>
                    <button className="danger" onClick={() => handleDelete(r.id)}>
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