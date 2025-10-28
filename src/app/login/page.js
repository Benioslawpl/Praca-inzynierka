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
      // cookie już jest ustawiane przez odpowiedź z serwera
      window.location.replace("/"); // auto-przekierowanie na Home
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Nie udało się zalogować");
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: "60px auto", display: "grid", gap: 10 }}>
      <h1>Logowanie</h1>
      <input placeholder="Login" value={username} onChange={(e) => setU(e.target.value)} />
      <input type="password" placeholder="Hasło" value={password} onChange={(e) => setP(e.target.value)} />
      <button type="submit">Zaloguj</button>
      {error && <p style={{ color: "#d33" }}>⚠ {error}</p>}
    </form>
  );
}