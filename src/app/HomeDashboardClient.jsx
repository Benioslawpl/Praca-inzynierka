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
  return "uzytkownik";
}

function statusLabel(status) {
  if (status === "w_toku") return "w toku";
  if (status === "wstrzymana") return "wstrzymana";
  if (status === "zakonczona") return "zakonczona";
  return "planowana";
}

function getDashboardIntro(type) {
  if (type === "kierownik") {
    return "podsumowanie budow, przypisanych zasobow oraz biezacych awarii i serwisow.";
  }

  if (type === "brygadzista") {
    return "brygady, powiazane budowy oraz awarie i serwisy maszyn pracujacych dla Twoich zespolow.";
  }

  if (type === "biuro") {
    return "ogolny stan budow, brygad, maszyn oraz najwazniejsze alerty operacyjne.";
  }

  return "biezace awarie, nadchodzace serwisy i szybkie zgloszenia z maszyn.";
}

function DashboardAlerts({ awariaAlerts, serviceAlerts, managerMode = false }) {
  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <div>
          <h2>Najwazniejsze alerty</h2>
          <p className="mutedText">
            {managerMode
              ? "Awarie i serwisy dla maszyn widocznych w Twoim zakresie."
              : "Awarie i serwisy, ktore wymagaja reakcji."}
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
                  <span className="mutedText">Na ten moment nie ma otwartych zgloszen.</span>
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
            <strong>{managerMode ? "Alerty serwisowe" : "Nadchodzace serwisy"}</strong>
            <span className="mutedText">{serviceAlerts.length}</span>
          </div>

          <div className="dashboardServiceList">
            {serviceAlerts.length === 0 ? (
              <div className="compactListRow compactMetricRow dashboardAlertCard dashboardAlertCardOk">
                <div className="compactListMain">
                  <strong>Brak pilnych serwisow</strong>
                  <span className="mutedText">Nie ma maszyn wymagajacych teraz przegladu.</span>
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
                        {item.kind === "overdue" ? "pilne" : "wkrotce"}
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

function DashboardScopePanel({ dashboardType, data }) {
  if (dashboardType === "kierownik") {
    return (
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
                <strong>Brak przypisanych budow</strong>
                <span className="mutedText">
                  To konto nie ma jeszcze zadnej budowy z przypisanym kierownikiem.
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
    );
  }

  if (dashboardType === "brygadzista") {
    const brygady = data?.managedBrygady || [];
    const budowy = data?.managedBudowy || [];

    return (
      <article className="card sectionCard">
        <div className="sectionCardHeader">
          <div>
            <h2>Moje brygady i budowy</h2>
            <p className="mutedText">Szybki podglad przypisanych zespolow i realizacji.</p>
          </div>
          <span className="metricBadge">{brygady.length + budowy.length}</span>
        </div>

        <div className="compactList">
          {brygady.map((brygada) => (
            <Link
              key={`brygada-${brygada.id}`}
              href={`/pages/brygady/${brygada.id}`}
              className="dashboardAlertLinkWrap"
            >
              <div className="compactListRow compactMetricRow">
                <div className="compactListMain">
                  <strong>{brygada.numer}</strong>
                  <span className="mutedText">Brygada przypisana do Twojego konta</span>
                </div>
                <span className="pill">brygada</span>
              </div>
            </Link>
          ))}

          {budowy.map((budowa) => (
            <Link
              key={`budowa-${budowa.id}`}
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
                <span className="pill">{statusLabel(budowa.status)}</span>
              </div>
            </Link>
          ))}

          {brygady.length === 0 && budowy.length === 0 ? (
            <div className="compactListRow">
              <div className="compactListMain">
                <strong>Brak przypisan</strong>
                <span className="mutedText">
                  To konto nie ma jeszcze przypisanej brygady ani budowy.
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  if (dashboardType === "biuro") {
    return (
      <article className="card sectionCard">
        <div className="sectionCardHeader">
          <div>
            <h2>Ostatnie budowy</h2>
            <p className="mutedText">Krotki przekroj aktualnych i ostatnio dodanych realizacji.</p>
          </div>
          <span className="metricBadge">{data?.recentBudowy?.length ?? 0}</span>
        </div>

        <div className="compactList">
          {(data?.recentBudowy || []).length === 0 ? (
            <div className="compactListRow">
              <div className="compactListMain">
                <strong>Brak budow</strong>
                <span className="mutedText">Nie ma jeszcze zadnych budow w ewidencji.</span>
              </div>
            </div>
          ) : (
            data.recentBudowy.map((budowa) => (
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
                  <span className="pill">{statusLabel(budowa.status)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </article>
    );
  }

  const assignedMachines = data?.assignedMachines || [];

  return (
    <article className="card sectionCard">
      <div className="sectionCardHeader">
        <div>
          <h2>Twoj zakres</h2>
          <p className="mutedText">Szybki podglad maszyn przypisanych do tego konta.</p>
        </div>
        <span className="metricBadge">{assignedMachines.length}</span>
      </div>

      <div className="compactList">
        {assignedMachines.length === 0 ? (
          <div className="compactListRow">
            <div className="compactListMain">
              <strong>Brak przypisanych maszyn</strong>
              <span className="mutedText">
                To konto nie ma jeszcze aktywnego przypisania do maszyny.
              </span>
            </div>
          </div>
        ) : (
          assignedMachines.map((machine) => (
            <Link
              key={machine.id}
              href={`/pages/maszyny/${machine.id}`}
              className="dashboardAlertLinkWrap"
            >
              <div className="compactListRow compactMetricRow">
                <div className="compactListMain">
                  <strong>{machine.nr || `Maszyna #${machine.id}`}</strong>
                  <span>
                    {machine.marka || "-"} {machine.model || ""}
                  </span>
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
      throw new Error(payload?.error || "Blad pobierania dashboardu");
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
        setError(err.message || "Blad pobierania dashboardu");
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
        throw new Error(payload?.error || "Nie udalo sie zapisac raportu");
      }

      await refreshDashboard();
      setForms((current) => ({
        ...current,
        [machineId]: EMPTY_REPORT,
      }));
    } catch (err) {
      setError(err.message || "Nie udalo sie zapisac raportu");
    } finally {
      setSavingId(null);
    }
  };

  if (!user) {
    return (
      <section className="home">
        <h1>Witamy w aplikacji do zarzadzania zapleczem</h1>
        <p>Zaloguj sie, aby zobaczyc przypisane maszyny, alerty serwisowe i zgloszenia.</p>
      </section>
    );
  }

  const dashboardType = data?.roleDashboard || "";
  const isRoleDashboard =
    dashboardType === "kierownik" ||
    dashboardType === "brygadzista" ||
    dashboardType === "biuro";

  const awariaAlerts = (data?.alerts?.awarie || []).map((item) => ({
    ...item,
    title: item.nr,
    description: item.opis || "Aktywne zgloszenie awarii",
    meta: `Zgloszono: ${fmtDate(item.date)}`,
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
      description: `Do serwisu zostalo okolo ${Math.round(item.remaining)} mth`,
      meta: `Stan licznika: ${Math.round(item.currentHours)} mth • prog: ${Math.round(item.nextServiceAt)} mth`,
    })) || []),
  ];

  return (
    <section className="home dashboardHome">
      <div className="sectionIntro">
        <h1>Panel glowny</h1>
        <p>
          Zalogowano jako <b>{user.username}</b> ({roleLabel(user.role)}). Tutaj widac{" "}
          {getDashboardIntro(dashboardType)}
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="statsGrid dashboardStats">
        <article className="statCard">
          <span className="statLabel">
            {dashboardType === "kierownik"
              ? "Aktywne budowy"
              : dashboardType === "brygadzista"
                ? "Moje brygady"
                : dashboardType === "biuro"
                  ? "Wszystkie budowy"
                  : "Awarie aktywne"}
          </span>
          <strong className="statValue">
            {dashboardType === "kierownik"
              ? data?.summary?.activeBudowy ?? 0
              : dashboardType === "brygadzista"
                ? data?.summary?.brygady ?? 0
                : dashboardType === "biuro"
                  ? data?.summary?.totalBudowy ?? 0
                  : data?.alerts?.awarie?.length ?? 0}
          </strong>
        </article>

        <article className="statCard">
          <span className="statLabel">
            {dashboardType === "kierownik"
              ? "Brygady na budowach"
              : dashboardType === "brygadzista"
                ? "Moje budowy"
                : dashboardType === "biuro"
                  ? "Aktywne budowy"
                  : "Serwis wkrotce"}
          </span>
          <strong className="statValue">
            {dashboardType === "kierownik"
              ? data?.summary?.brygady ?? 0
              : dashboardType === "brygadzista"
                ? data?.summary?.budowy ?? 0
                : dashboardType === "biuro"
                  ? data?.summary?.activeBudowy ?? 0
                  : data?.alerts?.serwisSoon?.length ?? 0}
          </strong>
        </article>

        <article className="statCard">
          <span className="statLabel">
            {isRoleDashboard ? "Maszyny" : "Serwis po terminie"}
          </span>
          <strong className="statValue">
            {isRoleDashboard
              ? data?.summary?.maszyny ?? 0
              : data?.alerts?.serwisOverdue?.length ?? 0}
          </strong>
        </article>

      </div>

      {isRoleDashboard ? (
        <div className="splitLayout dashboardLayout">
          <DashboardScopePanel dashboardType={dashboardType} data={data} />
          <DashboardAlerts
            awariaAlerts={awariaAlerts}
            serviceAlerts={serviceAlerts}
            managerMode
          />
        </div>
      ) : (
        <div className="splitLayout dashboardLayout">
          <DashboardScopePanel dashboardType={dashboardType} data={data} />
          <DashboardAlerts awariaAlerts={awariaAlerts} serviceAlerts={serviceAlerts} />
        </div>
      )}

      {user.role === "operator" ? (
        <div className="stackSection">
          <div className="sectionIntro">
            <h2>Moje maszyny</h2>
            <p>Wpisuj motogodziny i zglaszaj awarie bezposrednio ze swojego panelu.</p>
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
                          <option value="tak">zglos awarie</option>
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
                          placeholder="Krotki opis pracy, przestoju albo awarii..."
                        />
                      </label>
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        disabled={savingId === machine.id}
                        onClick={() => submitReport(machine.id)}
                      >
                        {savingId === machine.id ? "Zapisywanie..." : "Wyslij raport"}
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
