// /js/dashboard.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { t, initI18n, setupLangSwitcher } from "/js/i18n.js";

// ✅ Init config + Supabase
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Init i18n
await initI18n();
setupLangSwitcher();

// ✅ Vérifier session utilisateur
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (!user || userError) {
  window.location.href = "/login/";
}

// ==========================
// 📥 Charger la collection
// ==========================
let medalsCache = [];
let viewMode = "grid"; // "grid" ou "list"

async function loadMedals() {
  const { data, error } = await supabase.from("medals").select("*").eq("user_id", user.id);
  const container = document.getElementById("medalList");
  container.innerHTML = "";

  if (error) {
    container.innerHTML = `<p class='text-red-500'>${error.message}</p>`;
    return;
  }

  medalsCache = data || [];

  if (medalsCache.length === 0) {
    container.innerHTML = `<p class='text-gray-400'>${t("dashboard.noMedals")}</p>`;
    return;
  }

  renderMedals(medalsCache);
}

// ==========================
// 🎨 Rendu grille/liste
// ==========================
function renderMedals(medals) {
  const container = document.getElementById("medalList");
  container.className = viewMode === "grid"
    ? "grid grid-cols-1 md:grid-cols-3 gap-4"
    : "flex flex-col space-y-2";

  container.innerHTML = "";

  medals.forEach(medal => {
    const card = document.createElement("div");
    card.className = viewMode === "grid"
      ? "bg-gray-800 p-4 rounded shadow relative group text-center"
      : "bg-gray-800 p-4 rounded shadow flex justify-between items-center";

    card.innerHTML = viewMode === "grid"
      ? `
        <h3 class="font-bold">${medal.name || t("dashboard.noName")}</h3>
        <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
        <img src="${medal.image || ""}" alt="medal" class="w-24 h-24 object-cover mx-auto my-2 rounded"/>
        <div class="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center gap-2">
          <button class="editBtn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded" data-id="${medal.id}">✏️</button>
          <button class="deleteBtn bg-red-600 hover:bg-red-700 px-2 py-1 rounded" data-id="${medal.id}">🗑️</button>
        </div>
      `
      : `
        <div>
          <h3 class="font-bold">${medal.name || t("dashboard.noName")}</h3>
          <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
        </div>
        <div class="flex gap-2">
          <button class="detailsBtn bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded" data-id="${medal.id}">👁️</button>
          <button class="editBtn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded" data-id="${medal.id}">✏️</button>
          <button class="deleteBtn bg-red-600 hover:bg-red-700 px-2 py-1 rounded" data-id="${medal.id}">🗑️</button>
        </div>
      `;

    // click → détails (uniquement en mode grille pour éviter conflit avec boutons)
    if (viewMode === "grid") {
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("editBtn") && !e.target.classList.contains("deleteBtn")) {
          openDetailsModal(medal);
        }
      });
    }

    container.appendChild(card);
  });

  setupButtons();
}

// ==========================
// 📝 Add/Edit
// ==========================
const medalForm = document.getElementById("medalForm");

medalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = medalForm.dataset.id;
  const fields = ["name", "country", "period", "maker", "type", "state", "description", "image"];
  const medal = Object.fromEntries(fields.map(f => [f, document.getElementById("medal_" + f).value.trim()]));
  medal.user_id = user.id;

  const query = id
    ? supabase.from("medals").update(medal).eq("id", id)
    : supabase.from("medals").insert([medal]);

  const { error } = await query;
  if (error) return alert("❌ " + error.message);

  closeMedalModal();
  loadMedals();
});

function openAddModal() {
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModalTitle").innerText = t("add.title");
  document.getElementById("medalModal").classList.remove("hidden");
}

function openEditModal(medal) {
  medalForm.dataset.id = medal.id;
  ["name", "country", "period", "maker", "type", "state", "description", "image"].forEach(f => {
    document.getElementById("medal_" + f).value = medal[f] || "";
  });
  document.getElementById("medalModalTitle").innerText = t("edit.title");
  document.getElementById("medalModal").classList.remove("hidden");
}

function closeMedalModal() {
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModal").classList.add("hidden");
}
document.getElementById("openAddModal")?.addEventListener("click", openAddModal);
document.getElementById("cancelModal")?.addEventListener("click", closeMedalModal);
document.getElementById("closeModal")?.addEventListener("click", closeMedalModal);

// ==========================
// 👁️ Détails
// ==========================
function openDetailsModal(medal) {
  document.getElementById("detailsName").innerText = medal.name || "-";
  document.getElementById("detailsImage").src = medal.image || "";
  document.getElementById("detailsCountry").innerText = medal.country || "-";
  document.getElementById("detailsPeriod").innerText = medal.period || "-";
  document.getElementById("detailsMaker").innerText = medal.maker || "-";
  document.getElementById("detailsType").innerText = medal.type || "-";
  document.getElementById("detailsState").innerText = medal.state || "-";
  document.getElementById("detailsDescription").innerText = medal.description || "-";

  document.getElementById("detailsModal").classList.remove("hidden");
}
document.getElementById("closeDetailsModal")?.addEventListener("click", () => {
  document.getElementById("detailsModal").classList.add("hidden");
});

// ==========================
// ❌ Suppression
// ==========================
let deleteTargetId = null;

function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}
function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}
document.getElementById("cancelDelete")?.addEventListener("click", closeDeleteModal);
document.getElementById("confirmDelete")?.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  await supabase.from("medals").delete().eq("id", deleteTargetId).eq("user_id", user.id);
  closeDeleteModal();
  loadMedals();
});

// ==========================
// 🔘 Setup boutons
// ==========================
function setupButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const { data } = await supabase.from("medals").select("*").eq("id", btn.dataset.id).single();
      if (data) openEditModal(data);
    });
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteModal(btn.dataset.id);
    });
  });

  document.querySelectorAll(".detailsBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { data } = await supabase.from("medals").select("*").eq("id", btn.dataset.id).single();
      if (data) openDetailsModal(data);
    });
  });
}

// ==========================
// 🔄 Vue grille/liste
// ==========================
document.getElementById("toggleView")?.addEventListener("click", () => {
  viewMode = viewMode === "grid" ? "list" : "grid";
  renderMedals(medalsCache);
});

// ==========================
// 🚪 Déconnexion
// ==========================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// ==========================
// 👤 Profil (placeholder)
// ==========================
document.getElementById("openProfileModal")?.addEventListener("click", () => {
  document.getElementById("profileModal").classList.remove("hidden");
});
document.getElementById("closeProfileModal")?.addEventListener("click", () => {
  document.getElementById("profileModal").classList.add("hidden");
});

// ==========================
// 🚀 Init
// ==========================
loadMedals();
