"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BrygadaDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ imie: "", nazwisko: "", rola: "", telefon: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  // 🔹 Pobiera nagłówek (brygadę)
const loadHeader = async () => {
  try {
    const res = await fetch(`/api/brygady/[id]/members/[memberId]`, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || "Błąd pobierania brygady");

    setHeader(data);
  } catch (e) {
    console.error(e);
    setHeader(null);
  }
};

  // 🔹 Pobiera członków
  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/brygady/${id}/members`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd pobierania członków");
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Nie udało się pobrać członków");
    }
  };

  useEffect(() => {
    loadHeader();
    loadMembers();
  }, [id]);

  // 🔹 Reset formularza
  const resetForm = () => {
    setForm({ imie: "", nazwisko: "", rola: "", telefon: "" });
    setEditId(null);
  };

  // 🔹 Zapis (dodanie / edycja)
const handleEdit = (m) => {
  // Ustalamy pewne ID (liczba), a do formularza bierzemy oba warianty kluczy
  const idNum = Number(m.id);
  setEditId(Number.isFinite(idNum) ? idNum : null);

  setForm({
    imie: m.imie ?? m.Imie ?? "",
    nazwisko: m.nazwisko ?? m.Nazwisko ?? "",
    rola: m.rola ?? m.Rola ?? "",
    telefon: m.telefon ?? m.Telefon ?? "",
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const isEdit = Number.isFinite(Number(editId));
  const url = isEdit
    ? `/api/brygady/${id}/members/${editId}`
    : `/api/brygady/${id}/members`;
  const method = isEdit ? "PUT" : "POST";

  const payload = {
    imie: form.imie,
    nazwisko: form.nazwisko,
    rola: form.rola || null,
    telefon: form.telefon || null,
  };

  // Debug (na chwilę, zobacz w konsoli)
  console.log("[SAVE]", { method, url, payload });

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = {};
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    console.warn("[SAVE:ERR]", res.status, data);
    setError(data?.error || `Błąd ${res.status}`);
    return;
  }

  setEditId(null);
  setForm({ imie: "", nazwisko: "", rola: "", telefon: "" });
  loadMembers();
};

const handleDelete = async (memberId) => {
  if (!confirm("Na pewno usunąć?")) return;

  const url = `/api/brygady/${id}/members/${Number(memberId)}`;
  console.log("[DELETE]", url);

  const res = await fetch(url, { method: "DELETE" });

  let data = {};
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    console.warn("[DEL:ERR]", res.status, data);
    setError(data?.error || `Błąd ${res.status}`);
    return;
  }
  loadMembers();
};
  return (
    <div>
      <button className="secondary" onClick={() => router.push("/pages/brygady")}>
  ← Wróć do listy
</button>

<h1>Szczegóły brygady</h1>
{/* ...nagłówek bez zmian... */}

<h2>Członkowie</h2>

<form className="card" onSubmit={handleSubmit}>
  {/* ...formularz bez zmian... */}
</form>

<div className="tableWrap">
  {members.length === 0 ? (
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
        {members.map((m, i) => (
          <tr key={m.id}>
            <td>{i + 1}</td>
            <td>{m.Imie ?? m.imie ?? "-"}</td>
            <td>{m.Nazwisko ?? m.nazwisko ?? "-"}</td>
            <td>{m.Rola ?? m.rola ?? "-"}</td>
            <td>{m.Telefon ?? m.telefon ?? "-"}</td>
            <td className="actionsCell">
              <button type="button" onClick={() => handleEdit(m)}>✏️</button>
              <button
                type="button"
                className="danger"
                onClick={() => handleDelete(m.id)}
              >
                🗑
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
