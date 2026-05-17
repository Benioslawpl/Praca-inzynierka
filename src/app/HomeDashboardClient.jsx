"use client";

import { useEffect, useState } from "react";

const today = new Date().toISOString().slice(0, 10);

const EMPTY_REPORT = {
  data_raportu: today,
  motogodziny: "",
  awaria: false,
  opis: "",
};

function fmtDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("pl-PL");
  } catch {
    return String(value).slice(0, 10);
  }
}

function roleLabel(role) {
  if (role === "admin") return "administrator";
  if (role === "operator") return "operator";
  if (role === "brygadzista") return "brygadzista";
  if (role === "kierownik") return "kierownik";
  if (role === "biuro") return "biuro";
  return "użytkownik";
}

function severityLabel(kind) {
  if (kind === "awaria") return "awaria";
  if (kind === "overdue") return "pilne";
  return "wkrótce";
}

function buildRecentReports(rows) {
  const seenOkMachines = new Set();
  const output = [];

  for (const report of rows || []) {
    const machineKey = report?.maszyna_id ?? report?.nr ?? report?.id;

    if (!report?.awaria) {
      if (seenOkMachines.has(machineKey)) continue;
      seenOkMachines.add(machineKey);
    }

    output.push(report);
  }

  return output;
}

export default function HomeDashboardClient({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setError("");

      const res = await fetch("/api/dashboard", {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setData(null);
        setError(payload?.error || "Błąd pobierania dashboardu");
        return;
      }

      setData(payload);
      setForms(
        Object.fromEntries(
          (payload.assignedMachines || []).map((machine) => [machine.id, EMPTY_REPORT])
        )
      );
    };

    load();
  }, [user]);

  const setFormFor = (machineId, next) => {
    setForms((current) => ({
      ...current,
      [machineId]: next,
    }));
  };

  const submitReport = async (machineId) => {
    const form = forms[machineId] || EMPTY_REPORT;
    setSavingId(machineId);
    setError("");

    try {
      const res = await fetch(`/api/maszyny/${machineId}/raporty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Nie udało się zapisać raportu");
      }

      const refreshed = await fetch("/api/dashboard", {
        cache: "no-store",
        credentials: "include",
      });
      const refreshedPayload = await refreshed.json().catch(() => ({}));
      if (!refreshed.ok) {
        throw new Error(refreshedPayload?.error || "Nie udało się odświeżyć widoku");
      }

      setData(refreshedPayload);
      setForms((current) => ({
        ...current,
        [machineId]: EMPTY_REPORT,
      }));
    } catch (err) {
      setError(err.message || "Nie udało się zapisać raportu");
    } finally {
      setSavingId(null);
    }
  };

  if (!user) {
    return (
      <section className="home">
        <h1>Witamy w aplikacji do zarządzania zapleczem</h1>
        <p>Zaloguj się, aby zobaczyć przypisane maszyny, alerty serwisowe i bieżące zgłoszenia.</p>
      </section>
    );
  }

  const alertItems = [
    ...((data?.alerts?.awarie || []).map((item) => ({
      ...item,
      kind: "awaria",
      title: item.nr,
      description: item.opis || "Aktywne zgłoszenie awarii",
      meta: `Zgłoszono: ${fmtDate(item.date)}`,
    }))),
    ...((data?.alerts?.serwisOverdue || []).map((item) => ({
      ...item,
      kind: "overdue",
      title: item.nr,
      description: `Serwis przekroczony o ${Math.abs(Math.round(item.remaining))} mth`,
      meta: `Próg serwisu: ${Math.round(item.nextServiceAt)} mth`,
    }))),
    ...((data?.alerts?.serwisSoon || []).map((item) => ({
      ...item,
      kind: "soon",
      title: item.nr,
      description: `Do serwisu zostało około ${Math.round(item.remaining)} mth`,
      meta: `Próg serwisu: ${Math.round(item.nextServiceAt)} mth`,
    }))),
  ];
  const recentReports = buildRecentReports(data?.recentReports);

  return (
    <section className="home dashboardHome">
      <div className="sectionIntro">
        <h1>Panel główny</h1>
        <p>
          Zalogowano jako <b>{user.username}</b> ({roleLabel(user.role)}). Tutaj widać
          bieżące awarie, nadchodzące serwisy i ostatnie raporty z maszyn.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="statsGrid dashboardStats">
        <article className="statCard">
          <span className="statLabel">Awarie aktywne</span>
          <strong className="statValue">{data?.alerts?.awarie?.length ?? 0}</strong>
        </article>
        <article className="statCard">
          <span className="statLabel">Serwis wkrótce</span>
          <strong className="statValue">{data?.alerts?.serwisSoon?.length ?? 0}</strong>
        </article>
        <article className="statCard">
          <span className="statLabel">Serwis po terminie</span>
          <strong className="statValue">{data?.alerts?.serwisOverdue?.length ?? 0}</strong>
        </article>
      </div>

      <div className="splitLayout dashboardLayout">
        <article className="card sectionCard">
          <div className="sectionCardHeader">
            <div>
              <h2>Alerty serwisowe</h2>
              <p className="mutedText">Najważniejsze informacje z ostatnich raportów.</p>
            </div>
            <span className="metricBadge">{alertItems.length}</span>
          </div>

          <div className="compactList dashboardAlertList">
            {alertItems.length === 0 ? (
              <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCardOk">
                <div className="compactListMain">
                  <strong>Brak krytycznych alertów</strong>
                  <span className="mutedText">Na ten moment system nie widzi pilnych zdarzeń.</span>
                </div>
              </div>
            ) : (
              alertItems.map((item) => (
                <div
                  className={`compactListRow compactMetricRow dashboardAlertCard dashboardAlertCard-${item.kind}`}
                  key={`${item.kind}-${item.machineId}`}
                >
                  <div className="dashboardAlertLead">
                    <span className="dashboardAlertDot" aria-hidden="true" />
                  </div>
                  <div className="compactListMain">
                    <strong>{item.title}</strong>
                    <span className="dashboardAlertText">{item.description}</span>
                    <span className="mutedText">{item.meta}</span>
                  </div>
                  <span className={`pill ${item.kind === "awaria" || item.kind === "overdue" ? "bad" : ""}`}>
                    {severityLabel(item.kind)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card sectionCard">
          <div className="sectionCardHeader">
            <div>
              <h2>Ostatnie raporty</h2>
              <p className="mutedText">Najnowsze wpisy operatorskie i awarie.</p>
            </div>
          </div>

          <div className="compactList">
            {recentReports.length === 0 ? (
              <div className="compactListRow">
                <div className="compactListMain">
                  <strong>Brak raportów</strong>
                  <span className="mutedText">Nie ma jeszcze żadnych wpisów operatorskich.</span>
                </div>
              </div>
            ) : (
              recentReports.map((report) => (
                <div className="compactListRow" key={report.id}>
                  <div className="compactListMain">
                    <strong>{report.nr || `Maszyna #${report.maszyna_id}`}</strong>
                    <span className="mutedText">
                      {report.username || "anon"} • {fmtDate(report.data_raportu)} •{" "}
                      {report.motogodziny ?? "-"} mth
                    </span>
                  </div>
                  <span className={`pill ${report.awaria ? "bad" : "ok"}`}>
                    {report.awaria ? "awaria" : "ok"}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      {user.role === "operator" ? (
        <div className="stackSection">
          <div className="sectionIntro">
            <h2>Moje maszyny</h2>
            <p>Wpisuj motogodziny i zgłaszaj awarie bezpośrednio ze swojego panelu.</p>
          </div>

          {(data?.assignedMachines || []).length === 0 ? (
            <div className="card">
              <p>Na tym koncie nie ma jeszcze przypisanej maszyny.</p>
            </div>
          ) : (
            <div className="operatorMachines">
              {data.assignedMachines.map((machine) => {
                const form = forms[machine.id] || EMPTY_REPORT;
                return (
                  <article className="card operatorMachineCard" key={machine.id}>
                    <div className="detailsSummaryContent">
                      <div className="detailsSummaryLine">
                        <b>Maszyna:</b> <span>{machine.nr || "-"}</span>
                        <b>Rodzaj:</b> <span>{machine.rodzaj || "-"}</span>
                      </div>
                      <div className="detailsSummaryLine">
                        <b>Marka/Model:</b> <span>{machine.marka} {machine.model}</span>
                        <b>Operator:</b> <span>{machine.operator || "-"}</span>
                      </div>
                    </div>

                    <div className="grid">
                      <label>
                        <span>Data raportu</span>
                        <input
                          type="date"
                          value={form.data_raportu}
                          onChange={(e) =>
                            setFormFor(machine.id, { ...form, data_raportu: e.target.value })
                          }
                        />
                      </label>

                      <label>
                        <span>Motogodziny</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.motogodziny}
                          onChange={(e) =>
                            setFormFor(machine.id, { ...form, motogodziny: e.target.value })
                          }
                          placeholder="np. 1240.5"
                        />
                      </label>

                      <label>
                        <span>Awaria</span>
                        <select
                          value={form.awaria ? "tak" : "nie"}
                          onChange={(e) =>
                            setFormFor(machine.id, {
                              ...form,
                              awaria: e.target.value === "tak",
                            })
                          }
                        >
                          <option value="nie">brak awarii</option>
                          <option value="tak">zgłoś awarię</option>
                        </select>
                      </label>

                      <label style={{ gridColumn: "1 / -1" }}>
                        <span>Opis</span>
                        <textarea
                          rows={3}
                          value={form.opis}
                          onChange={(e) =>
                            setFormFor(machine.id, { ...form, opis: e.target.value })
                          }
                          placeholder="Krótki opis pracy, przestoju albo awarii..."
                        />
                      </label>
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        disabled={savingId === machine.id}
                        onClick={() => submitReport(machine.id)}
                      >
                        {savingId === machine.id ? "Zapisywanie..." : "Wyślij raport"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
