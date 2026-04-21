"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MaszynaDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);

  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = {
    przebieg: "",
    awaria: "",
    wykonawca: "",
    uwagi: "",
    data_zdarzenia: today,
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const loadDetails = async (machineId) => {
    const res = await fetch(`/api/maszyny/${machineId}/details`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(data?.error || "Błąd pobierania");
      setItems([]);
      return;
    }

    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setErr("");

      const [headerRes, detailsRes] = await Promise.all([
        fetch(`/api/maszyny/${id}`, { cache: "no-store" })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .catch(() => ({ ok: false, data: null })),
        fetch(`/api/maszyny/${id}/details`, { cache: "no-store" })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .catch(() => ({ ok: false, data: null })),
      ]);

      if (cancelled) return;

      if (headerRes.ok) {
        setHeader(headerRes.data);
      } else {
        setHeader(null);
      }

      if (detailsRes.ok) {
        setItems(Array.isArray(detailsRes.data) ? detailsRes.data : []);
      } else {
        setItems([]);
        setErr(detailsRes.data?.error || "Błąd pobierania");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reset = () => {
    setForm(emptyForm);
    setEditId(null);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      const body = {
        przebieg: form.przebieg === "" ? null : Number(form.przebieg),
        awaria: form.awaria?.trim() || null,
        wykonawca: form.wykonawca?.trim() || null,
        uwagi: form.uwagi?.trim() || null,
        data_zdarzenia: form.data_zdarzenia || null,
      };

      const url = editId
        ? `/api/maszyny/${id}/details/${editId}`
        : `/api/maszyny/${id}/details`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      await loadDetails(id);
    } catch (e2) {
      setErr(e2.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const edit = (it) => {
    setEditId(it.id);
    setForm({
      przebieg: it.przebieg ?? "",
      awaria: it.awaria ?? "",
      wykonawca: it.wykonawca ?? "",
      uwagi: it.uwagi ?? "",
      data_zdarzenia: it.data_zdarzenia
        ? String(it.data_zdarzenia).slice(0, 10)
        : today,
    });
  };

  const del = async (detailId) => {
    if (!confirm("Usunąć wpis?")) return;

    const res = await fetch(`/api/maszyny/${id}/details/${detailId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await loadDetails(id);
      return;
    }

    const d = await res.json().catch(() => ({}));
    setErr(d?.error || "Błąd usuwania");
  };

  return (
    <div>
      <button
        type="button"
        className="secondary"
        onClick={() => router.push("/pages/maszyny")}
      >
        Wróć do listy
      </button>

      <h1>Szczegóły maszyny</h1>

      {header ? (
        <div className="card detailsSummary" style={{ marginBottom: 16 }}>
          <div className="detailsSummaryContent">
            <div className="detailsSummaryLine">
              <b>Nr:</b> <span>{header.nr ?? "-"}</span>
              <b>Rodzaj:</b> <span>{header.rodzaj}</span>
            </div>
            <div className="detailsSummaryLine">
              <b>Marka/Model:</b> <span>{header.marka} {header.model}</span>
              <b>Operator:</b> <span>{header.operator}</span>
            </div>
          </div>
        </div>
      ) : (
        <p>Ładowanie...</p>
      )}

      <h2>{editId ? "Edytuj zdarzenie" : "Nowe zdarzenie"}</h2>

      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>
            <span>Data zdarzenia</span>
            <input
              type="date"
              value={form.data_zdarzenia}
              onChange={(e) =>
                setForm({ ...form, data_zdarzenia: e.target.value })
              }
              required
            />
          </label>

          <label>
            <span>Przebieg (mth)</span>
            <input
              type="number"
              value={form.przebieg}
              onChange={(e) => setForm({ ...form, przebieg: e.target.value })}
              min="0"
              placeholder="np. 12500"
            />
          </label>

          <label>
            <span>Awaria</span>
            <input
              value={form.awaria}
              onChange={(e) =>
                setForm({ ...form, awaria: e.target.value.slice(0, 30) })
              }
              placeholder="np. Uszkodzony wąż"
            />
          </label>

          <label>
            <span>Wykonawca</span>
            <input
              value={form.wykonawca}
              onChange={(e) =>
                setForm({ ...form, wykonawca: e.target.value })
              }
              placeholder="np. Serwis XYZ"
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <span>Uwagi</span>
            <textarea
              value={form.uwagi}
              onChange={(e) =>
                setForm({ ...form, uwagi: e.target.value.slice(0, 200) })
              }
              rows={3}
              placeholder="Krótki opis zdarzenia..."
              style={{
                width: "100%",
                resize: "vertical",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #cfd4dc",
                background: "#fff",
              }}
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

        {err && <p className="error">{err}</p>}
      </form>

      <h2>Historia zdarzeń</h2>

      <div className="tableWrap">
        {items.length === 0 ? (
          <p>Brak wpisów</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Przebieg</th>
                <th>Awaria</th>
                <th>Wykonawca</th>
                <th>Uwagi</th>
                <th>Akcje</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td data-label="Data">
                    {it.data_zdarzenia
                      ? String(it.data_zdarzenia).slice(0, 10)
                      : "-"}
                  </td>
                  <td data-label="Przebieg">{it.przebieg ?? "-"}</td>
                  <td data-label="Awaria">{it.awaria || "-"}</td>
                  <td data-label="Wykonawca">{it.wykonawca || "-"}</td>
                  <td
                    data-label="Uwagi"
                    style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}
                  >
                    {it.uwagi || "-"}
                  </td>
                  <td className="actionsCell" data-label="Akcje">
                    <button type="button" onClick={() => edit(it)}>
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => del(it.id)}
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
