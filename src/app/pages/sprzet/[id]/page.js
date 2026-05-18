"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { asArray, fetchJsonResult, getErrorMessage, getTodayIso, getUpcomingServiceAlert } from "@/lib/client-utils";

export default function SprzetDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const today = getTodayIso();
  const createEmptyForm = () => ({
    przebieg: "",
    awaria: "",
    status_awarii: "brak",
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

  const activeFailures = useMemo(
    () =>
      items.filter(
        (item) => item?.awaria && String(item?.status_awarii || "") !== "zamknieta"
      ),
    [items]
  );
  const latestHours = useMemo(() => {
    for (const item of items) {
      const value = Number(item?.przebieg);
      if (Number.isFinite(value)) return value;
    }

    return null;
  }, [items]);
  const serviceAlert = useMemo(
    () =>
      getUpcomingServiceAlert({
        interval: header?.serwis_co_ile_mth,
        lastService: header?.ostatni_serwis_mth,
        currentValue: latestHours,
      }),
    [header, latestHours]
  );
  const visibleItems = showAllHistory ? items : items.slice(0, 5);

  useEffect(() => {
    setShowAllHistory(false);
  }, [id]);

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

  const fetchHeader = (sprzetId) =>
    fetchJsonResult(`/api/sprzet/${sprzetId}`, { cache: "no-store" });
  const fetchDetails = (sprzetId) =>
    fetchJsonResult(`/api/sprzet/${sprzetId}/details`, { cache: "no-store" });

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

  const refreshPage = async (sprzetId) => {
    const [headerResult, detailsResult] = await Promise.all([
      fetchHeader(sprzetId),
      fetchDetails(sprzetId),
    ]);

    applyHeader(headerResult);
    applyDetails(detailsResult);
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setErr("");

      const [headerResult, detailsResult] = await Promise.all([
        fetchHeader(id),
        fetchDetails(id),
      ]);

      if (cancelled) return;

      applyHeader(headerResult);
      applyDetails(detailsResult);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reset = () => {
    setForm(createEmptyForm());
    setEditId(null);
    setIsFormOpen(false);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      if (form.awaria.trim() && !form.wykonawca.trim()) {
        throw new Error("Przy awarii wymagany jest wykonawca");
      }

      const body = {
        przebieg: form.przebieg === "" ? null : Number(form.przebieg),
        awaria: form.awaria?.trim() || null,
        status_awarii: form.awaria?.trim() ? form.status_awarii : "brak",
        wykonawca: form.wykonawca?.trim() || null,
        uwagi: form.uwagi?.trim() || null,
        data_zdarzenia: form.data_zdarzenia || null,
      };

      const url = editId
        ? `/api/sprzet/${id}/details/${editId}`
        : `/api/sprzet/${id}/details`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu");

      reset();
      await refreshPage(id);
    } catch (error) {
      setErr(error.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setIsFormOpen(true);
    setEditId(item.id);
    setForm({
      przebieg: item.przebieg ?? "",
      awaria: item.awaria ?? "",
      status_awarii: item.status_awarii ?? (item.awaria ? "nowa" : "brak"),
      wykonawca: item.wykonawca ?? "",
      uwagi: item.uwagi ?? "",
      data_zdarzenia: item.data_zdarzenia
        ? String(item.data_zdarzenia).slice(0, 10)
        : today,
    });
  };

  const del = async (detailId) => {
    if (!confirm("Usunąć wpis?")) return;

    const res = await fetch(`/api/sprzet/${id}/details/${detailId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await refreshPage(id);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setErr(data?.error || "Błąd usuwania");
  };

  const submitRepair = async (item) => {
    setErr("");
    setRepairSavingId(item.id);

    try {
      if (!repairForm.wykonawca.trim()) {
        throw new Error("Przy zamykaniu awarii wymagany jest wykonawca");
      }

      const res = await fetch(`/api/sprzet/${id}/details/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_zdarzenia: repairForm.data_zdarzenia || null,
          przebieg: item.przebieg,
          awaria: item.awaria,
          status_awarii: "zamknieta",
          wykonawca: repairForm.wykonawca.trim(),
          uwagi: repairForm.uwagi.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Nie udało się zamknąć awarii");

      setRepairFormOpenId(null);
      setRepairForm(createRepairForm());
      await refreshPage(id);
    } catch (error) {
      setErr(error.message || "Nie udało się zamknąć awarii");
    } finally {
      setRepairSavingId(null);
    }
  };

  const submitService = async (e) => {
    e.preventDefault();
    setServiceSaving(true);
    setErr("");

    try {
      const res = await fetch(`/api/sprzet/${id}/serwis`, {
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

  const renderFailure = (value) => {
    if (!value) {
      return <span className="historyBadge historyBadgeSuccess">brak awarii</span>;
    }

    return <span className="historyBadge historyBadgeDanger">{value}</span>;
  };

  const renderFailureStatus = (status) => {
    if (status === "zamknieta") {
      return <span className="historyBadge historyBadgeSuccess">naprawiona</span>;
    }

    if (status === "w trakcie") {
      return <span className="historyBadge historyBadgeInfo">w trakcie</span>;
    }

    if (status === "nowa") {
      return <span className="historyBadge historyBadgeDanger">nowa</span>;
    }

    return <span className="historyBadge historyBadgeNeutral">brak</span>;
  };

  return (
    <div className="detailsPage machineDetailsPage">
      <button
        type="button"
        className="secondary detailsBackButton"
        onClick={() => router.push("/pages/sprzet")}
      >
        Wróć do listy
      </button>

      <div className="detailsHero">
        <div className="sectionIntro">
          <span className="rowEyebrow">Sprzęt</span>
          <h1>Szczegóły sprzętu</h1>
          <p>Najważniejsze dane sprzętu oraz pełna historia zdarzeń i zgłoszeń.</p>
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
                <span className="detailsStatLabel">Brygadzista</span>
                <strong className="detailsStatValue">{header.brygadzista || "-"}</strong>
              </div>
            </div>
          </div>
        ) : (
          <p>Ładowanie...</p>
        )}
      </div>

      <section className={`formPanel ${isFormOpen ? "formPanelOpen" : ""}`}>
        <div className="formPanelHeader">
          <div>
            <h2>{editId ? "Edytuj zdarzenie" : "Dodaj zdarzenie"}</h2>
            <p>
              {editId
                ? "Zmień dane wybranego wpisu w historii."
                : "Dodaj nowy wpis do historii zdarzeń tego sprzętu."}
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
                  : "Dodaj zdarzenie"}
              </span>
            </span>
          </button>
        </div>

        <div className={`formPanelBody ${isFormOpen ? "formPanelBodyOpen" : ""}`}>
          <form className="card" onSubmit={submit}>
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
                <span>Przebieg / licznik</span>
                <input
                  type="number"
                  value={form.przebieg}
                  onChange={(e) => setForm({ ...form, przebieg: e.target.value })}
                  min="0"
                  placeholder="np. 320"
                />
              </label>

              <label>
                <span>Awaria</span>
                <input
                  value={form.awaria}
                  onChange={(e) =>
                    setForm((current) => {
                      const awaria = e.target.value.slice(0, 30);
                      return {
                        ...current,
                        awaria,
                        status_awarii: awaria
                          ? current.status_awarii === "brak"
                            ? "nowa"
                            : current.status_awarii
                          : "brak",
                      };
                    })
                  }
                  placeholder="np. Uszkodzony przewód"
                />
              </label>

              <label>
                <span>Status awarii</span>
                <select
                  value={form.status_awarii}
                  onChange={(e) => setForm({ ...form, status_awarii: e.target.value })}
                  disabled={!form.awaria.trim()}
                >
                  <option value="brak">brak</option>
                  <option value="nowa">nowa</option>
                  <option value="w trakcie">w trakcie</option>
                  <option value="zamknieta">naprawiona</option>
                </select>
              </label>

              <label>
                <span>Wykonawca</span>
                <input
                  value={form.wykonawca}
                  onChange={(e) => setForm({ ...form, wykonawca: e.target.value })}
                  placeholder="np. Serwis wewnętrzny"
                  required={Boolean(form.awaria.trim())}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Uwagi</span>
                <textarea
                  value={form.uwagi}
                  onChange={(e) => setForm({ ...form, uwagi: e.target.value.slice(0, 200) })}
                  rows={3}
                  placeholder="Krótki opis zdarzenia..."
                />
              </label>
            </div>

            <div className="actions">
              <button type="submit" disabled={saving}>
                {saving ? "Zapisywanie..." : editId ? "Zapisz" : "Dodaj"}
              </button>

              <button type="button" className="secondary" onClick={reset}>
                Anuluj
              </button>
            </div>

            {err && <p className="error">{err}</p>}
          </form>
        </div>
      </section>

      {serviceAlert ? (
        <section className="detailsSection detailsPrioritySection">
          <div className="detailsSectionHeader">
            <div className="sectionIntro">
              <span className="rowEyebrow">Serwis</span>
              <h2>Nadchodzący serwis</h2>
              <p>
                {serviceAlert.overdue
                  ? "Sprzęt przekroczył próg serwisowy i wymaga potwierdzenia wykonania przeglądu."
                  : "Sprzęt zbliża się do progu serwisowego i warto zaplanować przegląd."}
              </p>
            </div>
          </div>

          <div
            className={`historyActiveCard serviceActiveCard ${
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
                      placeholder="np. Serwis wewnętrzny"
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
          </div>
        </section>
      ) : null}

      {activeFailures.length > 0 ? (
        <section className="detailsSection detailsPrioritySection">
          <div className="detailsSectionHeader">
            <div className="sectionIntro">
              <span className="rowEyebrow">Pilne</span>
              <h2>Aktywne awarie</h2>
              <p>Wpisy awaryjne, które wymagają uwagi przy tym sprzęcie.</p>
            </div>

            <div className="historyCount">
              <strong>{activeFailures.length}</strong>
              <span>aktywnych</span>
            </div>
          </div>

          <div className="historyActiveList">
            {activeFailures.map((item) => (
              <article className="historyActiveCard" key={item.id}>
                <div className="historyActiveCardTop">
                  <span className="historyBadge historyBadgeDanger">aktywna awaria</span>
                  <span className="mutedText">
                    {item.data_zdarzenia ? String(item.data_zdarzenia).slice(0, 10) : "-"}
                  </span>
                </div>
                <strong className="historyActiveTitle">
                  {item.awaria || "Zgłoszenie awarii bez opisu"}
                </strong>
                <div className="historyActiveMeta">
                  <span>Wykonawca: {item.wykonawca || "brak"}</span>
                  <span>Przebieg / licznik: {item.przebieg ?? "brak"}</span>
                  <span>Status: {item.status_awarii || "nowa"}</span>
                </div>
                {item.uwagi ? <p className="mutedText">{item.uwagi}</p> : null}
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      if (repairFormOpenId === item.id) {
                        setRepairFormOpenId(null);
                        return;
                      }

                      setRepairFormOpenId(item.id);
                      setRepairForm({
                        data_zdarzenia: today,
                        wykonawca: item.wykonawca || "",
                        uwagi: item.uwagi || item.awaria || "",
                      });
                    }}
                  >
                    {repairFormOpenId === item.id
                      ? "Ukryj formularz"
                      : "Oznacz jako naprawioną"}
                  </button>
                </div>

                {repairFormOpenId === item.id ? (
                  <form
                    className="card serviceInlineForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitRepair(item);
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
                      <button type="submit" disabled={repairSavingId === item.id}>
                        {repairSavingId === item.id ? "Zapisywanie..." : "Zapisz naprawę"}
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
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detailsSection detailsHistorySection">
        <div className="detailsSectionHeader">
          <div className="sectionIntro">
            <span className="rowEyebrow">Historia</span>
            <h2>Historia zdarzeń</h2>
            <p>Wszystkie wpisy dotyczące tego sprzętu w jednym, czytelnym widoku.</p>
          </div>
        </div>

        <div className="tableWrap">
          {items.length === 0 ? (
            <p>Brak wpisów</p>
          ) : (
            <>
              <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Przebieg</th>
                  <th>Awaria</th>
                  <th>Status</th>
                  <th>Wykonawca</th>
                  <th>Uwagi</th>
                  <th>Akcje</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.awaria && item.status_awarii !== "zamknieta"
                        ? "historyRowActive"
                        : ""
                    }
                  >
                    <td data-label="Data">
                      {item.data_zdarzenia
                        ? String(item.data_zdarzenia).slice(0, 10)
                        : "-"}
                    </td>
                    <td data-label="Przebieg">
                      {item.przebieg ?? <span className="historyEmptyValue">brak</span>}
                    </td>
                    <td data-label="Awaria">
                      <div className="historyFailureCell">
                        {renderFailure(item.awaria)}
                        {item.awaria && item.status_awarii !== "zamknieta" ? (
                          <span className="historyBadge historyBadgeOutlineDanger">
                            aktywna
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="Status">{renderFailureStatus(item.status_awarii)}</td>
                    <td data-label="Wykonawca">
                      {item.wykonawca || <span className="historyEmptyValue">brak</span>}
                    </td>
                    <td data-label="Uwagi" className="historyNotesCell">
                      {item.uwagi || <span className="historyEmptyValue">brak uwag</span>}
                    </td>
                    <td className="actionsCell" data-label="Akcje">
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
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>

              {items.length > 5 ? (
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowAllHistory((current) => !current)}
                  >
                    {showAllHistory
                      ? "Pokaż mniej"
                      : `Pokaż pozostałe ${items.length - 5} wpisy`}
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
