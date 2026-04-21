"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrygadyPage() {
  const router = useRouter();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ numer: "", brygadzista: "" });
  const [editId, setEditId] = useState(null); // null = dodawanie, number = edycja
  const [error, setError] = useState("");

  const fetchBrygady = async () => {
    setError("");
    try {
      setLoading(true);
      const res = await fetch("/api/brygady", { cache: "no-store" });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error(data?.error || "Błąd pobierania brygad");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Błąd pobierania");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrygady();
  }, []);

  const resetForm = () => {
    setForm({ numer: "", brygadzista: "" });
    setEditId(null);
    setError("");
  };

  const startEdit = (b) => {
    setError("");
    setEditId(Number(b.id)); // pewne ID
    setForm({
      numer: b.numer ?? "",
      brygadzista: b.brygadzista ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isEdit = editId !== null; // ✅ najważniejsze (nie Number(editId))
    const url = isEdit ? `/api/brygady/${editId}` : `/api/brygady`;
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      numer: form.numer?.trim(),
      brygadzista: form.brygadzista?.trim(),
    };

    if (!payload.numer) return setError("Wymagane: numer");
    if (!payload.brygadzista) return setError("Wymagane: brygadzista");

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || `Błąd ${res.status}`);
      return;
    }

    resetForm();
    fetchBrygady();
  };

  const handleDelete = async (id) => {
    if (!confirm("Na pewno usunąć brygadę?")) return;

    const res = await fetch(`/api/brygady/${Number(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || `Błąd ${res.status}`);
      return;
    }

    // jeśli usuwasz aktualnie edytowaną — wyczyść formularz
    if (editId === Number(id)) resetForm();

    fetchBrygady();
  };

  const goDetails = (id) => {
    // dopasuj do swojej ścieżki szczegółów
    router.push(`/pages/brygady/${id}`);
  };

  return (
    <div>
      <h1>Brygady</h1>

      <form className="card" onSubmit={handleSubmit}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <label>
            <span>Numer*</span>
            <input
              placeholder="np. B-01"
              value={form.numer}
              onChange={(e) => setForm({ ...form, numer: e.target.value })}
              required
            />
          </label>

          <label>
            <span>Brygadzista*</span>
            <input
              placeholder="Imię i nazwisko"
              value={form.brygadzista}
              onChange={(e) => setForm({ ...form, brygadzista: e.target.value })}
              required
            />
          </label>
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button type="submit">{editId !== null ? "Zapisz" : "Dodaj"}</button>
          {editId !== null && (
            <button type="button" className="secondary" onClick={resetForm}>
              Anuluj
            </button>
          )}
        </div>

        {error && <p className="error">⚠ {error}</p>}
      </form>

      <div className="tableWrap" style={{ marginTop: 16 }}>
        {loading ? (
          <p>Ładowanie...</p>
        ) : list.length === 0 ? (
          <p>Brak brygad</p>
        ) : (
          <table className="table tableCenter">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Numer brygady</th>
                <th>Brygadzista</th>
                <th style={{ width: 360 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td data-label="Numer brygady" style={{ fontWeight: 700 }}>{b.numer}</td>
                  <td data-label="Brygadzista">{b.brygadzista}</td>
                  <td className="actionsCell" data-label="Akcje">
                    <button type="button" className="secondary" onClick={() => goDetails(b.id)}>
                      ℹ
                    </button>
                    <button type="button" onClick={() => startEdit(b)}>
                      ✏️ Edytuj
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(b.id)}>
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
