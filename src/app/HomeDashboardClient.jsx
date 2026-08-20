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

function statusLabel(status) {
  if (status === "w_toku") return "w toku";
  if (status === "wstrzymana") return "wstrzymana";
  if (status === "zakonczona") return "zakończona";
  return "planowana";
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

function DashboardAlerts({ awariaAlerts, serviceAlerts, managerMode = false }) {
  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <div>
          <h2>Najważniejsze alerty</h2>
          <p className="mutedText">
            {managerMode
              ? "Awarie i serwisy dla maszyn przypisanych do Twoich budów."
              : "Awarie i serwisy, które wymagają reakcji."}
          </p>
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
                  <span className="mutedText">
                    {managerMode
                      ? "Nie ma otwartych zgłoszeń na Twoich budowach."
                      : "Na ten moment nie ma otwartych zgłoszeń."}
                  </span>
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
            <strong>{managerMode ? "Nadchodzące serwisy" : "Alerty serwisowe"}</strong>
            <span className="mutedText">{serviceAlerts.length}</span>
          </div>

          <div className="dashboardServiceList">
            {serviceAlerts.length === 0 ? (
              <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCardOk">
                <div className="compactListMain">
                  <strong>Brak pilnych serwisów</strong>
                  <span className="mutedText">
                    {managerMode
                      ? "Żadna maszyna na Twoich budowach nie wymaga teraz reakcji serwisowej."
                      : "Nie ma maszyn wymagających teraz przeglądu."}
                  </span>
                </div>
              </div>
            ) : (
              serviceAlerts.map((item) => (
                <Link
                  href={`/pages/maszyny/${item.machineId}`}
                  className="dashboardAlertLinkWrap"
                  key={`${item.kind}-${item.machineId}`}
                >
                  <div className={`dashboardServiceCard dashboardServiceCard-${item.kind}`}>
                    <div className="dashboardServiceLink">
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
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DashboardRecentReports({ reports }) {
  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <div>
          <h2>Ostatnie raporty</h2>
          <p className="mutedText">Najnowsze wpisy operatorskie i awarie.</p>
        </div>
      </div>

      <div className="compactList">
        {reports.length === 0 ? (
          <div className="compactListRow">
            <div className="compactListMain">
              <strong>Brak raportów</strong>
              <span className="mutedText">Nie ma jeszcze żadnych wpisów operatorskich.</span>
            </div>
          </div>
        ) : (
          reports.map((report) => (
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
  );
}

export default function HomeDashboardClient({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
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
  const isManagerDashboard = data?.roleDashboard === "kierownik";

  return (
    <section className="home dashboardHome">
      <div className="sectionIntro">
        <h1>Panel główny</h1>
        <p>
          Zalogowano jako <b>{user.username}</b> ({roleLabel(user.role)}). Tutaj widać
          {isManagerDashboard
            ? " podsumowanie budów, przypisanych zasobów oraz bieżących awarii i serwisów."
            : " bieżące awarie, nadchodzące serwisy i ostatnie raporty z maszyn."}
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="statsGrid dashboardStats">
        <article className="statCard">
          <span className="statLabel">
            {isManagerDashboard ? "Aktywne budowy" : "Awarie aktywne"}
          </span>
          <strong className="statValue">
            {isManagerDashboard
              ? data?.summary?.activeBudowy ?? 0
              : data?.alerts?.awarie?.length ?? 0}
          </strong>
        </article>
        <article className="statCard">
          <span className="statLabel">
            {isManagerDashboard ? "Brygady na budowach" : "Serwis wkrótce"}
          </span>
          <strong className="statValue">
            {isManagerDashboard
              ? data?.summary?.brygady ?? 0
              : data?.alerts?.serwisSoon?.length ?? 0}
          </strong>
        </article>
        <article className="statCard">
          <span className="statLabel">
            {isManagerDashboard ? "Maszyny na budowach" : "Serwis po terminie"}
          </span>
          <strong className="statValue">
            {isManagerDashboard
              ? data?.summary?.maszyny ?? 0
              : data?.alerts?.serwisOverdue?.length ?? 0}
          </strong>
        </article>
        {isManagerDashboard ? (
          <article className="statCard">
            <span className="statLabel">Otwarte awarie</span>
            <strong className="statValue">{data?.summary?.awarie ?? 0}</strong>
          </article>
        ) : null}
      </div>

      {isManagerDashboard ? (
        <div className="splitLayout dashboardLayout">
          <article className="card sectionCard">
            <div className="sectionCardHeader">
              <div>
                <h2>Moje budowy</h2>
                <p className="mutedText">Budowy przypisane do zalogowanego kierownika.</p>
              </div>
              <span className="metricBadge">{data?.managedBudowy?.length ?? 0}</span>
            </div>

            <div className="compactList">
              {(data?.managedBudowy || []).length === 0 ? (
                <div className="compactListRow">
                  <div className="compactListMain">
                    <strong>Brak przypisanych budów</strong>
                    <span className="mutedText">
                      Na ten moment to konto nie ma żadnej budowy z przypisanym kierownikiem.
                    </span>
                  </div>
                </div>
              ) : (
                data.managedBudowy.map((budowa) => (
                  <Link
                    key={budowa.id}
                    href={`/pages/budowy/${budowa.id}`}
                    className="dashboardAlertLinkWrap"
                  >
                    <div className="compactListRow compactMetricRow">
                      <div className="compactListMain">
                        <strong>{budowa.numer}</strong>
                        <span>{budowa.nazwa}</span>
                        <span className="mutedText">
                          {budowa.lokalizacja || "-"} • start: {fmtDate(budowa.data_rozpoczecia)}
                        </span>
                      </div>
                      <div className="compactListMeta compactListMetaStack">
                        <span className="pill">{statusLabel(budowa.status)}</span>
                        <span className="mutedText">
                          brygady: {budowa.brygady_count} • maszyny: {budowa.maszyny_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>

          <DashboardAlerts
            awariaAlerts={awariaAlerts}
            serviceAlerts={serviceAlerts}
            managerMode
          />
        </div>
      ) : (
        <div className="splitLayout dashboardLayout">
          <DashboardAlerts awariaAlerts={awariaAlerts} serviceAlerts={serviceAlerts} />
          <DashboardRecentReports reports={recentReports} />
        </div>
      )}

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
