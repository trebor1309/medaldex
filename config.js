export async function loadConfig() {

  if (window.__SUPA_CFG) return window.__SUPA_CFG;

  try {
    const res = await fetch("/vercel-api/config", { cache: "no-store" });
    if (!res.ok) throw new Error("Config API not available");

    const cfg = await res.json();

    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      console.warn("⚠️ Config API returned empty values, using fallback");
      window.__SUPA_CFG = {
        SUPABASE_URL: "https://xwdvnjodqvwqvorbnxln.supabase.co",
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZHZuam9kcXZ3cXZvcmJueGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDkzMzAsImV4cCI6MjA3NDkyNTMzMH0.219yAB1IUJTRbTAR3gt8h9ufkI50-TJqKej-iW9KOmM"
      };
    } else {
      window.__SUPA_CFG = cfg;
    }

    return window.__SUPA_CFG;

  } catch (e) {
    console.error("Erreur chargement config:", e);

    return {
      SUPABASE_URL: "https://xwdvnjodqvwqvorbnxln.supabase.co",
      SUPABASE_ANON_KEY: "TA_CLE_ANON_ICI"
    };
  }
}
