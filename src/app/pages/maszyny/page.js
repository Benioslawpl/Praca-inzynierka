"use client";
import { useEffect, useMemo, useState } from "react";

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  // Uwaga: nazwy pól zgodne z DB (masz kolumnę "Rozdaj", nie "Rodzaj")
  const emptyForm = useMemo(
    () => ({
      Rozdaj: "",
      Marka: "",
      Typ: "",
      Przebieg: "",
      Ostatni_Serwix: "",
      Data_Kupna: "",
    }),
    []
  );
  const [form, setForm] = useState(emptyForm);

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/maszyny");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd pobierania");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // prosta walidacja
    if (!form.Rozdaj || !form.Marka || !form.Typ) {
      setSaving(false);
      return setError("Uzupełnij: Rozdaj, Marka, Typ.");
    }
    if (form.Przebieg !== "" && Number.isNaN(Number(form.Przebieg))) {
      setSaving(false);
      return setError("Przebieg musi być liczbą.");
    }
    if (form.Ostatni_Serwix !== "" && Number.isNaN(Number(form.Ostatni_Serwix))) {
      setSaving(false);
      return setError("Ostatni serwis (km) musi być liczbą.");
    }

    const payload = {
      ...form,
      // upewnij się, że liczby lecą jako Number
      Przebieg: form.Przebieg === "" ? null : Number(form.Przebieg),
      Ostatni_Serwix: form.Ostatni_Serwix === "" ? null : Number(form.Ostatni_Serwix),
      // Data_Kupna: "YYYY-MM-DD" – <input type="date"> już to zapewnia
    };

    const url = editId ? `/api/maszyny/${editId}` : "/api/maszyny";
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      resetForm();
      await fetchRows();
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
    if (!confirm("Na pewno usunąć tę maszynę?")) return;
    setError("");
    try {
      const res = await fetch(`/api/maszyny/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd usuwania");
      await fetchRows();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h1>Maszyny 🚜</h1>

      {/* Formularz dodawania/edycji */}
      <form className="form" onSubmit={handleSubmit}>
        <div className="grid">
          <label>
            <span>Rozdaj*</span>
            <input
              type="text"
              value={form.Rozdaj}
              onChange={(e) => setForm({ ...form, Rozdaj: e.target.value })}
              placeholder="np. Koparka"
              required
            />
          </label>
          <label>
            <span>Marka*</span>
            <input
              type="text"
              value={form.Marka}
              onChange={(e) => setForm({ ...form, Marka: e.target.value })}
              placeholder="np. CAT"
              required
            />
          </label>
          <label>
            <span>Typ*</span>
            <input
              type="text"
              value={form.Typ}
              onChange={(e) => setForm({ ...form, Typ: e.target.value })}
              placeholder="np. 320D"
              required
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
            <button type="button" className="secondary" onClick={resetForm}>
              Anuluj edycję
            </button>
          )}
        </div>

        {error && <p className="error">⚠ {error}</p>}
      </form>

      {/* Lista w tabeli */}
      <div className="table-wrap">
        {loading ? (
          <p>Ładowanie…</p>
        ) : rows.length === 0 ? (
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
                <th style={{ width: 160 }}>Akcje</th>
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
                  <td>
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

      <style jsx>{`
        .form {
          margin: 16px 0 24px;
          padding: 12px;
          background: #f7f7f9;
          border: 1px solid #e5e5ea;
          border-radius: 8px;
        }
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
        }
        input {
          padding: 8px 10px;
          border: 1px solid #d0d0d7;
          border-radius: 6px;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }
        button {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: #0070f3;
          color: #fff;
          cursor: pointer;
        }
        button.secondary {
          background: #70757a;
        }
        button.danger {
          background: #d32f2f;
        }
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error {
          color: #d32f2f;
          margin-top: 8px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border: 1px solid #e5e5ea;
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
          text-align: left;
          font-size: 14px;
        }
        thead th {
          background: #f0f2f5;
          font-weight: 700;
        }
        tbody tr:hover {
          background: #fafafa;
        }
      `}</style>
    </div>
  );
}
