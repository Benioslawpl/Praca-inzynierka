"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function getTopEntry(items, getKey) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let winner = "";
  let max = 0;

  for (const [key, count] of counts.entries()) {
    if (count > max) {
      winner = key;
      max = count;
    }
  }

  return winner || "-";
}

export default function SprzetPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/maszyny", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || "Nie udało się pobrać danych sprzętu.");
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setRows([]);
        setError(err.message || "Nie udało się pobrać danych sprzętu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const uniqueTypes = new Set();
    const uniqueOperators = new Set();

    for (const row of rows) {
      if (row.rodzaj) uniqueTypes.add(row.rodzaj);
      if (row.operator) uniqueOperators.add(row.operator);
    }

    const byType = Array.from(
      rows.reduce((map, row) => {
        const key = row.rodzaj || "Nieznany typ";
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map())
    )
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pl"));

    return {
      total: rows.length,
      types: uniqueTypes.size,
      operators: uniqueOperators.size,
      topBrand: getTopEntry(rows, (row) => row.marka?.trim()),
      byType,
      newest: rows.slice(-6).reverse(),
    };
  }, [rows]);

  return (
    <section className="stackSection">
      <div className="sectionIntro">
        <h1>Sprzęt</h1>
        <p>
          Przegląd całego parku sprzętowego na podstawie zapisanych maszyn.
          Szybko sprawdzisz liczbę pozycji, typy sprzętu i ostatnio dodane
          egzemplarze.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="statsGrid">
        <article className="statCard">
          <span className="statLabel">Łącznie sprzętu</span>
          <strong className="statValue">{loading ? "..." : summary.total}</strong>
        </article>

        <article className="statCard">
          <span className="statLabel">Typy sprzętu</span>
          <strong className="statValue">{loading ? "..." : summary.types}</strong>
        </article>

        <article className="statCard">
          <span className="statLabel">Operatorzy</span>
          <strong className="statValue">
            {loading ? "..." : summary.operators}
          </strong>
        </article>

        <article className="statCard">
          <span className="statLabel">Najczęstsza marka</span>
          <strong className="statValue statValueSm">
            {loading ? "..." : summary.topBrand}
          </strong>
        </article>
      </div>

      <div className="splitLayout">
        <article className="card sectionCard">
          <div className="sectionCardHeader">
            <div>
              <h2>Ostatnio dodane</h2>
              <p className="mutedText">Najszybszy podgląd ostatnich pozycji.</p>
            </div>
            <Link href="/pages/maszyny" className="info-btn">
              Przejdź do maszyn
            </Link>
          </div>

          {loading ? (
            <p className="mutedText">Ładowanie danych...</p>
          ) : summary.newest.length === 0 ? (
            <p className="mutedText">Brak sprzętu do wyświetlenia.</p>
          ) : (
            <div className="compactList">
              {summary.newest.map((row, index) => (
                <div key={row.id} className="compactListRow">
                  <div className="compactListMain">
                    <span className="rowEyebrow">
                      {row.nr || `M-${String(summary.total - index).padStart(2, "0")}`}
                    </span>
                    <strong>
                      {row.rodzaj} · {row.marka} {row.model}
                    </strong>
                    <span className="mutedText">
                      Operator: {row.operator || "Nieprzypisany"}
                    </span>
                  </div>

                  <Link
                    href={`/pages/maszyny/${row.id}`}
                    className="info-btn compactAction"
                  >
                    Szczegóły
                  </Link>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card sectionCard">
          <div className="sectionCardHeader">
            <div>
              <h2>Struktura sprzętu</h2>
              <p className="mutedText">Ile maszyn masz w każdym typie.</p>
            </div>
          </div>

          {loading ? (
            <p className="mutedText">Ładowanie danych...</p>
          ) : summary.byType.length === 0 ? (
            <p className="mutedText">Brak danych do podsumowania.</p>
          ) : (
            <div className="compactList">
              {summary.byType.map((item) => (
                <div key={item.label} className="compactListRow compactMetricRow">
                  <strong>{item.label}</strong>
                  <span className="metricBadge">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
