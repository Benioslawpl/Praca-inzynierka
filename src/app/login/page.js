"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      // po zalogowaniu – przekieruj gdzie chcesz (np. /maszyny)
      window.location.href = "/maszyny";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Nie udało się zalogować");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1>Logowanie</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Login" value={username} onChange={(e) => setU(e.target.value)} />
        <input type="password" placeholder="Hasło" value={password} onChange={(e) => setP(e.target.value)} />
        <button type="submit">Zaloguj</button>
        {error && <p style={{ color: "#d33" }}>⚠ {error}</p>}
      </form>

      <hr style={{ margin: "20px 0" }} />
      <button onClick={logout} style={{ background: "#666" }}>Wyloguj (czyści cookie)</button>
    </div>
  );
}