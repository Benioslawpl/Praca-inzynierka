"use client";

import { useEffect, useState } from "react";

import { ROLE_OPTIONS } from "../../lib/roles";

const EMPTY_FORM = {
  username: "",
  password: "",
  role: "user",
  assigned_machine_id: "",
};

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    setError("");

    const [usersRes, machinesRes] = await Promise.all([
      fetch("/api/users", { cache: "no-store" }),
      fetch("/api/maszyny", { cache: "no-store" }),
    ]);

    const [usersData, machinesData] = await Promise.all([
      usersRes.json().catch(() => ({})),
      machinesRes.json().catch(() => ([])),
    ]);

    if (!usersRes.ok) {
      setList([]);
      setError(usersData.error || "Błąd pobierania użytkowników");
    } else {
      setList(Array.isArray(usersData) ? usersData : []);
    }

    if (!machinesRes.ok) {
      setMachines([]);
      setError((current) => current || "Błąd pobierania maszyn");
    } else {
      setMachines(Array.isArray(machinesData) ? machinesData : []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setIsFormOpen(false);
    setError("");
  };

  const startEdit = (user) => {
    setEditId(user.id);
    setForm({
      username: user.username || "",
      password: "",
      role: user.role || "user",
      assigned_machine_id: user.assigned_machine_id
        ? String(user.assigned_machine_id)
        : "",
    });
    setIsFormOpen(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isEdit = Number.isInteger(editId);
      const payload = {
        username: form.username.trim(),
        role: form.role,
        assigned_machine_id:
          form.role === "operator" && form.assigned_machine_id
            ? Number(form.assigned_machine_id)
            : null,
      };

      if (!isEdit) {
        payload.password = form.password;
      }

      const res = await fetch(isEdit ? `/api/users/${editId}` : "/api/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Błąd zapisu użytkownika");
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message || "Błąd zapisu użytkownika");
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

    fetchData();
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Podaj nowe hasło dla użytkownika:");
    if (!newPass) return;

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_password: true, new_password: newPass }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Błąd resetu hasła");
      return;
    }

    alert("Hasło zresetowane.");
  };

  const removeUser = async (id) => {
    if (!confirm("Na pewno usunąć użytkownika?")) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || `Błąd ${res.status}`);
      return;
    }

    if (editId === id) resetForm();
    fetchData();
  };

  const toggleForm = () => {
    if (isFormOpen && !editId) {
      resetForm();
      return;
    }

    if (editId) {
      setIsFormOpen(true);
      return;
    }

    setIsFormOpen(true);
    setError("");
  };

  return (
    <div>
      <h1>Użytkownicy</h1>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId ? "Edytuj użytkownika" : "Dodaj użytkownika"}</h2>
            <p>
              {editId
                ? "Zmień rolę, login albo przypisaną maszynę operatora."
                : "Utwórz nowe konto i od razu ustaw odpowiednią rolę."}
            </p>
          </div>

          <button type="button" onClick={toggleForm}>
            <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
              <span className="formPanelToggleIcon" aria-hidden="true">
                {isFormOpen ? "−" : "+"}
              </span>
              <span>{isFormOpen ? "Ukryj formularz" : "Dodaj użytkownika"}</span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
          <form className="card" onSubmit={submit}>
            <div className="grid">
              <label>
                <span>Login*</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </label>

              {!editId ? (
                <label>
                  <span>Hasło*</span>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </label>
              ) : (
                <label>
                  <span>Hasło</span>
                  <input value="reset oddzielnym przyciskiem" disabled />
                </label>
              )}

              <label>
                <span>Rola</span>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                      assigned_machine_id:
                        e.target.value === "operator" ? form.assigned_machine_id : "",
                    })
                  }
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Przypisana maszyna</span>
                <select
                  value={form.assigned_machine_id}
                  onChange={(e) =>
                    setForm({ ...form, assigned_machine_id: e.target.value })
                  }
                  disabled={form.role !== "operator"}
                >
                  <option value="">brak przypisania</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.nr || `Maszyna #${machine.id}`} • {machine.rodzaj} {machine.marka}{" "}
                      {machine.model}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="actions">
              <button type="submit" disabled={saving}>
                {saving ? "Zapisywanie..." : editId ? "Zapisz" : "Dodaj użytkownika"}
              </button>
              <button type="button" className="secondary" onClick={resetForm}>
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
                <th style={{ width: 140 }}>Rola</th>
                <th>Maszyna operatora</th>
                <th style={{ width: 180 }}>Data utworzenia</th>
                <th style={{ width: 140 }}>Zablokowany</th>
                <th style={{ width: 420 }}>Akcje</th>
              </tr>
            </thead>

            <tbody>
              {list.map((user, index) => (
                <tr key={user.id}>
                  <td data-label="Numer">{index + 1}</td>
                  <td data-label="Login">{user.username}</td>
                  <td data-label="Rola">{user.role}</td>
                  <td data-label="Maszyna operatora">{user.assigned_machine_nr || "-"}</td>
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
                    <button type="button" className="secondary" onClick={() => startEdit(user)}>
                      Edytuj
                    </button>
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
