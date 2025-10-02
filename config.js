export async function loadConfig() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Fetch config failed");
    return await res.json();
  } catch (e) {
    console.warn("⚠️ Impossible de charger la config dynamique, fallback utilisé:", e);
    return {
      SUPABASE_URL: "https://xwdvnjodqvwqvorbnxln.supabase.co",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZHZuam9kcXZ3cXZvcmJueGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDkzMzAsImV4cCI6MjA3NDkyNTMzMH0.219yAB1IUJTRbTAR3gt8h9ufkI50-TJqKej-iW9KOmM"
    };
  }
}
