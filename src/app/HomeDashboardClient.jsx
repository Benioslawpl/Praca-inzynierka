"use client";

import Link from "next/link";
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
  const [serviceSavingId, setServiceSavingId] = useState(null);
  const [forms, setForms] = useState({});

  const refreshDashboard = async () => {
    const res = await fetch("/api/dashboard", {
      cache: "no-store",
      credentials: "include",
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(payload?.error || "Błąd pobierania dashboardu");
    }

    setData(payload);
    setForms(
      Object.fromEntries(
        (payload.assignedMachines || []).map((machine) => [machine.id, EMPTY_REPORT])
      )
    );
  };

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setError("");

      try {
        await refreshDashboard();
      } catch (err) {
        setData(null);
        setError(err.message || "Błąd pobierania dashboardu");
      }
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

      await refreshDashboard();
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

  const markServiceDone = async (item) => {
    setServiceSavingId(item.machineId);
    setError("");

    try {
      const res = await fetch(`/api/maszyny/${item.machineId}/serwis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wykonany_przy_mth: item.currentHours }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Nie udało się oznaczyć serwisu");
      }

      await refreshDashboard();
    } catch (err) {
      setError(err.message || "Nie udało się oznaczyć serwisu");
    } finally {
      setServiceSavingId(null);
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

  const awariaAlerts = (data?.alerts?.awarie || []).map((item) => ({
    ...item,
    title: item.nr,
    description: item.opis || "Aktywne zgłoszenie awarii",
    meta: `Zgłoszono: ${fmtDate(item.date)}`,
  }));

  const serviceAlerts = [
    ...((data?.alerts?.serwisOverdue || []).map((item) => ({
      ...item,
      kind: "overdue",
      title: item.nr,
      description: `Serwis przekroczony o ${Math.abs(Math.round(item.remaining))} mth`,
      meta: `Stan licznika: ${Math.round(item.currentHours)} mth • próg: ${Math.round(item.nextServiceAt)} mth`,
    }))),
    ...((data?.alerts?.serwisSoon || []).map((item) => ({
      ...item,
      kind: "soon",
      title: item.nr,
      description: `Do serwisu zostało około ${Math.round(item.remaining)} mth`,
      meta: `Stan licznika: ${Math.round(item.currentHours)} mth • próg: ${Math.round(item.nextServiceAt)} mth`,
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
              <h2>Najważniejsze alerty</h2>
              <p className="mutedText">Awarie i serwisy, które wymagają reakcji.</p>
            </div>
            <span className="metricBadge">{awariaAlerts.length + serviceAlerts.length}</span>
          </div>

          <div className="dashboardAlertStack">
            <div className="dashboardAlertGroup">
              <div className="dashboardAlertGroupHeader">
                <strong>Aktywne awarie</strong>
                <span className="mutedText">{awariaAlerts.length}</span>
              </div>

              <div className="compactList dashboardAlertList">
                {awariaAlerts.length === 0 ? (
                  <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCardOk">
                    <div className="compactListMain">
                      <strong>Brak aktywnych awarii</strong>
                      <span className="mutedText">Na ten moment nie ma otwartych zgłoszeń.</span>
                    </div>
                  </div>
                ) : (
                  awariaAlerts.map((item) => (
                    <Link
                      href={`/pages/maszyny/${item.machineId}`}
                      className="dashboardAlertLinkWrap"
                      key={`awaria-${item.machineId}`}
                    >
                      <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCard-awaria">
                        <div className="dashboardAlertLead">
                          <span className="dashboardAlertDot" aria-hidden="true" />
                        </div>
                        <div className="compactListMain">
                          <strong>{item.title}</strong>
                          <span className="dashboardAlertText">{item.description}</span>
                          <span className="mutedText">{item.meta}</span>
                        </div>
                        <span className="pill bad">awaria</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="dashboardAlertGroup">
              <div className="dashboardAlertGroupHeader">
                <strong>Alerty serwisowe</strong>
                <span className="mutedText">{serviceAlerts.length}</span>
              </div>

              <div className="dashboardServiceList">
                {serviceAlerts.length === 0 ? (
                  <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCardOk">
                    <div className="compactListMain">
                      <strong>Brak pilnych serwisów</strong>
                      <span className="mutedText">Nie ma maszyn wymagających teraz przeglądu.</span>
                    </div>
                  </div>
                ) : (
                  serviceAlerts.map((item) => (
                    <article
                      className={`dashboardServiceCard dashboardServiceCard-${item.kind}`}
                      key={`${item.kind}-${item.machineId}`}
                    >
                      <Link
                        href={`/pages/maszyny/${item.machineId}`}
                        className="dashboardServiceLink"
                      >
                        <div className="dashboardAlertLead">
                          <span className="dashboardAlertDot" aria-hidden="true" />
                        </div>
                        <div className="compactListMain">
                          <strong>{item.title}</strong>
                          <span className="dashboardAlertText">{item.description}</span>
                          <span className="mutedText">{item.meta}</span>
                        </div>
                        <span className={`pill ${item.kind === "overdue" ? "bad" : ""}`}>
                          {item.kind === "overdue" ? "pilne" : "wkrótce"}
                        </span>
                      </Link>

                      <div className="dashboardServiceActions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={serviceSavingId === item.machineId}
                          onClick={() => markServiceDone(item)}
                        >
                          {serviceSavingId === item.machineId
                            ? "Zapisywanie..."
                            : "Serwis wykonany"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
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
