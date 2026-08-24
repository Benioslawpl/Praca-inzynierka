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

function statusLabel(status) {
  if (status === "w_toku") return "w toku";
  if (status === "wstrzymana") return "wstrzymana";
  if (status === "zakonczona") return "zakonczona";
  return "planowana";
}

function buildBudowaMeta(budowa) {
  const location = budowa.lokalizacja || "-";

  if (budowa.status === "zakonczona") {
    return `${location} • koniec: ${fmtDate(budowa.data_zakonczenia)}`;
  }

  if (budowa.data_zakonczenia) {
    return `${location} • koniec: ${fmtDate(budowa.data_zakonczenia)}`;
  }

  return `${location} • start: ${fmtDate(budowa.data_rozpoczecia)}`;
}

function EmptyListRow({ title }) {
  return (
    <div className="compactListRow">
      <div className="compactListMain">
        <strong>{title}</strong>
      </div>
    </div>
  );
}

function ScopeSection({ title, count, children }) {
  return (
    <div className="dashboardScopeGroup">
      <div className="dashboardAlertGroupHeader">
        <strong>{title}</strong>
        {typeof count === "number" ? <span className="mutedText">{count}</span> : null}
      </div>
      <div className="compactList">{children}</div>
    </div>
  );
}

function DashboardAlerts({ awariaAlerts, serviceAlerts, managerMode = false }) {
  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <h2>Najważniejsze alerty</h2>
      </div>

      <div className="dashboardAlertStack">
        <ScopeSection title="Aktywne awarie" count={awariaAlerts.length}>
          {awariaAlerts.length === 0 ? (
            <EmptyListRow title="Brak aktywnych awarii" />
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
        </ScopeSection>

        <ScopeSection
          title={managerMode ? "Alerty serwisowe" : "Nadchodzące serwisy"}
          count={serviceAlerts.length}
        >
          {serviceAlerts.length === 0 ? (
            <EmptyListRow title="Brak pilnych serwisów" />
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
        </ScopeSection>
      </div>
    </article>
  );
}

function ManagerPanel({ title, budowy }) {
  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <h2>{title}</h2>
      </div>

      <div className="compactList">
          {budowy.length === 0 ? (
            <EmptyListRow title="Brak budów" />
          ) : (
            budowy.map((budowa) => (
              <Link
                key={budowa.id}
                href={`/pages/budowy/${budowa.id}`}
                className="dashboardAlertLinkWrap"
              >
                <div className="compactListRow compactMetricRow">
                  <div className="compactListMain">
                    <strong>{budowa.numer}</strong>
                    <span>{budowa.nazwa}</span>
                    <span className="mutedText">{buildBudowaMeta(budowa)}</span>
                  </div>
                  <div className="compactListMeta compactListMetaStack">
                    <span className="pill">{statusLabel(budowa.status)}</span>
                    {budowa.status !== "zakonczona" &&
                    (budowa.brygady_count !== undefined || budowa.maszyny_count !== undefined) ? (
                      <span className="mutedText">
                        brygady: {budowa.brygady_count || 0} • maszyny: {budowa.maszyny_count || 0}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))
          )}
      </div>
    </article>
  );
}

function ForemanPanel({ data }) {
  const budowy = data?.budowy || [];
  const ludzie = data?.ludzie || [];
  const sprzet = data?.sprzet || [];

  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <h2>Panel brygadzisty</h2>
      </div>

      <div className="dashboardScopeStack">
        <ScopeSection title="Budowy" count={budowy.length}>
          {budowy.length === 0 ? (
            <EmptyListRow title="Brak budów" />
          ) : (
            budowy.map((budowa) => (
              <Link
                key={budowa.id}
                href={`/pages/budowy/${budowa.id}`}
                className="dashboardAlertLinkWrap"
              >
                <div className="compactListRow compactMetricRow">
                  <div className="compactListMain">
                    <strong>{budowa.numer}</strong>
                    <span>{budowa.nazwa}</span>
                    <span className="mutedText">{buildBudowaMeta(budowa)}</span>
                  </div>
                  <span className="pill">{statusLabel(budowa.status)}</span>
                </div>
              </Link>
            ))
          )}
        </ScopeSection>

        <ScopeSection title="Ludzie" count={ludzie.length}>
          {ludzie.length === 0 ? (
            <EmptyListRow title="Brak ludzi w brygadzie" />
          ) : (
            ludzie.map((member) => (
              <div className="compactListRow compactMetricRow" key={member.id}>
                <div className="compactListMain">
                  <strong>{member.imie} {member.nazwisko}</strong>
                  <span>{member.rola || "członek brygady"}</span>
                  <span className="mutedText">
                    {member.telefon ? `tel. ${member.telefon}` : "brak telefonu"}
                  </span>
                </div>
                <span className="pill">osoba</span>
              </div>
            ))
          )}
        </ScopeSection>

        <ScopeSection title="Sprzęt" count={sprzet.length}>
          {sprzet.length === 0 ? (
            <EmptyListRow title="Brak sprzętu" />
          ) : (
            sprzet.map((item) => (
              <Link
                key={item.id}
                href={`/pages/sprzet/${item.id}`}
                className="dashboardAlertLinkWrap"
              >
                <div className="compactListRow compactMetricRow">
                  <div className="compactListMain">
                    <strong>{item.nr || `Sprzęt #${item.id}`}</strong>
                    <span>{item.marka || "-"} {item.model || ""}</span>
                    <span className="mutedText">{item.rodzaj || "-"}</span>
                  </div>
                  <span className="pill">sprzęt</span>
                </div>
              </Link>
            ))
          )}
        </ScopeSection>
      </div>
    </article>
  );
}

function OperatorScopePanel({ machines }) {
  return (
    <article className="card sectionCard operatorScopePanel">
      <div className="sectionCardHeader">
        <h2>Twój zakres</h2>
      </div>

      <div className="compactList">
        {machines.length === 0 ? (
          <EmptyListRow title="Brak przypisanych maszyn" />
        ) : (
          machines.map((machine) => (
            <Link
              key={machine.id}
              href={`/pages/maszyny/${machine.id}`}
              className="dashboardAlertLinkWrap"
            >
              <div className="compactListRow compactMetricRow">
                <div className="compactListMain">
                  <strong>{machine.nr || `Maszyna #${machine.id}`}</strong>
                  <span>{machine.marka || "-"} {machine.model || ""}</span>
                  <span className="mutedText">{machine.rodzaj || "-"}</span>
                </div>
                <span className="pill">maszyna</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </article>
  );
}

function DashboardScopePanel({ dashboardType, data }) {
  if (dashboardType === "admin") {
    return (
      <ManagerPanel
        title="Aktywne budowy"
        budowy={data?.adminBudowy || []}
      />
    );
  }

  if (dashboardType === "kierownik") {
    return (
      <ManagerPanel
        title="Moje budowy"
        budowy={data?.managedBudowy || []}
      />
    );
  }

  if (dashboardType === "brygadzista") {
    return <ForemanPanel data={data} />;
  }

  if (dashboardType === "biuro") {
    return (
      <ManagerPanel
        title="Panel biura"
        budowy={data?.recentBudowy || []}
      />
    );
  }

  return <OperatorScopePanel machines={data?.assignedMachines || []} />;
}

function getStatsForDashboard(type, data) {
  if (type === "admin") {
    return [
      { label: "Budowy w toku", value: data?.summary?.activeBudowy ?? 0 },
      { label: "Wolne maszyny", value: data?.summary?.wolneMaszyny ?? 0 },
      { label: "Aktywne awarie", value: data?.summary?.awarie ?? 0 },
      { label: "Serwisy do wykonania", value: data?.summary?.serwisy ?? 0 },
    ];
  }

  if (type === "kierownik") {
    return [
      { label: "Aktywne budowy", value: data?.summary?.activeBudowy ?? 0 },
      { label: "Brygady na budowach", value: data?.summary?.brygady ?? 0 },
      { label: "Maszyny", value: data?.summary?.maszyny ?? 0 },
    ];
  }

  if (type === "brygadzista") {
    return [
      { label: "Budowy", value: data?.summary?.budowy ?? 0 },
      { label: "Ludzie", value: data?.summary?.ludzie ?? 0 },
      { label: "Sprzęt", value: data?.summary?.sprzet ?? 0 },
    ];
  }

  if (type === "biuro") {
    return [
      { label: "Wszystkie budowy", value: data?.summary?.totalBudowy ?? 0 },
      { label: "Aktywne budowy", value: data?.summary?.activeBudowy ?? 0 },
      { label: "Maszyny", value: data?.summary?.maszyny ?? 0 },
    ];
  }

  return [
    { label: "Awarie aktywne", value: data?.alerts?.awarie?.length ?? 0 },
      { label: "Serwis wkrótce", value: data?.alerts?.serwisSoon?.length ?? 0 },
    { label: "Serwis po terminie", value: data?.alerts?.serwisOverdue?.length ?? 0 },
  ];
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

    if (!form.awaria && form.motogodziny === "") {
      setError("Podaj aktualne motogodziny");
      return;
    }

    if (form.awaria && !form.opis.trim()) {
      setError("Podaj opis awarii");
      return;
    }

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
        <h1>Witamy w aplikacji do zarzadzania zapleczem</h1>
        <p>Zaloguj się, aby zobaczyć przypisane maszyny, alerty serwisowe i zgłoszenia.</p>
      </section>
    );
  }

  const dashboardType = data?.roleDashboard || "";
  const isRoleDashboard =
    dashboardType === "admin" ||
    dashboardType === "kierownik" ||
    dashboardType === "brygadzista" ||
    dashboardType === "biuro";

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
      meta: `Stan licznika: ${Math.round(item.currentHours)} mth • prog: ${Math.round(item.nextServiceAt)} mth`,
    })) || []),
    ...((data?.alerts?.serwisSoon || []).map((item) => ({
      ...item,
      kind: "soon",
      title: item.nr,
      description: `Do serwisu zostało około ${Math.round(item.remaining)} mth`,
      meta: `Stan licznika: ${Math.round(item.currentHours)} mth • prog: ${Math.round(item.nextServiceAt)} mth`,
    })) || []),
  ];

  const stats = getStatsForDashboard(dashboardType, data);

  return (
    <section className="home dashboardHome">
      <div className="sectionIntro">
        <h1>Panel główny</h1>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="statsGrid dashboardStats">
        {stats.map((item) => (
          <article className="statCard" key={item.label}>
            <span className="statLabel">{item.label}</span>
            <strong className="statValue">{item.value}</strong>
          </article>
        ))}
      </div>

      {dashboardType === "brygadzista" || dashboardType === "kierownik" ? (
        <div className="stackSection">
          <DashboardScopePanel dashboardType={dashboardType} data={data} />
        </div>
      ) : (
        <div className="stackSection">
          <DashboardScopePanel dashboardType={dashboardType} data={data} />
          <DashboardAlerts
            awariaAlerts={awariaAlerts}
            serviceAlerts={serviceAlerts}
            managerMode={isRoleDashboard}
          />
        </div>
      )}

      {user.role === "operator" ? (
        <div className="stackSection">
          <div className="sectionIntro">
            <h2>Moje maszyny</h2>
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

                    <div className="actions">
                      <button
                        type="button"
                        className={!form.awaria ? "" : "secondary"}
                        onClick={() =>
                          setFormFor(machine.id, { ...form, awaria: false, opis: "" })
                        }
                      >
                        Dodaj odczyt motogodzin
                      </button>
                      <button
                        type="button"
                        className={form.awaria ? "danger" : "secondary"}
                        onClick={() => setFormFor(machine.id, { ...form, awaria: true })}
                      >
                        Zgłoś awarię
                      </button>
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

                      {form.awaria ? (
                        <label style={{ gridColumn: "1 / -1" }}>
                          <span>Opis awarii</span>
                          <textarea
                            rows={3}
                            value={form.opis}
                            onChange={(e) =>
                              setFormFor(machine.id, { ...form, opis: e.target.value })
                            }
                            placeholder="Krótko opisz problem..."
                            required
                          />
                        </label>
                      ) : null}
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        disabled={savingId === machine.id}
                        onClick={() => submitReport(machine.id)}
                      >
                        {savingId === machine.id
                          ? "Zapisywanie..."
                          : form.awaria
                            ? "Zgłoś awarię"
                            : "Zapisz odczyt"}
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
