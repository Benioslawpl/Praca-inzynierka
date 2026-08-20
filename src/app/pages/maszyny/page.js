"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  nr: "",
  rodzaj: "",
  marka: "",
  model: "",
  assigned_operator_id: "",
  serwis_co_ile_mth: "",
};

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [operators, setOperators] = useState([]);
  const [me, setMe] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");

    const [machinesRes, meRes, usersRes] = await Promise.all([
      fetch("/api/maszyny", { cache: "no-store" }),
      fetch("/api/me", { cache: "no-store" }),
      fetch("/api/users/operatorzy", { cache: "no-store" }),
    ]);

    const [machinesData, meData, usersData] = await Promise.all([
      machinesRes.json().catch(() => ({})),
      meRes.json().catch(() => ({})),
      usersRes.json().catch(() => ([])),
    ]);

    if (!machinesRes.ok) {
      setRows([]);
      setError(machinesData?.error || "Błąd pobierania");
    } else {
      setRows(Array.isArray(machinesData) ? machinesData : []);
    }

    setMe(meData?.ok ? meData : null);

    setOperators(usersRes.ok && Array.isArray(usersData) ? usersData : []);
  };

  useEffect(() => {
    load();
  }, []);

  const canManage = me?.role !== "operator";

  const operatorOptions = useMemo(() => operators, [operators]);

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
      const url = editId ? `/api/maszyny/${editId}` : "/api/maszyny";
      const method = editId ? "PUT" : "POST";
      const payload = {
        nr: form.nr.trim(),
        rodzaj: form.rodzaj.trim(),
        marka: form.marka.trim(),
        model: form.model.trim(),
        assigned_operator_id: form.assigned_operator_id
          ? Number(form.assigned_operator_id)
          : null,
        serwis_co_ile_mth:
          form.serwis_co_ile_mth === "" ? null : Number(form.serwis_co_ile_mth),
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
      nr: row.nr ?? "",
      rodzaj: row.rodzaj ?? "",
      marka: row.marka ?? "",
      model: row.model ?? "",
      assigned_operator_id: row.assigned_operator_id ? String(row.assigned_operator_id) : "",
      serwis_co_ile_mth: row.serwis_co_ile_mth ?? "",
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
    <div className="listPage">
      <div className="sectionIntro listPageIntro">
        <span className="rowEyebrow">Ewidencja</span>
        <h1>Maszyny</h1>
        <p>Przegląd maszyn, operatorów i ustawień serwisowych w jednym spójnym widoku.</p>
      </div>

      {canManage ? (
        <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
          <div className="formPanelHeader">
            <div>
              <h2>{editId ? "Edytuj maszynę" : "Dodaj maszynę"}</h2>
              <p>
                {editId
                  ? "Zaktualizuj dane maszyny, serwis i przypisane konto operatora."
                  : "Dodaj nową maszynę do ewidencji."}
              </p>
            </div>

            <button type="button" onClick={toggleForm}>
              <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
                <span className="formPanelToggleIcon" aria-hidden="true">
                  {isFormOpen ? "−" : "+"}
                </span>
                <span>
                  {isFormOpen
                    ? editId
                      ? "Tryb edycji"
                      : "Ukryj formularz"
                    : "Dodaj maszynę"}
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
                    value={form.nr}
                    onChange={(e) => setForm({ ...form, nr: e.target.value })}
                    required
                    placeholder="np. M-01"
                  />
                </label>

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
                  <select
                    value={form.assigned_operator_id}
                    onChange={(e) =>
                      setForm({ ...form, assigned_operator_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Wybierz operatora</option>
                    {operatorOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.username}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Serwis co ile mth</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.serwis_co_ile_mth}
                    onChange={(e) =>
                      setForm({ ...form, serwis_co_ile_mth: e.target.value })
                    }
                    placeholder="np. 250"
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
      ) : null}

      <section className="detailsSection detailsHistorySection">
        <div className="detailsSectionHeader">
          <div className="sectionIntro">
            <span className="rowEyebrow">Lista</span>
            <h2>Maszyny w ewidencji</h2>
            <p>Wszystkie dostępne rekordy z szybkim przejściem do szczegółów.</p>
          </div>
        </div>

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
                <th>Konto operatora</th>
                <th>Serwis</th>
                <th style={{ width: 360 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                return (
                  <tr key={row.id}>
                    <td data-label="Numer">{row.nr || "-"}</td>
                    <td data-label="Rodzaj">{row.rodzaj}</td>
                    <td data-label="Marka">{row.marka}</td>
                    <td data-label="Model">{row.model}</td>
                    <td data-label="Operator">{row.operator}</td>
                    <td data-label="Konto operatora">
                      {row.assigned_operator_username || "-"}
                    </td>
                    <td data-label="Serwis">
                      {row.serwis_co_ile_mth ? `co ${row.serwis_co_ile_mth} mth` : "brak"}
                    </td>
                    <td className="actionsCell" data-label="Akcje">
                      <Link
                        href={`/pages/maszyny/${row.id}`}
                        className="info-btn"
                        title="Szczegóły"
                      >
                        Szczegóły
                      </Link>
                      {canManage ? (
                        <>
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
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </section>
    </div>
  );
}
