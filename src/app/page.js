
import "./globals.css";

"use client";
import { useState } from "react";

export default function HomePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkDb = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Test połączenia z bazą</h1>

      <button onClick={checkDb} disabled={loading}>
        {loading ? "Sprawdzanie..." : "Sprawdź bazę"}
      </button>

      {result && (
        <div className="result">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}