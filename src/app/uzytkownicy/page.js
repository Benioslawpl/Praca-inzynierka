"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const emptyForm = {
    username: "",
    password: "",
    role: "user",
  };

  const fetchUsers = async () => {
    setError("");
    const res = await fetch("/api/users", { cache: "no-store" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Błąd pobierania użytkowników");
      setList([]);
      return;
    }

    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Błąd dodawania");

      setForm(emptyForm);
      setIsFormOpen(false);
      fetchUsers();
      alert(`Użytkownik dodany: ${data.username}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (id, blocked) => {
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: !blocked }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || `Błąd ${res.status}`);
      return;
    }

    fetchUsers();
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Podaj nowe hasło dla użytkownika:");
    if (!newPass) return;

    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_password: true, new_password: newPass }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      alert("Hasło zresetowane.");
      fetchUsers();
    } else {
      setError(data.error || "Błąd resetu hasła");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Na pewno usunąć użytkownika?")) return;

    setError("");
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || `Błąd ${res.status}`);
      return;
    }

    fetchUsers();
  };

  const toggleForm = () => {
    if (isFormOpen) {
      setForm(emptyForm);
      setError("");
    }

    setIsFormOpen((open) => !open);
  };

  return (
    <div>
      <h1>Użytkownicy</h1>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>Dodaj użytkownika</h2>
            <p>Utwórz nowe konto i od razu nadaj odpowiednią rolę.</p>
          </div>

          <button type="button" onClick={toggleForm}>
            <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
              <span className="formPanelToggleIcon" aria-hidden="true">+</span>
              <span>{isFormOpen ? "Ukryj formularz" : "Dodaj użytkownika"}</span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
          <form className="card" onSubmit={addUser}>
            <div className="grid">
              <label>
                <span>Login*</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Hasło*</span>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Rola</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>

            <div className="actions">
              <button type="submit" disabled={saving}>
                {saving ? "Zapisywanie..." : "Dodaj użytkownika"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setError("");
                  setIsFormOpen(false);
                }}
              >
                Anuluj
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </section>

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
              {list.map((user, index) => (
                <tr key={user.id}>
                  <td data-label="Numer">{index + 1}</td>
                  <td data-label="Login">{user.username}</td>
                  <td data-label="Hasło">{"•".repeat(8)}</td>
                  <td data-label="Rola">{user.role}</td>
                  <td data-label="Data utworzenia">
                    {user.created_at
                      ? String(user.created_at).slice(0, 19).replace("T", " ")
                      : "-"}
                  </td>
                  <td data-label="Zablokowany">
                    <span className={`pill ${user.blocked ? "bad" : "ok"}`}>
                      {user.blocked ? "TAK" : "NIE"}
                    </span>
                  </td>

                  <td className="actionsCell" data-label="Akcje">
                    <button
                      type="button"
                      className={user.blocked ? "secondary" : "danger"}
                      onClick={() => toggleBlocked(user.id, user.blocked)}
                    >
                      {user.blocked ? "Odblokuj" : "Zablokuj"}
                    </button>

                    <button type="button" onClick={() => resetPassword(user.id)}>
                      Reset hasła
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => removeUser(user.id)}
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
