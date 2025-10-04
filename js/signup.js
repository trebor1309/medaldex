// js/signup.js
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

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
      alert("⚠️ Merci de remplir tous les champs.");
      return;
    }

    // Étape 1 : création compte
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert("❌ " + error.message);
      return;
    }

    // Étape 2 : création profil lié
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{ id: data.user.id, username }]);

      if (profileError) {
        console.error("⚠️ Erreur profil:", profileError.message);
      }
    }

    alert("✅ Compte créé !");
    window.location.href = "/dashboard/";
  });
});
