"use client";
import { useState, useEffect } from "react";

export default function MaszynyPage() {
  const [maszyny, setMaszyny] = useState([]);
  const [form, setForm] = useState({
    Rozdaj: "",
    Marka: "",
    Typ: "",
    Przebieg: "",
    Ostatni_Serwix: "",
    Data_Kupna: "",
  });
  const [editId, setEditId] = useState(null);

  // 🔹 Pobieranie rekordów
  const fetchMaszyny = async () => {
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      console.log("✅ API GET:", data);
      setMaszyny(data); // <-- bez sprawdzania Array.isArray
    } catch (err) {
      console.error("❌ FetchMaszyny error:", err);
    }
  };

  useEffect(() => {
    fetchMaszyny();
  }, []);

  // 🔹 Dodawanie / Edycja
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editId ? `/api/resources/${editId}` : "/api/resources";
    const method = editId ? "PUT" : "POST";

    console.log("➡️ Sending:", { url, method, form });

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("⬅️ API RESPONSE:", data);

      if (!res.ok) {
        alert("Błąd API: " + (data.error || res.status));
        return;
      }

      // Reset formularza
      setForm({
        Rozdaj: "",
        Marka: "",
        Typ: "",
        Przebieg: "",
        Ostatni_Serwix: "",
        Data_Kupna: "",
      });
      setEditId(null);

      // Odśwież listę
      fetchMaszyny();
    } catch (err) {
      console.error("❌ Submit error:", err);
    }
  };

  // 🔹 Usuwanie
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const data = await res.json();
      console.log("🗑 Delete:", data);
      fetchMaszyny();
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  // 🔹 Edytowanie – wczytaj dane do formularza
  const handleEdit = (m) => {
    setForm({
      Rozdaj: m.Rozdaj,
      Marka: m.Marka,
      Typ: m.Typ,
      Przebieg: m.Przebieg,
      Ostatni_Serwix: m.Ostatni_Serwix,
      Data_Kupna: m.Data_Kupna ? m.Data_Kupna.slice(0, 10) : "",
    });
    setEditId(m.id);
  };

  return (
    <div>
      <h1>Maszyny 🚜</h1>

      {/* Formularz */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Rodzaj"
          value={form.Rozdaj}
          onChange={(e) => setForm({ ...form, Rozdaj: e.target.value })}
        />
        <input
          type="text"
          placeholder="Marka"
          value={form.Marka}
          onChange={(e) => setForm({ ...form, Marka: e.target.value })}
        />
        <input
          type="text"
          placeholder="Typ"
          value={form.Typ}
          onChange={(e) => setForm({ ...form, Typ: e.target.value })}
        />
        <input
          type="number"
          placeholder="Przebieg"
          value={form.Przebieg}
          onChange={(e) =>
            setForm({ ...form, Przebieg: Number(e.target.value) })
          }
        />
        <input
          type="number"
          placeholder="Ostatni serwis (km)"
          value={form.Ostatni_Serwix}
          onChange={(e) =>
            setForm({ ...form, Ostatni_Serwix: Number(e.target.value) })
          }
        />
        <input
          type="date"
          placeholder="Data kupna"
          value={form.Data_Kupna}
          onChange={(e) => setForm({ ...form, Data_Kupna: e.target.value })}
        />
        <button type="submit">{editId ? "Zapisz" : "Dodaj"}</button>
      </form>

      {/* Lista maszyn */}
      <ul>
        {maszyny.map((m) => (
          <li key={m.id}>
            <b>{m.Rozdaj}</b> – {m.Marka}, {m.Typ}, {m.Przebieg} km | Serwis:{" "}
            {m.Ostatni_Serwix} km | Kupiono: {m.Data_Kupna}
            <button onClick={() => handleEdit(m)}>✏️</button>
            <button onClick={() => handleDelete(m.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
