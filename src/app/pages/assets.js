import React, { useState, useEffect } from "react";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ nazwa: "", typ: "", status: "" });

  useEffect(() => {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const newAsset = await res.json();
    setAssets([newAsset, ...assets]);
    setForm({ nazwa: "", typ: "", status: "" });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Zasoby</h1>
      <form onSubmit={handleSubmit} className="my-4 space-x-2">
        <input type="text" placeholder="Nazwa" required value={form.nazwa}
               onChange={(e) => setForm({ ...form, nazwa: e.target.value })} />
        <input type="text" placeholder="Typ" required value={form.typ}
               onChange={(e) => setForm({ ...form, typ: e.target.value })} />
        <input type="text" placeholder="Status" required value={form.status}
               onChange={(e) => setForm({ ...form, status: e.target.value })} />
        <button type="submit">Dodaj</button>
      </form>
      <ul>
        {assets.map((a) => (
          <li key={a.id}>{a.nazwa} ({a.typ}) – {a.status}</li>
        ))}
      </ul>
    </div>
  );
}