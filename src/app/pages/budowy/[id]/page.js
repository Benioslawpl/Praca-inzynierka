"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const today = new Date().toISOString().slice(0, 10);

const EMPTY_ASSIGNMENT = {
  targetId: "",
  data_od: today,
  data_do: "",
  uwagi: "",
};

export default function BudowaDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [header, setHeader] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [brygady, setBrygady] = useState([]);
  const [maszyny, setMaszyny] = useState([]);

  const [assignedBrygady, setAssignedBrygady] = useState([]);
  const [assignedMaszyny, setAssignedMaszyny] = useState([]);

  const [panelOpen, setPanelOpen] = useState({
    brygady: false,
    maszyny: false,
  });
  const [editIds, setEditIds] = useState({
    brygady: null,
    maszyny: null,
  });
  const [forms, setForms] = useState({
    brygady: EMPTY_ASSIGNMENT,
    maszyny: EMPTY_ASSIGNMENT,
  });
  const [saving, setSaving] = useState({
    brygady: false,
    maszyny: false,
  });
  const [sectionErrors, setSectionErrors] = useState({
    brygady: "",
    maszyny: "",
  });

  const validId = Number.isInteger(Number(id)) && Number(id) > 0;

  const availableBrygady = useMemo(() => brygady, [brygady]);
  const availableMaszyny = useMemo(() => maszyny, [maszyny]);

  const loadAssignments = async () => {
    if (!validId) return;

    const [brygadyRes, maszynyRes] = await Promise.all([
      fetch(`/api/budowy/${id}/brygady`, { cache: "no-store" }),
      fetch(`/api/budowy/${id}/maszyny`, { cache: "no-store" }),
    ]);

    const [brygadyData, maszynyData] = await Promise.all([
      brygadyRes.json().catch(() => ({})),
      maszynyRes.json().catch(() => ({})),
    ]);

    if (!brygadyRes.ok || !maszynyRes.ok) {
      setError(
        brygadyData?.error ||
          maszynyData?.error ||
          "Błąd pobierania przypisań"
      );
      return;
    }

    setAssignedBrygady(Array.isArray(brygadyData) ? brygadyData : []);
    setAssignedMaszyny(Array.isArray(maszynyData) ? maszynyData : []);
  };

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError("Nieprawidłowe ID budowy.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      const responses = await Promise.all([
        fetch(`/api/budowy/${id}`, { cache: "no-store" }),
        fetch("/api/brygady", { cache: "no-store" }),
        fetch("/api/maszyny", { cache: "no-store" }),
        fetch(`/api/budowy/${id}/brygady`, { cache: "no-store" }),
        fetch(`/api/budowy/${id}/maszyny`, { cache: "no-store" }),
      ]);

      const payloads = await Promise.all(
        responses.map((response) => response.json().catch(() => ({})))
      );

      if (cancelled) return;

      const [
        budowaData,
        brygadyData,
        maszynyData,
        assignedBrygadyData,
        assignedMaszynyData,
      ] = payloads;

      const [budowaRes, brygadyRes, maszynyRes, abRes, amRes] = responses;

      if (!budowaRes.ok || !brygadyRes.ok || !maszynyRes.ok || !abRes.ok || !amRes.ok) {
        setError(
          budowaData?.error ||
            brygadyData?.error ||
            maszynyData?.error ||
            assignedBrygadyData?.error ||
            assignedMaszynyData?.error ||
            "Błąd pobierania danych budowy"
        );
        setLoading(false);
        return;
      }

      setHeader(budowaData);
      setBrygady(Array.isArray(brygadyData) ? brygadyData : []);
      setMaszyny(Array.isArray(maszynyData) ? maszynyData : []);
      setAssignedBrygady(Array.isArray(assignedBrygadyData) ? assignedBrygadyData : []);
      setAssignedMaszyny(Array.isArray(assignedMaszynyData) ? assignedMaszynyData : []);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  const setFormFor = (section, next) => {
    setForms((current) => ({ ...current, [section]: next }));
  };

  const resetSection = (section) => {
    setForms((current) => ({ ...current, [section]: EMPTY_ASSIGNMENT }));
    setEditIds((current) => ({ ...current, [section]: null }));
    setPanelOpen((current) => ({ ...current, [section]: false }));
    setSectionErrors((current) => ({ ...current, [section]: "" }));
  };

  const openForEdit = (section, item, targetIdField) => {
    setEditIds((current) => ({ ...current, [section]: item.id }));
    setPanelOpen((current) => ({ ...current, [section]: true }));
    setSectionErrors((current) => ({ ...current, [section]: "" }));
    setForms((current) => ({
      ...current,
      [section]: {
        targetId: String(item[targetIdField] ?? ""),
        data_od: item.data_od ? String(item.data_od).slice(0, 10) : today,
        data_do: item.data_do ? String(item.data_do).slice(0, 10) : "",
        uwagi: item.uwagi ?? "",
      },
    }));
  };

  const submitAssignment = async (section, targetField) => {
    const form = forms[section];
    const editId = editIds[section];

    if (!form.targetId) {
      setSectionErrors((current) => ({
        ...current,
        [section]: "Najpierw wybierz element do przypisania.",
      }));
      return;
    }

    setSaving((current) => ({ ...current, [section]: true }));
    setSectionErrors((current) => ({ ...current, [section]: "" }));

    try {
      const url = editId
        ? `/api/budowy/${id}/${section}/${editId}`
        : `/api/budowy/${id}/${section}`;
      const method = editId ? "PUT" : "POST";

      const payload = {
        [targetField]: Number(form.targetId),
        data_od: form.data_od || null,
        data_do: form.data_do || null,
        uwagi: form.uwagi.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd zapisu przypisania");

      resetSection(section);
      await loadAssignments();
    } catch (err) {
      setSectionErrors((current) => ({
        ...current,
        [section]: err.message || "Błąd zapisu przypisania",
      }));
    } finally {
      setSaving((current) => ({ ...current, [section]: false }));
    }
  };

  const deleteAssignment = async (section, assignmentId) => {
    if (!confirm("Usunąć przypisanie?")) return;

    const res = await fetch(`/api/budowy/${id}/${section}/${assignmentId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSectionErrors((current) => ({
        ...current,
        [section]: data?.error || "Błąd usuwania przypisania",
      }));
      return;
    }

    if (editIds[section] === assignmentId) {
      resetSection(section);
    }

    await loadAssignments();
  };

  const toggleSection = (section) => {
    if (editIds[section]) {
      setPanelOpen((current) => ({ ...current, [section]: true }));
      return;
    }

    if (panelOpen[section]) {
      resetSection(section);
      return;
    }

    setPanelOpen((current) => ({ ...current, [section]: true }));
    setSectionErrors((current) => ({ ...current, [section]: "" }));
  };

  const renderAssignmentSection = ({
    section,
    title,
    description,
    targetField,
    targetLabel,
    options,
    rows,
    renderOptionLabel,
    renderRowCells,
    columns,
  }) => {
    const form = forms[section];
    const editId = editIds[section];
    const isOpen = panelOpen[section];
    const sectionError = sectionErrors[section];
    const isSaving = saving[section];

    return (
      <section className="stackSection">
        <div className={`formPanel ${isOpen ? "formPanelOpen" : ""}`}>
          <div className="formPanelHeader">
            <div>
              <h2>{editId ? `Edytuj: ${title}` : `Przypisz: ${title}`}</h2>
              <p>{description}</p>
            </div>

            <button type="button" onClick={() => toggleSection(section)}>
              <span className={`formPanelToggle ${isOpen ? "formPanelToggleOpen" : ""}`}>
                <span className="formPanelToggleIcon" aria-hidden="true">
                  {editId ? "•" : "+"}
                </span>
                <span>
                  {isOpen
                    ? editId
                      ? "Tryb edycji"
                      : "Ukryj formularz"
                    : `Przypisz ${title.toLowerCase()}`}
                </span>
              </span>
            </button>
          </div>

          <div className={`formPanelBody ${isOpen ? "formPanelBodyOpen" : ""}`}>
            <form
              className="card"
              onSubmit={(e) => {
                e.preventDefault();
                submitAssignment(section, targetField);
              }}
            >
              <div className="grid">
                <label>
                  <span>{targetLabel}</span>
                  <select
                    value={form.targetId}
                    onChange={(e) =>
                      setFormFor(section, { ...form, targetId: e.target.value })
                    }
                    required
                    disabled={options.length === 0}
                  >
                    <option value="">
                      {options.length === 0
                        ? "Brak dostępnych elementów"
                        : `Wybierz ${targetLabel.toLowerCase()}`}
                    </option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {renderOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Data od</span>
                  <input
                    type="date"
                    value={form.data_od}
                    onChange={(e) =>
                      setFormFor(section, { ...form, data_od: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span>Data do</span>
                  <input
                    type="date"
                    value={form.data_do}
                    onChange={(e) =>
                      setFormFor(section, { ...form, data_do: e.target.value })
                    }
                  />
                </label>

                <label style={{ gridColumn: "1 / -1" }}>
                  <span>Uwagi</span>
                  <textarea
                    rows={3}
                    value={form.uwagi}
                    onChange={(e) =>
                      setFormFor(section, { ...form, uwagi: e.target.value })
                    }
                    placeholder="Krótka informacja o zakresie lub terminie..."
                  />
                </label>
              </div>

              <div className="actions">
                <button type="submit" disabled={isSaving || options.length === 0}>
                  {isSaving ? "Zapisywanie..." : editId ? "Zapisz" : "Przypisz"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => resetSection(section)}
                >
                  Anuluj
                </button>
              </div>

              {sectionError && <p className="error">{sectionError}</p>}
            </form>
          </div>
        </div>

        <div className="tableWrap">
          {rows.length === 0 ? (
            <p>Brak przypisań</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {renderRowCells(row)}
                    <td className="actionsCell" data-label="Akcje">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => openForEdit(section, row, targetField)}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteAssignment(section, row.id)}
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
    );
  };

  if (loading) {
    return <p>Ładowanie...</p>;
  }

  if (!header) {
    return (
      <div>
        <button
          type="button"
          className="secondary"
          onClick={() => router.push("/pages/budowy")}
        >
          Wróć do listy
        </button>
        <p className="error">{error || "Nie znaleziono budowy."}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="secondary"
        onClick={() => router.push("/pages/budowy")}
      >
        Wróć do listy
      </button>

      <h1>Szczegóły budowy</h1>

      <div className="card detailsSummary" style={{ marginBottom: 16 }}>
        <div className="detailsSummaryContent">
          <div className="detailsSummaryLine">
            <b>Numer:</b> <span>{header.numer}</span>
            <b>Nazwa:</b> <span>{header.nazwa}</span>
          </div>
          <div className="detailsSummaryLine">
            <b>Lokalizacja:</b> <span>{header.lokalizacja}</span>
            <b>Status:</b> <span>{header.status || "-"}</span>
          </div>
          <div className="detailsSummaryLine">
            <b>Inwestor:</b> <span>{header.inwestor || "-"}</span>
            <b>Kierownik:</b> <span>{header.kierownik || "-"}</span>
          </div>
          <div className="detailsSummaryLine">
            <b>Start:</b>{" "}
            <span>
              {header.data_rozpoczecia
                ? String(header.data_rozpoczecia).slice(0, 10)
                : "-"}
            </span>
            <b>Koniec:</b>{" "}
            <span>
              {header.data_zakonczenia
                ? String(header.data_zakonczenia).slice(0, 10)
                : "-"}
            </span>
          </div>
          {header.uwagi ? (
            <div className="detailsSummaryLine">
              <b>Uwagi:</b> <span>{header.uwagi}</span>
            </div>
          ) : null}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {renderAssignmentSection({
        section: "brygady",
        title: "Brygadę",
        description: "Przypisz brygadę do tej budowy i określ zakres dat.",
        targetField: "brygada_id",
        targetLabel: "Brygada",
        options: availableBrygady,
        rows: assignedBrygady,
        renderOptionLabel: (option) =>
          `${option.numer} - ${option.brygadzista || "bez brygadzisty"}`,
        columns: ["Brygada", "Brygadzista", "Data od", "Data do", "Uwagi"],
        renderRowCells: (row) => (
          <>
            <td data-label="Brygada">{row.brygada_numer}</td>
            <td data-label="Brygadzista">{row.brygadzista || "-"}</td>
            <td data-label="Data od">
              {row.data_od ? String(row.data_od).slice(0, 10) : "-"}
            </td>
            <td data-label="Data do">
              {row.data_do ? String(row.data_do).slice(0, 10) : "-"}
            </td>
            <td data-label="Uwagi">{row.uwagi || "-"}</td>
          </>
        ),
      })}

      {renderAssignmentSection({
        section: "maszyny",
        title: "Maszynę",
        description:
          "Przypisz maszynę do budowy. System pilnuje nakładających się terminów.",
        targetField: "maszyna_id",
        targetLabel: "Maszyna",
        options: availableMaszyny,
        rows: assignedMaszyny,
        renderOptionLabel: (option) =>
          `${option.nr || "-"} - ${option.rodzaj} ${option.marka} ${option.model}`,
        columns: ["Numer", "Rodzaj", "Marka/Model", "Data od", "Data do", "Uwagi"],
        renderRowCells: (row) => (
          <>
            <td data-label="Numer">{row.nr || "-"}</td>
            <td data-label="Rodzaj">{row.rodzaj || "-"}</td>
            <td data-label="Marka/Model">
              {`${row.marka || "-"} ${row.model || ""}`.trim()}
            </td>
            <td data-label="Data od">
              {row.data_od ? String(row.data_od).slice(0, 10) : "-"}
            </td>
            <td data-label="Data do">
              {row.data_do ? String(row.data_do).slice(0, 10) : "-"}
            </td>
            <td data-label="Uwagi">{row.uwagi || "-"}</td>
          </>
        ),
      })}
    </div>
  );
}
