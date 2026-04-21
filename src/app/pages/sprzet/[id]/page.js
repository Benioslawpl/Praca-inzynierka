"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SprzetDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [brygady, setBrygady] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      const [itemRes, brygadyRes] = await Promise.all([
        fetch(`/api/sprzet/${id}`, { cache: "no-store" }),
        fetch("/api/brygady", { cache: "no-store" }),
      ]);

      const itemData = await itemRes.json().catch(() => ({}));
      const brygadyData = await brygadyRes.json().catch(() => ({}));

      if (cancelled) return;

      if (!itemRes.ok) {
        setItem(null);
        setError(itemData?.error || "Nie udało się pobrać sprzętu.");
      } else {
        setItem(itemData);
      }

      if (brygadyRes.ok) {
        setBrygady(Array.isArray(brygadyData) ? brygadyData : []);
      } else {
        setBrygady([]);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const linkedBrygada = useMemo(() => {
    if (!item?.brygadzista) return null;

    return (
      brygady.find(
        (row) => row?.brygadzista?.trim() === item.brygadzista?.trim()
      ) || null
    );
  }, [brygady, item]);

  return (
    <div>
      <button
        type="button"
        className="secondary"
        onClick={() => router.push("/pages/sprzet")}
      >
        Wróć do listy
      </button>

      <h1>Szczegóły sprzętu</h1>

      {loading ? (
        <p>Ładowanie...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : !item ? (
        <p>Nie znaleziono sprzętu.</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <b>Nr:</b> {item.nr || "-"} &nbsp;|&nbsp; <b>Rodzaj:</b>{" "}
            {item.rodzaj || "-"}
            &nbsp;|&nbsp; <b>Marka/Model:</b> {item.marka || "-"}{" "}
            {item.model || ""}
            &nbsp;|&nbsp; <b>Brygadzista:</b> {item.brygadzista || "-"}
          </div>

          <h2>Przypisanie sprzętu</h2>

          <div className="card">
            <div className="compactList">
              <div className="compactListRow">
                <div className="compactListMain">
                  <span className="rowEyebrow">Brygadzista</span>
                  <strong>{item.brygadzista || "-"}</strong>
                  <span className="mutedText">
                    {linkedBrygada
                      ? `Przypisany do brygady ${linkedBrygada.numer}`
                      : "Brak dopasowanej brygady w bazie"}
                  </span>
                </div>
              </div>

              <div className="compactListRow">
                <div className="compactListMain">
                  <span className="rowEyebrow">Typ sprzętu</span>
                  <strong>{item.rodzaj || "-"}</strong>
                  <span className="mutedText">
                    {item.marka || "-"} {item.model || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
