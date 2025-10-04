// js/profile.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "./js/config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // Vérif utilisateur
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "/login/";
    return;
  }

  // Charger profil
  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Erreur chargement profil:", error.message);
      return;
    }

    document.getElementById("username").value = data.username || "";
    document.getElementById("email").textContent = user.email;
  }

  // Sauvegarde pseudo
  document.getElementById("saveUsername").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();

    if (!username) {
      alert("⚠️ Merci de remplir un pseudo.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (error) {
      alert("❌ Erreur mise à jour: " + error.message);
      return;
    }

    alert("✅ Pseudo mis à jour !");
  });

  // Supprimer compte
  document.getElementById("deleteAccount").addEventListener("click", async () => {
    if (!confirm("⚠️ Voulez-vous vraiment supprimer votre compte ?")) return;

    // Supprimer toutes les médailles
    await supabase.from("medals").delete().eq("user_id", user.id);
    // Supprimer profil
    await supabase.from("profiles").delete().eq("id", user.id);
    // Déconnexion
    await supabase.auth.signOut();

    alert("✅ Compte supprimé !");
    window.location.href = "/";
  });

  // Déconnexion
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  });

  loadProfile();
});
