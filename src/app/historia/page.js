"use client";

import LogsClient from "./LogsClient";

export default function HistoriaPage() {
  return (
    <section className="historyPage">
      <div className="historyPageIntro">
        <span className="historyEyebrow">Dziennik systemu</span>
        <h1>Historia</h1>
        <p>
          Ostatnie działania w aplikacji. Możesz szybko zawęzić widok po obszarze
          i typie akcji.
        </p>
      </div>

      <LogsClient />
    </section>
  );
}
