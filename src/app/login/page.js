"use client";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // licznik
  useEffect(() => {
    let interval;
    if (loading) {
      setSeconds(0);
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      <form
        className={`login-container ${loading ? "login-disabled" : ""}`}
        onSubmit={onSubmit}
      >
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
          {loading ? `⏳ Logowanie... (${seconds}s)` : "Zaloguj"}
        </button>

        {error && <p className="error">⚠ {error}</p>}
      </form>
    </div>
  );
}
