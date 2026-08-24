"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  asArray,
  fetchJsonResult,
  getErrorMessage,
  getTodayIso,
  getUpcomingServiceAlert,
} from "@/lib/client-utils";

export default function MaszynaDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [reports, setReports] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [entryType, setEntryType] = useState("licznik");

  const today = getTodayIso();
  const createEmptyForm = () => ({
    przebieg: "",
    awaria: "",
    wykonawca: "",
    uwagi: "",
    data_zdarzenia: today,
  });
  const createServiceForm = (hours = "") => ({
    data_zdarzenia: today,
    wykonany_przy_mth: hours ?? "",
    wykonawca: "",
    uwagi: "",
  });
  const createRepairForm = () => ({
    data_zdarzenia: today,
    wykonawca: "",
    uwagi: "",
  });

  const [form, setForm] = useState(createEmptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceForm, setServiceForm] = useState(() => createServiceForm(""));
  const [repairFormOpenId, setRepairFormOpenId] = useState(null);
  const [repairSavingId, setRepairSavingId] = useState(null);
  const [repairForm, setRepairForm] = useState(createRepairForm);

  const fetchHeader = (machineId) =>
    fetchJsonResult(`/api/maszyny/${machineId}`, { cache: "no-store" });
  const fetchDetails = (machineId) =>
    fetchJsonResult(`/api/maszyny/${machineId}/details`, { cache: "no-store" });
  const fetchReports = (machineId) =>
    fetchJsonResult(`/api/maszyny/${machineId}/raporty`, { cache: "no-store" });

  const applyHeader = (result) => {
    setHeader(result.ok ? result.data : null);
  };

  const applyDetails = (result) => {
    if (!result.ok) {
      setItems([]);
      setErr(getErrorMessage(result, "Błąd pobierania"));
      return;
    }

    setItems(asArray(result.data));
  };

  const applyReports = (result) => {
    setReports(result.ok ? asArray(result.data) : []);
  };

  const refreshPage = async (machineId) => {
    const [headerResult, detailsResult, reportsResult] = await Promise.all([
      fetchHeader(machineId),
      fetchDetails(machineId),
      fetchReports(machineId),
    ]);

    applyHeader(headerResult);
    applyDetails(detailsResult);
    applyReports(reportsResult);
  };

  const refreshHistory = async (machineId) => {
    const [detailsResult, reportsResult] = await Promise.all([
      fetchDetails(machineId),
      fetchReports(machineId),
    ]);

    applyDetails(detailsResult);
    applyReports(reportsResult);
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setErr("");

      const [headerResult, detailsResult, reportsResult] = await Promise.all([
        fetchHeader(id),
        fetchDetails(id),
        fetchReports(id),
      ]);

      if (cancelled) return;

      applyHeader(headerResult);
      applyDetails(detailsResult);
      applyReports(reportsResult);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    fetchJsonResult("/api/me", { cache: "no-store" })
      .then((result) => setMe(result.ok && result.data?.ok ? result.data : null))
      .catch(() => setMe(null));
  }, []);

  const canManage = me?.role !== "operator";
  const activeFailures = useMemo(
    () =>
      reports.filter(
        (report) => report?.awaria && String(report?.status_awarii || "") !== "zamknieta"
      ),
    [reports]
  );

  const latestHours = useMemo(() => {
    for (const report of reports) {
      const value = Number(report?.motogodziny);
      if (Number.isFinite(value)) return value;
    }

    return null;
  }, [reports]);

  const serviceAlert = useMemo(
    () =>
      getUpcomingServiceAlert({
        interval: header?.serwis_co_ile_mth,
        lastService: header?.ostatni_serwis_mth,
        currentValue: latestHours,
      }),
    [header, latestHours]
  );

  const activeFailureKeys = useMemo(
    () =>
      new Set(
        activeFailures.map(
          (report) =>
            `${String(report.data_raportu || "").slice(0, 10)}|${report.opis || ""}|${
              report.username || ""
            }`
        )
      ),
    [activeFailures]
  );

  const filteredItems = items.filter((item) => {
    if (sourceFilter === "all") return true;
    return (item?.zrodlo || "serwis") === sourceFilter;
  });
  const visibleItems = showAllHistory ? filteredItems : filteredItems.slice(0, 5);

  useEffect(() => {
    setShowAllHistory(false);
  }, [sourceFilter, id]);

  useEffect(() => {
    if (!serviceAlert) {
      setServiceForm((current) => ({
        ...current,
        wykonany_przy_mth: latestHours ?? "",
      }));
      return;
    }

    setServiceForm((current) => ({
      ...current,
      wykonany_przy_mth:
        current.wykonany_przy_mth === "" || Number(current.wykonany_przy_mth) !== latestHours
          ? latestHours ?? ""
          : current.wykonany_przy_mth,
    }));
  }, [serviceAlert, latestHours]);

  const reset = () => {
    setForm(createEmptyForm());
    setEntryType("licznik");
    setEditId(null);
    setIsFormOpen(false);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      if (entryType === "awaria" && !form.awaria.trim()) {
        throw new Error("Podaj opis awarii");
      }

      if (entryType === "licznik" && form.przebieg === "") {
        throw new Error("Podaj aktualne motogodziny");
      }

      const body = {
        przebieg: form.przebieg === "" ? null : Number(form.przebieg),
        awaria: entryType === "awaria" ? form.awaria.trim() : null,
        wykonawca: editId ? form.wykonawca.trim() || null : null,
        uwagi: form.uwagi?.trim() || null,
        data_zdarzenia: form.data_zdarzenia || null,
      };

      const url = editId
        ? `/api/maszyny/${id}/details/${editId}`
        : `/api/maszyny/${id}/details`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      await refreshHistory(id);
    } catch (error) {
      setErr(error.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setIsFormOpen(true);
    setEditId(item.id);
    setEntryType(item.awaria ? "awaria" : "licznik");
    setForm({
      przebieg: item.przebieg ?? "",
      awaria: item.awaria ?? "",
      wykonawca: item.wykonawca ?? "",
      uwagi: item.uwagi ?? "",
      data_zdarzenia: item.data_zdarzenia
        ? String(item.data_zdarzenia).slice(0, 10)
        : today,
    });
  };

  const del = async (detailId) => {
    if (!confirm("Usunąć wpis?")) return;

    const res = await fetch(`/api/maszyny/${id}/details/${detailId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await refreshHistory(id);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setErr(data?.error || "Błąd usuwania");
  };

  const toggleForm = () => {
    if (editId) {
      setIsFormOpen(true);
      return;
    }

    if (isFormOpen) {
      reset();
      return;
    }

    setIsFormOpen(true);
    setErr("");
  };

  const selectEntryType = (type) => {
    setEntryType(type);

    if (type === "licznik") {
      setForm((current) => ({
        ...current,
        awaria: "",
        wykonawca: "",
      }));
    }
  };

  const submitService = async (e) => {
    e.preventDefault();
    setServiceSaving(true);
    setErr("");

    try {
      const res = await fetch(`/api/maszyny/${id}/serwis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_zdarzenia: serviceForm.data_zdarzenia || null,
          wykonany_przy_mth:
            serviceForm.wykonany_przy_mth === ""
              ? latestHours
              : Number(serviceForm.wykonany_przy_mth),
          wykonawca: serviceForm.wykonawca.trim(),
          uwagi: serviceForm.uwagi.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Nie udało się zapisać serwisu");

      setServiceForm(createServiceForm(latestHours ?? ""));
      setServiceFormOpen(false);
      await refreshPage(id);
    } catch (error) {
      setErr(error.message || "Nie udało się zapisać serwisu");
    } finally {
      setServiceSaving(false);
    }
  };

  const submitRepair = async (report) => {
    setErr("");
    setRepairSavingId(report.id);

    try {
      if (!repairForm.wykonawca.trim()) {
        throw new Error("Przy zamykaniu awarii wymagany jest wykonawca");
      }

      const res = await fetch(`/api/maszyny/${id}/raporty/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_awarii: "zamknieta",
          data_zdarzenia: repairForm.data_zdarzenia || null,
          wykonawca: repairForm.wykonawca.trim(),
          uwagi: repairForm.uwagi.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Nie udało się zamknąć awarii");

      setRepairFormOpenId(null);
      setRepairForm(createRepairForm());
      await refreshHistory(id);
    } catch (error) {
      setErr(error.message || "Nie udało się zamknąć awarii");
    } finally {
      setRepairSavingId(null);
    }
  };

  const renderSource = (item) => {
    const isOperator = item.zrodlo === "operator";
    const label = isOperator
      ? item.reporter_username
        ? `operator: ${item.reporter_username}`
        : "operator"
      : "serwis";

    return (
      <span className={`historyBadge ${isOperator ? "historyBadgeInfo" : "historyBadgeNeutral"}`}>
        {label}
      </span>
    );
  };

  const renderFailure = (value) => {
    if (!value) {
      return <span className="historyBadge historyBadgeSuccess">brak awarii</span>;
    }

    return <span className="historyBadge historyBadgeDanger">{value}</span>;
  };

  const isActiveFailureRow = (item) => {
    if (item.zrodlo !== "operator" || !item.awaria) return false;

    const key = `${String(item.data_zdarzenia || "").slice(0, 10)}|${item.awaria || ""}|${
      item.reporter_username || item.wykonawca || ""
    }`;

    return activeFailureKeys.has(key);
  };

  return (
    <div className="detailsPage machineDetailsPage">
      <button
        type="button"
        className="secondary detailsBackButton"
        onClick={() => router.push("/pages/maszyny")}
      >
        Wróć do listy
      </button>

      <div className="detailsHero">
        <div className="sectionIntro">
          <h1>Szczegóły maszyny</h1>
          <p>Pełny podgląd danych maszyny oraz historia zdarzeń operatorskich i serwisowych.</p>
        </div>

        {header ? (
          <div className="card detailsSummary machineDetailsSummary">
            <div className="detailsSummaryContent detailsSummaryGrid">
              <div className="detailsStat">
                <span className="detailsStatLabel">Numer</span>
                <strong className="detailsStatValue">{header.nr ?? "-"}</strong>
              </div>
              <div className="detailsStat">
                <span className="detailsStatLabel">Rodzaj</span>
                <strong className="detailsStatValue">{header.rodzaj || "-"}</strong>
              </div>
              <div className="detailsStat">
                <span className="detailsStatLabel">Marka / model</span>
                <strong className="detailsStatValue">{`${header.marka || "-"} ${header.model || ""}`.trim()}</strong>
              </div>
              <div className="detailsStat">
                <span className="detailsStatLabel">Operator</span>
                <strong className="detailsStatValue">{header.operator || "-"}</strong>
              </div>
            </div>
          </div>
        ) : (
          <p>Ładowanie...</p>
        )}
      </div>

      {serviceAlert || activeFailures.length > 0 ? (
        <section className="detailsSection detailsPrioritySection">
          <div className="detailsSectionHeader">
            <div className="sectionIntro">
              <span className="rowEyebrow">Priorytety</span>
              <h2>Serwis i awarie</h2>
              <p>Najważniejsze rzeczy wymagające reakcji w jednym, lżejszym układzie.</p>
            </div>
          </div>

          <div className="detailsAlertGrid">
            {serviceAlert ? (
              <div
                className={`historyActiveCard serviceActiveCard detailsAlertPanel ${
                  serviceAlert.overdue ? "serviceActiveCardOverdue" : "serviceActiveCardSoon"
                }`}
              >
                <div className="historyActiveCardTop">
                  <span
                    className={`historyBadge ${
                      serviceAlert.overdue ? "historyBadgeDanger" : "historyBadgeInfo"
                    }`}
                  >
                    {serviceAlert.overdue ? "serwis pilny" : "serwis wkrótce"}
                  </span>
                  <span className="mutedText">próg: {serviceAlert.nextServiceAt} mth</span>
                </div>

                <strong className="historyActiveTitle">
                  {serviceAlert.overdue
                    ? `Przegląd przekroczony o ${Math.round(Math.abs(serviceAlert.remaining))} mth`
                    : `Do przeglądu zostało około ${Math.round(serviceAlert.remaining)} mth`}
                </strong>

                <div className="historyActiveMeta">
                  <span>Licznik: {serviceAlert.currentHours} mth</span>
                  <span>Ostatni serwis: {header?.ostatni_serwis_mth ?? "brak"} mth</span>
                  <span>Interwał: {header?.serwis_co_ile_mth ?? "brak"} mth</span>
                </div>

                {canManage ? (
                  <>
                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setServiceFormOpen((current) => !current)}
                      >
                        {serviceFormOpen ? "Ukryj formularz" : "Wykonaj serwis"}
                      </button>
                    </div>

                    {serviceFormOpen ? (
                      <form className="card serviceInlineForm" onSubmit={submitService}>
                        <div className="grid">
                          <label>
                            <span>Data serwisu</span>
                            <input
                              type="date"
                              value={serviceForm.data_zdarzenia}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  data_zdarzenia: e.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <label>
                            <span>Wykonano przy (mth)</span>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={serviceForm.wykonany_przy_mth}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  wykonany_przy_mth: e.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <label>
                            <span>Wykonawca</span>
                            <input
                              value={serviceForm.wykonawca}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  wykonawca: e.target.value,
                                })
                              }
                              placeholder="np. Serwis XYZ"
                              required
                            />
                          </label>

                          <label style={{ gridColumn: "1 / -1" }}>
                            <span>Uwagi</span>
                            <textarea
                              rows={3}
                              value={serviceForm.uwagi}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  uwagi: e.target.value,
                                })
                              }
                              placeholder="Co zostało wykonane podczas serwisu..."
                            />
                          </label>
                        </div>

                        <div className="actions">
                          <button type="submit" disabled={serviceSaving}>
                            {serviceSaving ? "Zapisywanie..." : "Zapisz serwis"}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setServiceFormOpen(false)}
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            {activeFailures.length > 0 ? (
              <div className="detailsAlertPanel">
                <div className="historyActiveList">
                  {activeFailures.map((report) => (
                    <article className="historyActiveCard" key={`combined-${report.id}`}>
                      <div className="historyActiveCardTop">
                        <span className="historyBadge historyBadgeDanger">aktywna awaria</span>
                        <span className="mutedText">
                          {String(report.data_raportu || "").slice(0, 10)}
                        </span>
                      </div>
                      <strong className="historyActiveTitle">
                        {report.opis || "Zgłoszenie awarii bez opisu"}
                      </strong>
                      <div className="historyActiveMeta">
                        <span>Operator: {report.username || "brak"}</span>
                        <span>Status: {report.status_awarii || "nowa"}</span>
                        <span>Motogodziny: {report.motogodziny ?? "brak"}</span>
                      </div>
                      {canManage ? (
                        <>
                          <div className="actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => {
                                if (repairFormOpenId === report.id) {
                                  setRepairFormOpenId(null);
                                  return;
                                }

                                setRepairFormOpenId(report.id);
                                setRepairForm({
                                  data_zdarzenia: today,
                                  wykonawca: "",
                                  uwagi: report.opis || "",
                                });
                              }}
                            >
                              {repairFormOpenId === report.id
                                ? "Ukryj formularz"
                                : "Oznacz jako naprawioną"}
                            </button>
                          </div>

                          {repairFormOpenId === report.id ? (
                            <form
                              className="card serviceInlineForm"
                              onSubmit={(e) => {
                                e.preventDefault();
                                submitRepair(report);
                              }}
                            >
                              <div className="grid">
                                <label>
                                  <span>Data naprawy</span>
                                  <input
                                    type="date"
                                    value={repairForm.data_zdarzenia}
                                    onChange={(e) =>
                                      setRepairForm({
                                        ...repairForm,
                                        data_zdarzenia: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  <span>Wykonawca</span>
                                  <input
                                    value={repairForm.wykonawca}
                                    onChange={(e) =>
                                      setRepairForm({
                                        ...repairForm,
                                        wykonawca: e.target.value,
                                      })
                                    }
                                    placeholder="np. Serwis wewnętrzny"
                                    required
                                  />
                                </label>

                                <label style={{ gridColumn: "1 / -1" }}>
                                  <span>Uwagi</span>
                                  <textarea
                                    rows={3}
                                    value={repairForm.uwagi}
                                    onChange={(e) =>
                                      setRepairForm({
                                        ...repairForm,
                                        uwagi: e.target.value,
                                      })
                                    }
                                    placeholder="Co zostało wykonane podczas naprawy..."
                                  />
                                </label>
                              </div>

                              <div className="actions">
                                <button type="submit" disabled={repairSavingId === report.id}>
                                  {repairSavingId === report.id
                                    ? "Zapisywanie..."
                                    : "Zapisz naprawę"}
                                </button>
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => setRepairFormOpenId(null)}
                                >
                                  Anuluj
                                </button>
                              </div>
                            </form>
                          ) : null}
                        </>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {canManage ? (
        <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
          <div className="formPanelHeader">
            <div>
              <h2>{editId ? "Edytuj wpis" : "Nowy wpis"}</h2>
              <p>
                {editId
                  ? "Zmień dane wybranego wpisu."
                  : "Wybierz, czy chcesz dodać odczyt motogodzin, czy zgłosić awarię."}
              </p>
            </div>

            <button type="button" onClick={toggleForm}>
              <span className={`formPanelToggle ${isFormOpen ? "formPanelToggleOpen" : ""}`}>
                <span className="formPanelToggleIcon" aria-hidden="true">
                  {isFormOpen ? "−" : "+"}
                </span>
                <span>
                  {isFormOpen
                    ? editId
                      ? "Tryb edycji"
                      : "Ukryj formularz"
                    : "Dodaj wpis"}
                </span>
              </span>
            </button>
          </div>

          <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
            <form className="card" onSubmit={submit}>
              {!editId ? (
                <div className="actions">
                  <button
                    type="button"
                    className={entryType === "licznik" ? "" : "secondary"}
                    onClick={() => selectEntryType("licznik")}
                  >
                    Dodaj odczyt motogodzin
                  </button>
                  <button
                    type="button"
                    className={entryType === "awaria" ? "danger" : "secondary"}
                    onClick={() => selectEntryType("awaria")}
                  >
                    Zgłoś awarię
                  </button>
                </div>
              ) : null}

              <div className="grid">
                <label>
                  <span>Data zdarzenia</span>
                  <input
                    type="date"
                    value={form.data_zdarzenia}
                    onChange={(e) => setForm({ ...form, data_zdarzenia: e.target.value })}
                    required
                  />
                </label>

                <label>
                  <span>Aktualne motogodziny</span>
                  <input
                    type="number"
                    value={form.przebieg}
                    onChange={(e) => setForm({ ...form, przebieg: e.target.value })}
                    min="0"
                    placeholder="np. 12500"
                    required={entryType === "licznik"}
                  />
                </label>

                {entryType === "awaria" ? (
                  <>
                    <label>
                      <span>Opis awarii</span>
                      <input
                        value={form.awaria}
                        onChange={(e) => setForm({ ...form, awaria: e.target.value.slice(0, 80) })}
                        placeholder="np. Uszkodzony wąż"
                        required
                      />
                    </label>

                  </>
                ) : null}

                <label style={{ gridColumn: "1 / -1" }}>
                  <span>Uwagi</span>
                  <textarea
                    value={form.uwagi}
                    onChange={(e) => setForm({ ...form, uwagi: e.target.value.slice(0, 200) })}
                    rows={3}
                    placeholder={entryType === "awaria" ? "Dodatkowe informacje o awarii..." : "Opcjonalna notatka do odczytu..."}
                  />
                </label>
              </div>

              <div className="actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Zapisywanie..."
                    : editId
                      ? "Zapisz"
                      : entryType === "awaria"
                        ? "Zgłoś awarię"
                        : "Zapisz odczyt"}
                </button>

                <button type="button" className="secondary" onClick={reset}>
                  Anuluj
                </button>
              </div>

              {err && <p className="error">{err}</p>}
            </form>
          </div>
        </section>
      ) : null}

      <section className="detailsSection detailsHistorySection">
        <div className="detailsSectionHeader">
          <div className="sectionIntro">
            <span className="rowEyebrow">Historia</span>
            <h2>Historia zdarzeń</h2>
            <p>Wpisy serwisowe i operatorskie związane z tą maszyną.</p>
          </div>

          <div className="historyFilters">
            <label className="historyFilterField">
              <span>Źródło</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">Wszystkie</option>
                <option value="serwis">Serwis</option>
                <option value="operator">Operator</option>
              </select>
            </label>
          </div>

          <div className="historyCount">
            <strong>{filteredItems.length}</strong>
            <span>wpisów</span>
          </div>
        </div>

        <div className="tableWrap">
          {filteredItems.length === 0 ? (
            <p>Brak wpisów</p>
          ) : (
            <>
              <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Źródło</th>
                  <th>Przebieg</th>
                  <th>Awaria</th>
                  <th>Wykonawca</th>
                  <th>Uwagi</th>
                  <th>Akcje</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className={isActiveFailureRow(item) ? "historyRowActive" : ""}
                  >
                    <td data-label="Data">
                      {item.data_zdarzenia
                        ? String(item.data_zdarzenia).slice(0, 10)
                        : "-"}
                    </td>
                    <td data-label="Źródło">{renderSource(item)}</td>
                    <td data-label="Przebieg">
                      {item.przebieg ?? <span className="historyEmptyValue">brak</span>}
                    </td>
                    <td data-label="Awaria">
                      <div className="historyFailureCell">
                        {renderFailure(item.awaria)}
                        {isActiveFailureRow(item) ? (
                          <span className="historyBadge historyBadgeOutlineDanger">
                            aktywna
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="Wykonawca">
                      {item.wykonawca || <span className="historyEmptyValue">brak</span>}
                    </td>
                    <td data-label="Uwagi" className="historyNotesCell">
                      {item.uwagi || <span className="historyEmptyValue">brak uwag</span>}
                    </td>
                    <td className="actionsCell" data-label="Akcje">
                      {canManage ? (
                        <>
                          <button type="button" onClick={() => edit(item)}>
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => del(item.id)}
                          >
                            Usuń
                          </button>
                        </>
                      ) : (
                        <span className="mutedText">Tylko podgląd</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>

              {filteredItems.length > 5 ? (
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowAllHistory((current) => !current)}
                  >
                    {showAllHistory
                      ? "Pokaż mniej"
                      : `Pokaż pozostałe ${filteredItems.length - 5} wpisy`}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
