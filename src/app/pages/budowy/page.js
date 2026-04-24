"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const EMPTY_FORM = {
  numer: "",
  nazwa: "",
  lokalizacja: "",
  inwestor: "",
  kierownik: "",
  status: "planowana",
  data_rozpoczecia: "",
  data_zakonczenia: "",
  uwagi: "",
};

export default function BudowyPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");

    const res = await fetch("/api/budowy", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setRows([]);
      setError(data?.error || "Błąd pobierania budów");
      return;
    }

    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setIsFormOpen(false);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editId ? `/api/budowy/${editId}` : "/api/budowy";
      const method = editId ? "PUT" : "POST";
      const payload = {
        numer: form.numer.trim(),
        nazwa: form.nazwa.trim(),
        lokalizacja: form.lokalizacja.trim(),
        inwestor: form.inwestor.trim(),
        kierownik: form.kierownik.trim(),
        status: form.status,
        data_rozpoczecia: form.data_rozpoczecia || null,
        data_zakonczenia: form.data_zakonczenia || null,
        uwagi: form.uwagi.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu budowy");

      reset();
      load();
    } catch (err) {
      setError(err.message || "Błąd zapisu budowy");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setIsFormOpen(true);
    setEditId(row.id);
    setForm({
      numer: row.numer ?? "",
      nazwa: row.nazwa ?? "",
      lokalizacja: row.lokalizacja ?? "",
      inwestor: row.inwestor ?? "",
      kierownik: row.kierownik ?? "",
      status: row.status ?? "planowana",
      data_rozpoczecia: row.data_rozpoczecia
        ? String(row.data_rozpoczecia).slice(0, 10)
        : "",
      data_zakonczenia: row.data_zakonczenia
        ? String(row.data_zakonczenia).slice(0, 10)
        : "",
      uwagi: row.uwagi ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Usunąć budowę?")) return;

    const res = await fetch(`/api/budowy/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || "Błąd usuwania budowy");
      return;
    }

    if (editId === id) reset();
    load();
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
      <h1>Budowy</h1>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId ? "Edytuj budowę" : "Dodaj budowę"}</h2>
            <p>
              {editId
                ? "Zaktualizuj dane wybranej budowy."
                : "Dodaj nową budowę i przygotuj ją do przypisania brygad oraz zasobów."}
            </p>
          </div>

          <button type="button" onClick={toggleForm}>
            <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
              <span className="formPanelToggleIcon" aria-hidden="true">
                {editId ? "•" : "+"}
              </span>
              <span>
                {isFormOpen
                  ? editId
                    ? "Tryb edycji"
                    : "Ukryj formularz"
                  : "Dodaj budowę"}
              </span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
          <form className="card" onSubmit={submit}>
            <div className="grid">
              <label>
                <span>Numer*</span>
                <input
                  value={form.numer}
                  onChange={(e) => setForm({ ...form, numer: e.target.value })}
                  required
                  placeholder="np. BD-2026-01"
                />
              </label>

              <label>
                <span>Nazwa*</span>
                <input
                  value={form.nazwa}
                  onChange={(e) => setForm({ ...form, nazwa: e.target.value })}
                  required
                  placeholder="np. Osiedle Zielone"
                />
              </label>

              <label>
                <span>Lokalizacja*</span>
                <input
                  value={form.lokalizacja}
                  onChange={(e) => setForm({ ...form, lokalizacja: e.target.value })}
                  required
                  placeholder="np. Warszawa, ul. Przemysłowa"
                />
              </label>

              <label>
                <span>Inwestor</span>
                <input
                  value={form.inwestor}
                  onChange={(e) => setForm({ ...form, inwestor: e.target.value })}
                  placeholder="np. XYZ Development"
                />
              </label>

              <label>
                <span>Kierownik</span>
                <input
                  value={form.kierownik}
                  onChange={(e) => setForm({ ...form, kierownik: e.target.value })}
                  placeholder="np. Jan Nowak"
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="planowana">planowana</option>
                  <option value="w_toku">w toku</option>
                  <option value="wstrzymana">wstrzymana</option>
                  <option value="zakonczona">zakończona</option>
                </select>
              </label>

              <label>
                <span>Data rozpoczęcia</span>
                <input
                  type="date"
                  value={form.data_rozpoczecia}
                  onChange={(e) =>
                    setForm({ ...form, data_rozpoczecia: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Data zakończenia</span>
                <input
                  type="date"
                  value={form.data_zakonczenia}
                  onChange={(e) =>
                    setForm({ ...form, data_zakonczenia: e.target.value })
                  }
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Uwagi</span>
                <textarea
                  rows={3}
                  value={form.uwagi}
                  onChange={(e) => setForm({ ...form, uwagi: e.target.value })}
                  placeholder="Krótki opis zakresu lub ważnych informacji..."
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
          <p>Brak budów</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Numer</th>
                <th>Nazwa</th>
                <th>Lokalizacja</th>
                <th>Status</th>
                <th>Kierownik</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Numer">{row.numer}</td>
                  <td data-label="Nazwa">{row.nazwa}</td>
                  <td data-label="Lokalizacja">{row.lokalizacja}</td>
                  <td data-label="Status">{row.status || "-"}</td>
                  <td data-label="Kierownik">{row.kierownik || "-"}</td>
                  <td className="actionsCell" data-label="Akcje">
                    <Link
                      href={`/pages/budowy/${row.id}`}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
