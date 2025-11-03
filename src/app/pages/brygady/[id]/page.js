"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BrygadaDetails() {
  const { id } = useParams();
  const [header, setHeader] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ Imie:"", Nazwisko:"", Rola:"", Telefon:"" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const loadHeader = async () => {
    const list = await fetch("/api/brygady").then(r=>r.json()).catch(()=>[]);
    const found = Array.isArray(list) ? list.find(x => String(x.id) === String(id)) : null;
    setHeader(found || null);
  };
  const loadMembers = async () => {
    const res = await fetch(`/api/brygady/${id}/members`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || "Błąd pobierania członków");
    setMembers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadHeader(); loadMembers(); }, [id]);

  const reset = () => { setForm({ Imie:"", Nazwisko:"", Rola:"", Telefon:"" }); setEditId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const url = editId ? `/api/brygady/${id}/members/${editId}` : `/api/brygady/${id}/members`;
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const data = await res.json().catch(()=> ({}));
    if (!res.ok) return setError(data?.error || "Błąd zapisu");
    reset(); loadMembers();
  };

  const edit = (m) => { setEditId(m.id); setForm({ Imie:m.Imie, Nazwisko:m.Nazwisko, Rola:m.Rola||"", Telefon:m.Telefon||"" }); };
  const del  = async (memberId) => {
    if (!confirm("Usunąć członka?")) return;
    const res = await fetch(`/api/brygady/${id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) loadMembers();
  };

  return (
    <div>
      <p><Link href="/brygady">← Wróć do listy</Link></p>
      <h1>Szczegóły brygady</h1>
      {header ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <b>Numer:</b> {header.numer} &nbsp;|&nbsp; <b>Brygadzista:</b> {header.brygadzista}
        </div>
      ) : <p>Ładowanie...</p>}

      <h2>Członkowie</h2>
      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label><span>Imię*</span>
            <input value={form.Imie} onChange={e=>setForm({...form, Imie:e.target.value})} required />
          </label>
          <label><span>Nazwisko*</span>
            <input value={form.Nazwisko} onChange={e=>setForm({...form, Nazwisko:e.target.value})} required />
          </label>
          <label><span>Rola</span>
            <input value={form.Rola} onChange={e=>setForm({...form, Rola:e.target.value})} placeholder="np. Operator" />
          </label>
          <label><span>Telefon</span>
            <input value={form.Telefon} onChange={e=>setForm({...form, Telefon:e.target.value})} placeholder="+48 ..." />
          </label>
        </div>
        <div className="actions">
          <button type="submit">{editId ? "Zapisz" : "Dodaj"}</button>
          {editId && <button type="button" className="secondary" onClick={reset}>Anuluj</button>}
        </div>
        {error && <p className="error">⚠ {error}</p>}
      </form>

      <div className="tableWrap">
        {members.length === 0 ? (
          <p>Brak członków</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Imię</th><th>Nazwisko</th><th>Rola</th><th>Telefon</th><th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.Imie}</td>
                  <td>{m.Nazwisko}</td>
                  <td>{m.Rola || "-"}</td>
                  <td>{m.Telefon || "-"}</td>
                  <td className="actionsCell">
                    <button onClick={() => edit(m)}>✏️</button>
                    <button className="danger" onClick={() => del(m.id)}>🗑</button>
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