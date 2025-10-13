"use client";
import { useEffect, useState } from "react";

export default function MaszynyPage() {
  const [rows, setRows] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    Rozdaj: "",
    Marka: "",
    Typ: "",
    Przebieg: "",
    Ostatni_Serwix: "",
    Data_Kupna: "",
  });

  const fetchRows = async () => {
    const res = await fetch("/api/maszyny");
    const data = await res.json();
    setRows(data);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/maszyny/${editId}` : "/api/maszyny";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        Przebieg: form.Przebieg === "" ? null : Number(form.Przebieg),
        Ostatni_Serwix: form.Ostatni_Serwix === "" ? null : Number(form.Ostatni_Serwix),
      }),
    });

    setForm({
      Rozdaj: "",
      Marka: "",
      Typ: "",
      Przebieg: "",
      Ostatni_Serwix: "",
      Data_Kupna: "",
    });
    setEditId(null);
    fetchRows();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/maszyny/${id}`, { method: "DELETE" });
    fetchRows();
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

  return (
    <div>
      <h1>Maszyny</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <input placeholder="Rozdaj" value={form.Rozdaj} onChange={(e) => setForm({ ...form, Rozdaj: e.target.value })} />
        <input placeholder="Marka" value={form.Marka} onChange={(e) => setForm({ ...form, Marka: e.target.value })} />
        <input placeholder="Typ" value={form.Typ} onChange={(e) => setForm({ ...form, Typ: e.target.value })} />
        <input type="number" placeholder="Przebieg" value={form.Przebieg} onChange={(e) => setForm({ ...form, Przebieg: e.target.value })} />
        <input type="number" placeholder="Ostatni serwis (km)" value={form.Ostatni_Serwix} onChange={(e) => setForm({ ...form, Ostatni_Serwix: e.target.value })} />
        <input type="date" placeholder="Data kupna" value={form.Data_Kupna} onChange={(e) => setForm({ ...form, Data_Kupna: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{editId ? "Zapisz" : "Dodaj"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ Rozdaj:"", Marka:"", Typ:"", Przebieg:"", Ostatni_Serwix:"", Data_Kupna:"" }); }}>Anuluj</button>}
        </div>
      </form>

      <ul style={{ marginTop: 16 }}>
        {rows.map((r) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            <b>{r.Rozdaj}</b> — {r.Marka}, {r.Typ}, {r.Przebieg} km | serwis: {r.Ostatni_Serwix} km | kupiono: {r.Data_Kupna ? String(r.Data_Kupna).slice(0,10) : ""}
            <span style={{ marginLeft: 8 }}>
              <button onClick={() => handleEdit(r)}>Edytuj</button>
              <button onClick={() => handleDelete(r.id)} style={{ marginLeft: 6 }}>Usuń</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
