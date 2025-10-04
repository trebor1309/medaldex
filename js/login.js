// js/login.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "./config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Vérifie si déjà connecté → redirige vers dashboard
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  window.location.href = "/dashboard/";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("⚠️ Merci de remplir tous les champs.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("❌ " + error.message);
      return;
    }

    alert("✅ Connecté !");
    window.location.href = "/dashboard/";
  });
});
