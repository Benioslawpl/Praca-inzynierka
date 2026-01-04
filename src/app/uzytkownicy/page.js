"use client";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "user",
    is_active: true,
  });

  const fetchUsers = async () => {
    setError("");
    const res = await fetch("/api/users", { cache: "no-store" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Błąd pobierania użytkowników");
      return;
    }
    setList(await res.json());
  };

  useEffect(() => { fetchUsers(); }, []);

  const addUser = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd dodawania");
      setForm({ username: "", password: "", email: "", role: "user", is_active: true });
      fetchUsers();
      alert(`Użytkownik dodany: ${data.username}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

 const toggleBlocked = async (id, blocked) => {
  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked: !blocked }),
  });
  if (res.ok) fetchUsers();
};

  const resetPassword = async (id) => {
    const newPass = prompt("Podaj nowe hasło dla użytkownika:");
    if (!newPass) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ reset_password: true, new_password: newPass }),
    });
    if (res.ok) {
      alert("Hasło zresetowane.");
      fetchUsers();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Błąd resetu hasła");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Na pewno usunąć użytkownika?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
  };

  return (
    <div>
      <h1>Użytkownicy </h1>

      <form className="card" onSubmit={addUser}>
    <div className="grid">
        <label>
            <span>Login*</span>
                <input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} required />
        </label>
        <label>
            <span>Hasło*</span>
                <input type="text" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
        </label>
        <label>
            <span>Rola</span>
                <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                </select>
        </label>
  </div>

  <div className="actions">
    <button type="submit" disabled={saving}>{saving ? "Zapisywanie..." : "Dodaj użytkownika"}</button>
  </div>



        {error && <p className="error">⚠ {error}</p>}
      </form>

      <div className="tableWrap">
        {list.length === 0 ? (
          <p>Brak użytkowników</p>
        ) : (
              <table className="table tableCenter">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Numer</th>
                    <th>Login</th>
                    <th style={{ width: 140 }}>Hasło</th>
                    <th style={{ width: 120 }}>Rola</th>
                    <th style={{ width: 180 }}>Data utworzenia</th>
                    <th style={{ width: 140 }}>Zablokowany</th>
                    <th style={{ width: 360 }}>Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {list.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>{u.username}</td>
                      <td>{"•".repeat(8)}</td>
                      <td>{u.role}</td>
                      <td>{u.created_at ? String(u.created_at).slice(0, 19).replace("T", " ") : "-"}</td>
                      <td>
                        <span className={`badge ${u.is_active ? "ok" : "bad"}`}>
                          {u.is_active ? "NIE" : "TAK"}
                        </span>
                      </td>

                      <td className="actionsCell">
                        <button
                              type="button"
                              className={u.is_active ? "danger" : "secondary"}
                              onClick={() => toggleBlocked(u.id, u.is_active)}
                            >
                              {u.is_active ? "Zablokuj" : "Odblokuj"}
                            </button>

                        <button type="button" onClick={() => resetPassword(u.id)}>Reset hasła</button>

                        <button type="button" className="danger" onClick={() => removeUser(u.id)}>
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