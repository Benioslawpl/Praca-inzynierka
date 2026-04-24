"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    setIsFormOpen(false);
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
    } catch (err) {
      setError(err.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setIsFormOpen(true);
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
    if (!confirm("Usunąć maszynę?")) return;
    const res = await fetch(`/api/maszyny/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const toggleForm = () => {
    if (editId) {
      setIsFormOpen(true);
      return;
    }

    if (isFormOpen) {
      reset();
      return;
    }

    setIsFormOpen(true);
    setError("");
  };

  return (
    <div>
      <h1>Maszyny</h1>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId ? "Edytuj maszynę" : "Dodaj maszynę"}</h2>
            <p>
              {editId
                ? "Zaktualizuj dane wybranej maszyny."
                : "Dodaj nową maszynę do ewidencji."}
            </p>
          </div>

          <button type="button" onClick={toggleForm}>
            {isFormOpen ? (editId ? "Edytujesz" : "Ukryj formularz") : "Dodaj"}
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
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
              <button type="button" className="secondary" onClick={reset}>
                Anuluj
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </section>

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
                <th style={{ width: 360 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const uiNr = `M-${String(index + 1).padStart(2, "0")}`;

                return (
                  <tr key={row.id}>
                    <td data-label="Numer">{uiNr}</td>
                    <td data-label="Rodzaj">{row.rodzaj}</td>
                    <td data-label="Marka">{row.marka}</td>
                    <td data-label="Model">{row.model}</td>
                    <td data-label="Operator">{row.operator}</td>
                    <td className="actionsCell" data-label="Akcje">
                      <Link
                        href={`/pages/maszyny/${row.id}`}
                        className="info-btn"
                        title="Szczegóły"
                      >
                        Szczegóły
                      </Link>

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
