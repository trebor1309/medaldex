import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { t, initI18n, setupLangSwitcher } from "/js/i18n.js";

// ✅ Init config + Supabase
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Init i18n
await initI18n();
setupLangSwitcher();

// ✅ Vérifier l’utilisateur connecté
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError) console.error("❌ Erreur récupération user:", userError);

if (!user) {
  console.warn("⚠️ Aucun utilisateur connecté → redirection vers login");
  window.location.href = "/login/";
}

// ✅ Fonction pour afficher les médailles
async function loadMedals() {
  const { data, error } = await supabase
    .from("medals")
    .select("*")
    .eq("user_id", user.id);

  const container = document.getElementById("medalList");
  container.innerHTML = "";

  if (error) {
    console.error("❌ Erreur chargement médailles:", error.message);
    container.innerHTML = `<p class="text-red-500">Erreur: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="text-gray-400">${t("dashboard.noMedals")}</p>`;
    return;
  }

  data.forEach(medal => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded p-4 shadow relative";

    card.innerHTML = `
      <h3 class="font-bold text-lg">${medal.name || t("dashboard.noName")}</h3>
      <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
      <img src="${medal.image || ""}" alt="medal" class="w-24 h-24 object-cover my-2"/>
      <div class="flex space-x-2 mt-2">
        <button data-id="${medal.id}" class="editBtn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">${t("buttons.edit")}</button>
        <button data-id="${medal.id}" class="deleteBtn bg-red-600 hover:bg-red-700 px-2 py-1 rounded">${t("buttons.delete")}</button>
      </div>
    `;

    container.appendChild(card);
  });

  setupEditButtons();
  setupDeleteButtons();
}

// ✅ Ajouter une médaille
document.getElementById("addForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMedal = {
    user_id: user.id,
    name: document.getElementById("add_name").value,
    country: document.getElementById("add_country").value,
    period: document.getElementById("add_period").value,
    maker: document.getElementById("add_maker").value,
    type: document.getElementById("add_type").value,
    state: document.getElementById("add_state").value,
    description: document.getElementById("add_description").value,
    image: document.getElementById("add_image").value,
  };

  const { error } = await supabase.from("medals").insert([newMedal]);
  if (error) {
    alert("❌ " + error.message);
    return;
  }

  alert("✅ " + t("add.title") + " !");
  document.getElementById("addModal").classList.add("hidden");
  loadMedals();
});

// ✅ Supprimer
function setupDeleteButtons() {
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      const { error } = await supabase
        .from("medals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        alert("❌ " + error.message);
        return;
      }

      loadMedals();
    });
  });
}

// ✅ Éditer
function setupEditButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      window.location.href = `/edit/${id}`; // TODO: remplacer par modal
    });
  });
}

// ✅ Déconnexion
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// Charger les médailles au démarrage
loadMedals();
