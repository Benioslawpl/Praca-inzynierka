"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BrygadaDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    imie: "",
    nazwisko: "",
    rola: "",
    telefon: "",
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const validId = Number.isInteger(Number(id)) && Number(id) > 0;

  useEffect(() => {
    setErr("");

    if (!validId) {
      setItems([]);
      setHeader(null);
      setErr("Nieprawidłowe ID brygady w adresie URL.");
      return;
    }

    const loadHeader = async () => {
      const list = await fetch("/api/brygady", { cache: "no-store" })
        .then((res) => res.json())
        .catch(() => []);
      const found = Array.isArray(list)
        ? list.find((item) => String(item.id) === String(id))
        : null;
      setHeader(found || null);
    };

    const loadMembers = async () => {
      const res = await fetch(`/api/brygady/${id}/members`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || "Błąd pobierania członków");
        setItems([]);
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    };

    loadHeader();
    loadMembers();
  }, [id, validId]);

  const loadMembers = async () => {
    if (!validId) return;

    const res = await fetch(`/api/brygady/${id}/members`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(data?.error || "Błąd pobierania członków");
      setItems([]);
      return;
    }

    setItems(Array.isArray(data) ? data : []);
  };

  const reset = () => {
    setForm({ imie: "", nazwisko: "", rola: "", telefon: "" });
    setEditId(null);
    setIsFormOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validId) return;

    setSaving(true);
    setErr("");

    try {
      if (!form.imie?.trim() || !form.nazwisko?.trim()) {
        throw new Error("Wymagane: imię i nazwisko");
      }

      const body = {
        imie: form.imie.trim(),
        nazwisko: form.nazwisko.trim(),
        rola: form.rola?.trim() || null,
        telefon: form.telefon?.trim() || null,
      };

      const isEdit = editId !== null;
      const url = isEdit
        ? `/api/brygady/${id}/members/${editId}`
        : `/api/brygady/${id}/members`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      loadMembers();
    } catch (error) {
      setErr(error.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member) => {
    const memberId = Number(member.id);
    setIsFormOpen(true);
    setEditId(Number.isInteger(memberId) ? memberId : null);
    setForm({
      imie: member.imie ?? member.Imie ?? "",
      nazwisko: member.nazwisko ?? member.Nazwisko ?? "",
      rola: member.rola ?? member.Rola ?? "",
      telefon: member.telefon ?? member.Telefon ?? "",
    });
  };

  const handleDelete = async (memberId) => {
    if (!validId) return;
    if (!confirm("Usunąć członka?")) return;

    const numericId = Number(memberId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setErr("Nieprawidłowe ID członka.");
      return;
    }

    const res = await fetch(`/api/brygady/${id}/members/${numericId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(data?.error || "Błąd usuwania");
      return;
    }

    if (editId === numericId) reset();
    loadMembers();
  };

  const toggleForm = () => {
    if (editId !== null) {
      setIsFormOpen(true);
      return;
    }

    if (isFormOpen) {
      reset();
      return;
    }

    setIsFormOpen(true);
    setErr("");
  };

  return (
    <div>
      <button
        type="button"
        className="secondary"
        onClick={() => router.push("/pages/brygady")}
      >
        Wróć do listy
      </button>

      <h1>Szczegóły brygady</h1>

      {header ? (
        <div className="card detailsSummary" style={{ marginBottom: 16 }}>
          <div className="detailsSummaryContent">
            <div className="detailsSummaryLine">
              <b>Numer:</b> <span>{header.numer}</span>
              <b>Brygadzista:</b> <span>{header.brygadzista}</span>
            </div>
          </div>
        </div>
      ) : (
        <p>Ładowanie...</p>
      )}

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId !== null ? "Edytuj członka" : "Dodaj członka"}</h2>
            <p>
              {editId !== null
                ? "Zmień dane wybranego członka brygady."
                : "Dodaj nową osobę do tej brygady."}
            </p>
          </div>

          <button type="button" onClick={toggleForm}>
            <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
              <span className="formPanelToggleIcon" aria-hidden="true">
                {editId !== null ? "•" : "+"}
              </span>
              <span>
                {isFormOpen
                  ? editId !== null
                    ? "Tryb edycji"
                    : "Ukryj formularz"
                  : "Dodaj członka"}
              </span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
          <form className="card" onSubmit={submit}>
            <div className="grid">
              <label>
                <span>Imię*</span>
                <input
                  value={form.imie}
                  onChange={(e) => setForm({ ...form, imie: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Nazwisko*</span>
                <input
                  value={form.nazwisko}
                  onChange={(e) => setForm({ ...form, nazwisko: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Rola</span>
                <input
                  value={form.rola}
                  onChange={(e) => setForm({ ...form, rola: e.target.value })}
                  placeholder="np. Operator"
                />
              </label>

              <label>
                <span>Telefon</span>
                <input
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  placeholder="+48 ..."
                />
              </label>
            </div>

            <div className="actions">
              <button type="submit" disabled={saving}>
                {saving ? "Zapisywanie..." : editId !== null ? "Zapisz" : "Dodaj"}
              </button>
              <button type="button" className="secondary" onClick={reset}>
                Anuluj
              </button>
            </div>

            {err && <p className="error">{err}</p>}
          </form>
        </div>
      </section>

      <h2>Członkowie</h2>

      <div className="tableWrap">
        {items.length === 0 ? (
          <p>Brak członków</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Lp.</th>
                <th>Imię</th>
                <th>Nazwisko</th>
                <th>Rola</th>
                <th>Telefon</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {items.map((member, index) => (
                <tr key={member.id}>
                  <td data-label="Lp.">{index + 1}</td>
                  <td data-label="Imię">{member.imie ?? member.Imie ?? "-"}</td>
                  <td data-label="Nazwisko">{member.nazwisko ?? member.Nazwisko ?? "-"}</td>
                  <td data-label="Rola">{member.rola ?? member.Rola ?? "-"}</td>
                  <td data-label="Telefon">{member.telefon ?? member.Telefon ?? "-"}</td>
                  <td className="actionsCell" data-label="Akcje">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleEdit(member)}
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(member.id)}
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
