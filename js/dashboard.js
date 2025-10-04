import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("🔑 Supabase init:", SUPABASE_URL);

// ✅ Vérifier l’utilisateur connecté
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError) console.error("❌ Erreur récupération user:", userError);
console.log("👤 Utilisateur:", user);

if (!user) {
  console.warn("⚠️ Aucun utilisateur connecté → redirection vers login");
  window.location.href = "/login/";
}

// ✅ Fonction pour afficher les médailles
async function loadMedals() {
  console.log("📥 Chargement des médailles...");
  const { data, error } = await supabase
    .from("medals")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("❌ Erreur chargement médailles:", error.message);
    return;
  }

  console.log("✅ Médailles récupérées:", data);
  const container = document.getElementById("medalList");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="text-gray-400">Aucune médaille enregistrée.</p>`;
    return;
  }

  data.forEach(medal => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded p-4 shadow relative";

    card.innerHTML = `
      <h3 class="font-bold text-lg">${medal.name || "(Sans nom)"}</h3>
      <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
      <img src="${medal.image || ""}" alt="medal" class="w-24 h-24 object-cover my-2"/>
      <div class="flex space-x-2 mt-2">
        <button data-id="${medal.id}" class="editBtn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">✏️ Edit</button>
        <button data-id="${medal.id}" class="deleteBtn bg-red-600 hover:bg-red-700 px-2 py-1 rounded">🗑️ Delete</button>
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
  console.log("➕ Tentative d'ajout...");

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
    console.error("❌ Erreur ajout médaille:", error.message);
    alert("Erreur: " + error.message);
    return;
  }

  console.log("✅ Médaille ajoutée:", newMedal);
  alert("✅ Médaille ajoutée !");
  document.getElementById("addModal").classList.add("hidden");
  loadMedals();
});

// ✅ Supprimer
function setupDeleteButtons() {
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      console.log("🗑️ Suppression médaille:", id);

      const { error } = await supabase.from("medals").delete().eq("id", id).eq("user_id", user.id);
      if (error) {
        console.error("❌ Erreur suppression:", error.message);
        return;
      }

      console.log("✅ Médaille supprimée:", id);
      loadMedals();
    });
  });
}

// ✅ Éditer
function setupEditButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      console.log("✏️ Édition médaille:", id);
      window.location.href = `/edit/${id}`; // pour le moment redirection simple
    });
  });
}

// ✅ Déconnexion
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  console.log("🚪 Déconnexion...");
  await supabase.auth.signOut();
  window.location.href = "/";
});

// Charger les médailles au démarrage
loadMedals();
