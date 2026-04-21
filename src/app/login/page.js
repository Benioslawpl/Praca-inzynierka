"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;

    if (loading) {
      setSeconds(0);
      interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    }

    return () => clearInterval(interval);
  }, [loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.replace("/");
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error || "Nie udało się zalogować");
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell">
      <section className="loginIntroCard">
        <span className="loginEyebrow">Panel roboczy</span>
        <h1>Zaloguj się do systemu</h1>
        <p>
          Zarządzaj maszynami, sprzętem, brygadami i historią zdarzeń w jednym
          miejscu.
        </p>

        <div className="loginHighlights">
          <div className="loginHighlight">
            <strong>Maszyny i sprzęt</strong>
            <span>Podgląd, edycja i historia zdarzeń.</span>
          </div>
          <div className="loginHighlight">
            <strong>Brygady</strong>
            <span>Przypisania brygadzistów i członków zespołu.</span>
          </div>
          <div className="loginHighlight">
            <strong>Historia</strong>
            <span>Śledzenie zmian i działań użytkowników.</span>
          </div>
        </div>
      </section>

      <form
        className={`loginCard ${loading ? "login-disabled" : ""}`}
        onSubmit={onSubmit}
      >
        <div className="loginCardHeader">
          <span className="loginEyebrow">Logowanie</span>
          <h2>Wprowadź dane dostępu</h2>
          <p>Użyj swojego loginu i hasła, aby przejść do panelu.</p>
        </div>

        <div className="loginFields">
          <label className="loginField">
            <span>Login</span>
            <input
              placeholder="np. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </label>

          <label className="loginField">
            <span>Hasło</span>
            <input
              type="password"
              placeholder="Wpisz hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </label>
        </div>

        <button type="submit" className="loginSubmit" disabled={loading}>
          {loading ? `Logowanie... (${seconds}s)` : "Zaloguj się"}
        </button>

        {error && <p className="error loginError">{error}</p>}
      </form>
    </div>
  );
}
