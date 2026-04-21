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
    <div className="stackSection">
      <button
        type="button"
        className="secondary"
        onClick={() => router.push("/pages/sprzet")}
      >
        Wróć do listy
      </button>

      <div className="sectionIntro">
        <h1>Szczegóły sprzętu</h1>
        <p>
          Podgląd podstawowych informacji o wybranym sprzęcie i przypisaniu do
          brygadzisty.
        </p>
      </div>

      {loading ? (
        <p>Ładowanie...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : !item ? (
        <p>Nie znaleziono sprzętu.</p>
      ) : (
        <>
          <article className="card sectionCard">
            <div className="sectionCardHeader">
              <div>
                <h2>
                  {item.nr || "Bez numeru"} · {item.rodzaj}
                </h2>
                <p className="mutedText">
                  {item.marka} {item.model}
                </p>
              </div>
            </div>

            <div className="statsGrid">
              <div className="statCard">
                <span className="statLabel">Numer sprzętu</span>
                <strong className="statValue statValueSm">
                  {item.nr || "-"}
                </strong>
              </div>

              <div className="statCard">
                <span className="statLabel">Rodzaj</span>
                <strong className="statValue statValueSm">
                  {item.rodzaj || "-"}
                </strong>
              </div>

              <div className="statCard">
                <span className="statLabel">Marka i model</span>
                <strong className="statValue statValueSm">
                  {item.marka} {item.model}
                </strong>
              </div>

              <div className="statCard">
                <span className="statLabel">Brygadzista</span>
                <strong className="statValue statValueSm">
                  {item.brygadzista || "-"}
                </strong>
              </div>
            </div>
          </article>

          <article className="card sectionCard">
            <div className="sectionCardHeader">
              <div>
                <h2>Przypisanie</h2>
                <p className="mutedText">
                  Informacja, do której brygady jest najpewniej przypisany ten
                  sprzęt.
                </p>
              </div>
            </div>

            <div className="compactList">
              <div className="compactListRow">
                <div className="compactListMain">
                  <span className="rowEyebrow">Brygadzista</span>
                  <strong>{item.brygadzista || "-"}</strong>
                  <span className="mutedText">
                    {linkedBrygada
                      ? `Brygada ${linkedBrygada.numer}`
                      : "Brak dopasowanej brygady w bazie"}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
