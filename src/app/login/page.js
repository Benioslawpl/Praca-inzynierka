"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.replace("/");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Nie udało się zalogować");
    }
  };

  return (
    <div className="login-body">
      <form className="login-container" onSubmit={onSubmit}>
        <h1>Logowanie</h1>

        <input
          placeholder="Login"
          value={username}
          onChange={(e) => setU(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setP(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "⏳ Logowanie..." : "Zaloguj"}
        </button>

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner"></div>
          </div>
        )}

        {error && <p className="error">⚠ {error}</p>}
      </form>
    </div>
  );
}
