"use client";

import { useEffect, useMemo, useState } from "react";

export default function SprzetPage() {
  const [rows, setRows] = useState([]);
  const [brygady, setBrygady] = useState([]);
  const [form, setForm] = useState({
    rodzaj: "",
    marka: "",
    model: "",
    brygadzista: "",
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const brygadzisci = useMemo(() => {
    const seen = new Set();
    return brygady.filter((item) => {
      const name = item?.brygadzista?.trim();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [brygady]);

  const load = async () => {
    setError("");

    const [sprzetRes, brygadyRes] = await Promise.all([
      fetch("/api/sprzet", { cache: "no-store" }),
      fetch("/api/brygady", { cache: "no-store" }),
    ]);

    const sprzetData = await sprzetRes.json().catch(() => ({}));
    const brygadyData = await brygadyRes.json().catch(() => ({}));

    if (!sprzetRes.ok) {
      setRows([]);
      setError(sprzetData?.error || "Błąd pobierania sprzętu");
    } else {
      setRows(Array.isArray(sprzetData) ? sprzetData : []);
    }

    if (!brygadyRes.ok) {
      setBrygady([]);
      setError((prev) => prev || brygadyData?.error || "Błąd pobierania brygad");
    } else {
      setBrygady(Array.isArray(brygadyData) ? brygadyData : []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.brygadzista && brygadzisci[0]?.brygadzista) {
      setForm((current) => ({
        ...current,
        brygadzista: current.brygadzista || brygadzisci[0].brygadzista,
      }));
    }
  }, [brygadzisci, form.brygadzista]);

  const reset = () => {
    setForm({
      rodzaj: "",
      marka: "",
      model: "",
      brygadzista: brygadzisci[0]?.brygadzista || "",
    });
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
        brygadzista: form.brygadzista.trim(),
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
      brygadzista: row.brygadzista ?? "",
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
            <span>Brygadzista*</span>
            <select
              value={form.brygadzista}
              onChange={(e) =>
                setForm({ ...form, brygadzista: e.target.value })
              }
              required
              disabled={brygadzisci.length === 0}
            >
              {brygadzisci.length === 0 ? (
                <option value="">Brak dostępnych brygadzistów</option>
              ) : (
                brygadzisci.map((item) => (
                  <option key={item.id} value={item.brygadzista}>
                    {item.brygadzista} ({item.numer})
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        <div className="actions">
          <button type="submit" disabled={saving || brygadzisci.length === 0}>
            {saving ? "Zapisywanie..." : editId ? "Zapisz" : "Dodaj"}
          </button>

          {editId && (
            <button type="button" className="secondary" onClick={reset}>
              Anuluj
            </button>
          )}
        </div>

        {brygadzisci.length === 0 && !error && (
          <p className="error">
            Najpierw dodaj przynajmniej jedną brygadę z przypisanym
            brygadzistą.
          </p>
        )}

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
                <th>Brygadzista</th>
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
                    <td data-label="Brygadzista">{row.brygadzista}</td>

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
