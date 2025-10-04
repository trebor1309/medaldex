export async function loadConfig() {
  try {
    const res = await fetch("/api/config"); // appelle l’API Vercel
    if (!res.ok) {
      throw new Error("Impossible de charger la config Supabase");
    }

    const data = await res.json();
    console.log("✅ Config chargée :", data); // 🔍 Vérifie dans la console navigateur

    return data;
  } catch (err) {
    console.error("❌ Erreur loadConfig:", err);
    throw err;
  }
}
