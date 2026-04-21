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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRows([]);
      setError(data?.error || "Błąd pobierania");
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
      const url = editId ? `/api/maszyny/${editId}` : "/api/maszyny";
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
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      load();
    } catch (e2) {
      setError(e2.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({
      rodzaj: r.rodzaj ?? "",
      marka: r.marka ?? "",
      model: r.model ?? "",
      operator: r.operator ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          <table className="table tableCenter">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Numer</th>
                <th>Rodzaj</th>
                <th>Marka</th>
                <th>Model</th>
                <th>Operator</th>
                <th style={{ width: 320 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const uiNr = `M-${String(i + 1).padStart(2, "0")}`; // M-01, M-02...
                return (
                  <tr key={r.id}>
                    <td data-label="Numer">{uiNr}</td>
                    <td data-label="Rodzaj">{r.rodzaj}</td>
                    <td data-label="Marka">{r.marka}</td>
                    <td data-label="Model">{r.model}</td>
                    <td data-label="Operator">{r.operator}</td>

                    <td className="actionsCell" data-label="Akcje">
                      <Link href={`/pages/maszyny/${r.id}`} className="info-btn" title="Szczegóły">
                        🛈
                      </Link>

                      <button type="button" onClick={() => handleEdit(r)}>
                        ✏️ Edytuj
                      </button>

                      <button type="button" className="danger" onClick={() => handleDelete(r.id)}>
                        🗑 Usuń
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
