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
      return "Wpisz login i has\u0142o, aby si\u0119 zalogowa\u0107.";
    }

    if (status === 401) {
      if (apiMessage?.toLowerCase().includes("login")) {
        return "Nie znaleziono u\u017cytkownika o takim loginie.";
      }

      if (apiMessage?.toLowerCase().includes("has")) {
        return "Podane has\u0142o jest nieprawid\u0142owe.";
      }

      return "Dane logowania s\u0105 nieprawid\u0142owe.";
    }

    if (status >= 500) {
      return "Serwer chwilowo nie odpowiada. Spr\u00f3buj ponownie za moment.";
    }

    return "Nie uda\u0142o si\u0119 zalogowa\u0107. Spr\u00f3buj ponownie.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username.trim() || !password) {
        setError("Wpisz login i has\u0142o, aby si\u0119 zalogowa\u0107.");
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
        "Nie uda\u0142o si\u0119 po\u0142\u0105czy\u0107 z serwerem. Sprawd\u017a po\u0142\u0105czenie i spr\u00f3buj ponownie."
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
          <h1>Zaloguj si\u0119</h1>
          <p>Wprowad\u017a dane dost\u0119pu, aby przej\u015b\u0107 do panelu zarz\u0105dzania.</p>
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
            <span>Has\u0142o</span>
            <input
              type="password"
              placeholder="Wpisz has\u0142o"
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
            "Zaloguj si\u0119"
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
