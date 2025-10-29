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

  const toggleActive = async (id, isActive) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ is_active: !isActive }),
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
      <h1>Użytkownicy 👥</h1>

      <form className="card" onSubmit={addUser}>
        <div className="grid">
          <label>
            <span>Login*</span>
            <input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} required />
          </label>
          <label>
            <span>Hasło*</span>
            <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
          </label>
          <label>
            <span>Rola</span>
            <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            <span>Aktywne</span>
            <select value={form.is_active ? "1" : "0"} onChange={(e)=>setForm({...form, is_active: e.target.value === "1"})}>
              <option value="1">tak</option>
              <option value="0">nie</option>
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
          <table className="table">
            <thead>
              <tr>
                <th>Nr</th>
                <th>Login</th>
                <th>Email</th>
                <th>Rola</th>
                <th>Aktywny</th>
                <th>Ostatnie logowanie</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? "tak" : "nie"}</td>
                  <td>{u.last_login ? String(u.last_login).slice(0, 19).replace("T"," ") : "-"}</td>
                  <td className="actionsCell">
                    <button className="secondary" onClick={() => toggleActive(u.id, u.is_active)}>
                      {u.is_active ? "Zablokuj" : "Odblokuj"}
                    </button>
                    <button onClick={() => resetPassword(u.id)}>Reset hasła</button>
                    <button className="danger" onClick={() => removeUser(u.id)}>Usuń</button>
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