"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SprzetDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = {
    przebieg: "",
    awaria: "",
    status_awarii: "brak",
    wykonawca: "",
    uwagi: "",
    data_zdarzenia: today,
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const activeFailures = useMemo(
    () =>
      items.filter(
        (item) => item?.awaria && String(item?.status_awarii || "") !== "zamknieta"
      ),
    [items]
  );

  const loadDetails = async (sprzetId) => {
    const res = await fetch(`/api/sprzet/${sprzetId}/details`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(data?.error || "Błąd pobierania");
      setItems([]);
      return;
    }

    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setErr("");

      const [headerRes, detailsRes] = await Promise.all([
        fetch(`/api/sprzet/${id}`, { cache: "no-store" })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .catch(() => ({ ok: false, data: null })),
        fetch(`/api/sprzet/${id}/details`, { cache: "no-store" })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .catch(() => ({ ok: false, data: null })),
      ]);

      if (cancelled) return;

      setHeader(headerRes.ok ? headerRes.data : null);

      if (detailsRes.ok) {
        setItems(Array.isArray(detailsRes.data) ? detailsRes.data : []);
      } else {
        setItems([]);
        setErr(detailsRes.data?.error || "Błąd pobierania");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reset = () => {
    setForm(emptyForm);
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
      await loadDetails(id);
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
      await loadDetails(id);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setErr(data?.error || "Błąd usuwania");
  };

  const markAsResolved = async (item) => {
    setErr("");

    try {
      const wykonawca =
        (item.wykonawca || "").trim() ||
        prompt("Kto usunął awarię? Wpisz wykonawcę naprawy.", "")?.trim() ||
        "";
      if (!wykonawca) {
        throw new Error("Przy zamykaniu awarii wymagany jest wykonawca");
      }

      const res = await fetch(`/api/sprzet/${id}/details/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_zdarzenia: item.data_zdarzenia,
          przebieg: item.przebieg,
          awaria: item.awaria,
          status_awarii: "zamknieta",
          wykonawca,
          uwagi: item.uwagi,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Nie udało się zamknąć awarii");

      await loadDetails(id);
    } catch (error) {
      setErr(error.message || "Nie udało się zamknąć awarii");
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
    <div className="detailsPage">
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
          <div className="card detailsSummary">
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

      {activeFailures.length > 0 ? (
        <section className="detailsSection">
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
                    onClick={() => markAsResolved(item)}
                  >
                    Oznacz jako naprawioną
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detailsSection">
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
                {items.map((item) => (
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
          )}
        </div>
      </section>
    </div>
  );
}
