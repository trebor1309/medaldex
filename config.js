export async function loadConfig() {
  try {
    const res = await fetch("/vercel-api/config");
    if (!res.ok) throw new Error("Fetch config failed");
    return await res.json();
  } catch (e) {
    console.warn("⚠️ Impossible de charger la config dynamique, fallback en dur:", e);
    return {
      SUPABASE_URL: "https://xwdvnjodqvwqvorbnxln.supabase.co",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    };
  }
}
