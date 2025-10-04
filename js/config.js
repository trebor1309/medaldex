// js/config.js
export async function loadConfig() {
  const res = await fetch("/vercel-api/config");
  if (!res.ok) throw new Error("Impossible de charger la config Supabase");
  return res.json();
}
