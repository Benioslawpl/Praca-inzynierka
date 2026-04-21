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

  const mapErrorMessage = (status, apiMessage) => {
    if (status === 400) {
      return "Wpisz login i hasło, aby się zalogować.";
    }

    if (status === 401) {
      if (apiMessage?.toLowerCase().includes("login")) {
        return "Nie znaleziono użytkownika o takim loginie.";
      }

      if (apiMessage?.toLowerCase().includes("has")) {
        return "Podane hasło jest nieprawidłowe.";
      }

      return "Dane logowania są nieprawidłowe.";
    }

    if (status >= 500) {
      return "Serwer chwilowo nie odpowiada. Spróbuj ponownie za moment.";
    }

    return "Nie udało się zalogować. Spróbuj ponownie.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username.trim() || !password) {
        setError("Wpisz login i hasło, aby się zalogować.");
        return;
      }

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
      setError(mapErrorMessage(res.status, data?.error));
    } catch {
      setError(
        "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell loginShellSimple">
      <form
        className={`loginCard ${loading ? "login-disabled" : ""}`}
        onSubmit={onSubmit}
      >
        <div className="loginCardHeader">
          <span className="loginEyebrow">Logowanie</span>
          <h1>Zaloguj się</h1>
          <p>Wprowadź dane dostępu, aby przejść do panelu zarządzania.</p>
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
          {loading ? (
            <span className="loginSubmitState">
              <span className="loginSpinner" aria-hidden="true" />
              Trwa logowanie... {seconds > 0 ? `(${seconds}s)` : ""}
            </span>
          ) : (
            "Zaloguj się"
          )}
        </button>

        {error && (
          <p className="error loginError" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
