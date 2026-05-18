"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrygadyPage() {
  const router = useRouter();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ numer: "", brygadzista: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const fetchBrygady = async () => {
    setError("");

    try {
      setLoading(true);
      const res = await fetch("/api/brygady", { cache: "no-store" });
      const data = await res.json().catch(() => []);

      if (!res.ok) throw new Error(data?.error || "Błąd pobierania brygad");
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Błąd pobierania");
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
    setIsFormOpen(false);
    setError("");
  };

  const startEdit = (item) => {
    setError("");
    setIsFormOpen(true);
    setEditId(Number(item.id));
    setForm({
      numer: item.numer ?? "",
      brygadzista: item.brygadzista ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isEdit = editId !== null;
    const url = isEdit ? `/api/brygady/${editId}` : "/api/brygady";
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

    if (editId === Number(id)) resetForm();
    fetchBrygady();
  };

  const goDetails = (id) => {
    router.push(`/pages/brygady/${id}`);
  };

  const toggleForm = () => {
    if (editId !== null) {
      setIsFormOpen(true);
      return;
    }

    if (isFormOpen) {
      resetForm();
      return;
    }

    setIsFormOpen(true);
    setError("");
  };

  return (
    <div className="listPage">
      <div className="sectionIntro listPageIntro">
        <span className="rowEyebrow">Ewidencja</span>
        <h1>Brygady</h1>
        <p>Podgląd brygad i brygadzistów z szybkim przejściem do składu zespołu.</p>
      </div>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId !== null ? "Edytuj brygadę" : "Dodaj brygadę"}</h2>
            <p>
              {editId !== null
                ? "Zmień numer lub brygadzistę wybranej brygady."
                : "Utwórz nową brygadę i przypisz brygadzistę."}
            </p>
          </div>

          <button type="button" onClick={toggleForm}>
            <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
              <span className="formPanelToggleIcon" aria-hidden="true">
                {isFormOpen ? "-" : "+"}
              </span>
              <span>
                {isFormOpen
                  ? editId !== null
                    ? "Tryb edycji"
                    : "Ukryj formularz"
                  : "Dodaj brygadę"}
              </span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
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

            <div className="actions">
              <button type="submit">{editId !== null ? "Zapisz" : "Dodaj"}</button>
              <button type="button" className="secondary" onClick={resetForm}>
                Anuluj
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </section>

      <section className="detailsSection detailsHistorySection">
        <div className="detailsSectionHeader">
          <div className="sectionIntro">
            <span className="rowEyebrow">Lista</span>
            <h2>Brygady w ewidencji</h2>
            <p>Wszystkie brygady wraz z brygadzistami i prostymi akcjami zarządzania.</p>
          </div>
        </div>

        <div className="tableWrap">
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
                {list.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Numer brygady" style={{ fontWeight: 700 }}>
                      {item.numer}
                    </td>
                    <td data-label="Brygadzista">{item.brygadzista}</td>
                    <td className="actionsCell" data-label="Akcje">
                      <button type="button" className="info-btn" onClick={() => goDetails(item.id)}>
                        Szczegóły
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => startEdit(item)}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(item.id)}
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
      </section>
    </div>
  );
}
