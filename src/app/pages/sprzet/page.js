"use client";

import { useEffect, useState } from "react";

export default function SprzetPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    rodzaj: "",
    marka: "",
    model: "",
    operator: "",
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const res = await fetch("/api/sprzet", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setRows([]);
      setError(data?.error || "Błąd pobierania sprzętu");
      return;
    }

    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm({ rodzaj: "", marka: "", model: "", operator: "" });
    setEditId(null);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editId ? `/api/sprzet/${editId}` : "/api/sprzet";
      const method = editId ? "PUT" : "POST";

      const payload = {
        rodzaj: form.rodzaj.trim(),
        marka: form.marka.trim(),
        model: form.model.trim(),
        operator: form.operator.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Błąd zapisu sprzętu");
      }

      reset();
      load();
    } catch (err) {
      setError(err.message || "Błąd zapisu sprzętu");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({
      rodzaj: row.rodzaj ?? "",
      marka: row.marka ?? "",
      model: row.model ?? "",
      operator: row.operator ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Usunąć sprzęt?")) return;

    const res = await fetch(`/api/sprzet/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || "Błąd usuwania sprzętu");
      return;
    }

    if (editId === id) reset();
    load();
  };

  return (
    <div>
      <h1>Sprzęt</h1>

      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>
            <span>Rodzaj*</span>
            <input
              value={form.rodzaj}
              onChange={(e) => setForm({ ...form, rodzaj: e.target.value })}
              required
              placeholder="np. Zagęszczarka"
            />
          </label>

          <label>
            <span>Marka*</span>
            <input
              value={form.marka}
              onChange={(e) => setForm({ ...form, marka: e.target.value })}
              required
              placeholder="np. Husqvarna"
            />
          </label>

          <label>
            <span>Model*</span>
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
              placeholder="np. LF 75"
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

        {error && <p className="error">{error}</p>}
      </form>

      <div className="tableWrap">
        {rows.length === 0 ? (
          <p>Brak sprzętu</p>
        ) : (
          <table className="table tableCenter">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Numer</th>
                <th>Rodzaj</th>
                <th>Marka</th>
                <th>Model</th>
                <th>Operator</th>
                <th style={{ width: 240 }}>Akcje</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const uiNr = row.nr || `S-${String(index + 1).padStart(2, "0")}`;

                return (
                  <tr key={row.id}>
                    <td data-label="Numer">{uiNr}</td>
                    <td data-label="Rodzaj">{row.rodzaj}</td>
                    <td data-label="Marka">{row.marka}</td>
                    <td data-label="Model">{row.model}</td>
                    <td data-label="Operator">{row.operator}</td>

                    <td className="actionsCell" data-label="Akcje">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleEdit(row)}
                      >
                        Edytuj
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(row.id)}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
