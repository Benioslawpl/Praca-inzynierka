const SUPABASE_URL = "https://lgwotpxxrhtrvqjozsxh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd290cHh4cmh0cnZxam96c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk3NTgsImV4cCI6MjA3MzAxNTc1OH0.IkfpBLwMp7S9QyV9VEdBVKcagJUq3ZFq_K5mVXu9e7w";
const API_URL = `${SUPABASE_URL}/rest/v1/items`;

// Nagłówki wymagane przez Supabase
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation" // żeby POST i PATCH zwracały dane
};

// Pobierz wszystkie przedmioty
export const fetchItems = async () => {
  const response = await fetch(API_URL, { headers });
  if (!response.ok) throw new Error("Failed to fetch items");
  return response.json();
};

// Dodaj nowy przedmiot
export const addItem = async (item) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(item)
  });
  if (!response.ok) throw new Error("Failed to add item");
  return response.json();
};

// Usuń przedmiot po id
export const deleteItem = async (id) => {
  const response = await fetch(`${API_URL}?id=eq.${id}`, {
    method: "DELETE",
    headers
  });
  if (!response.ok) throw new Error(`Failed to delete item with id: ${id}`);
  return response.json();
};

// Zaktualizuj przedmiot po id
export const updateItem = async (id, updatedItem) => {
  const response = await fetch(`${API_URL}?id=eq.${id}`, {
    method: "PATCH", // Supabase używa PATCH do częściowej aktualizacji
    headers,
    body: JSON.stringify(updatedItem)
  });
  if (!response.ok) throw new Error(`Failed to update item with id: ${id}`);
  return response.json();
};