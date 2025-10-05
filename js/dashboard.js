// /js/dashboard.js — version enrichie (filtres dynamiques + upload image + patchs)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { t, initI18n, setupLangSwitcher } from "/js/i18n.js";
import { defaultFilters, loadUserCustomFilters } from "/js/filters.js";

// ==========================
// ⚙️ Initialisation
// ==========================
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

await initI18n();
setupLangSwitcher();

const { data: { user }, error: userError } = await supabase.auth.getUser();
if (!user || userError) {
  window.location.href = "/";
}

// ==========================
// 🧩 Variables
// ==========================
let medalsCache = [];
let viewMode = "grid";
let filters = {};
let searchQuery = "";

// ==========================
// 🧭 Chargement des filtres
// ==========================
async function initFilters() {
  const defaults = defaultFilters;
  const customs = await loadUserCustomFilters(supabase, user.id);

  const countries = [...defaults.countries, ...customs.country];
  const periods = [...defaults.periods, ...customs.period];
  const types = [...defaults.types, ...customs.type];

  fillSelect("filterCountry", countries);
  fillSelect("filterPeriod", periods);
  fillSelect("filterType", types);
}

function fillSelect(id, options) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML += options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
}

// ==========================
// 📥 Chargement des médailles
// ==========================
async function loadMedals() {
  const { data, error } = await supabase.from("medals").select("*").eq("user_id", user.id);
  const container = document.getElementById("medalList");
  container.innerHTML = "";

  if (error) {
    container.innerHTML = `<p class='text-red-500'>${error.message}</p>`;
    return;
  }

  medalsCache = data || [];
  applyFilters();
}

// ==========================
// 🔍 Application des filtres
// ==========================
function applyFilters() {
  let filtered = [...medalsCache];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m =>
      (m.name || "").toLowerCase().includes(q) ||
      (m.country || "").toLowerCase().includes(q) ||
      (m.period || "").toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q)
    );
  }

  if (filters.country) filtered = filtered.filter(m => m.country === filters.country);
  if (filters.period) filtered = filtered.filter(m => m.period === filters.period);
  if (filters.type) filtered = filtered.filter(m => m.type === filters.type);
  if (filters.state) filtered = filtered.filter(m => m.state === filters.state);

  renderMedals(filtered);
}

// ==========================
// 🎨 Rendu (Grille / Liste)
// ==========================
function renderMedals(medals) {
  const container = document.getElementById("medalList");
  container.className = viewMode === "grid"
    ? "grid grid-cols-1 md:grid-cols-3 gap-4"
    : "flex flex-col space-y-2";
  container.innerHTML = "";

  if (medals.length === 0) {
    container.innerHTML = `<p class='text-gray-400 text-center mt-10'>${t("dashboard.noMedals")}</p>`;
    return;
  }

  medals.forEach(medal => {
    const card = document.createElement("div");
    card.className = viewMode === "grid"
      ? "bg-gray-800 p-4 rounded shadow relative group text-center"
      : "bg-gray-800 p-4 rounded shadow flex justify-between items-center";

    const imgUrl = medal.image
      ? supabase.storage.from("medal-images").getPublicUrl(medal.image).data.publicUrl
      : "";

    card.innerHTML = viewMode === "grid"
      ? `
        <h3 class="font-bold">${medal.name || t("dashboard.noName")}</h3>
        <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
        ${imgUrl ? `<img src="${imgUrl}" alt="medal" class="w-24 h-24 object-cover mx-auto my-2 rounded"/>` : ""}
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
// 🔄 Vue Grille / Liste
// ==========================
document.getElementById("toggleView")?.addEventListener("click", () => {
  viewMode = viewMode === "grid" ? "list" : "grid";
  applyFilters();
});

// ==========================
// 📝 Add/Edit + Upload
// ==========================
const medalForm = document.getElementById("medalForm");
const fileInput = document.getElementById("medal_image_file");
const preview = document.getElementById("medal_image_preview");

fileInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    preview.classList.add("hidden");
    preview.src = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    preview.src = evt.target.result;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// 🔧 Redimensionne l’image (max 1080 px)
function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const maxSize = 1080;
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
    };

    reader.readAsDataURL(file);
  });
}

// ✳️ Soumission du formulaire
medalForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = medalForm.dataset.id;
  const fields = ["name", "country", "period", "maker", "type", "state", "description"];
  const medal = Object.fromEntries(fields.map(f => [f, document.getElementById("medal_" + f).value.trim()]));
  medal.user_id = user.id;

  // 🖼️ Upload image si présente
  if (fileInput.files.length > 0) {
    const resizedBlob = await resizeImage(fileInput.files[0]);
    const filePath = `user_${user.id}/${Date.now()}_${fileInput.files[0].name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medal-images")
      .upload(filePath, resizedBlob);

    if (uploadError) console.error(uploadError);
    else medal.image = uploadData.path;
  }

  const query = id
    ? supabase.from("medals").update(medal).eq("id", id)
    : supabase.from("medals").insert([medal]);

  const { error } = await query;
  if (error) return alert("❌ " + error.message);

  closeMedalModal();
  loadMedals();
});

// ==========================
// 🪶 Modals Add / Edit
// ==========================
function openAddModal() {
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModalTitle").innerText = t("add.title") || "➕ Ajouter une entrée";
  document.getElementById("medalModal").classList.remove("hidden");

  const preview = document.getElementById("medal_image_preview");
  preview.classList.add("hidden");
  preview.src = "";
}

function openEditModal(medal) {
  medalForm.dataset.id = medal.id;
  ["name", "country", "period", "maker", "type", "state", "description"].forEach(f => {
    document.getElementById("medal_" + f).value = medal[f] || "";
  });

  const fileInput = document.getElementById("medal_image_file");
  const urlInput = document.getElementById("medal_image");
  const preview = document.getElementById("medal_image_preview");

  fileInput.value = "";
  urlInput.value = medal.image || "";

  if (medal.image) {
    const imgUrl = medal.image.startsWith("http")
      ? medal.image
      : supabase.storage.from("medal-images").getPublicUrl(medal.image).data.publicUrl;

    preview.src = imgUrl;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }

  document.getElementById("medalModalTitle").innerText = t("edit.title") || "✏️ Modifier une entrée";
  document.getElementById("medalModal").classList.remove("hidden");
}

function closeMedalModal() {
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModal").classList.add("hidden");

  const preview = document.getElementById("medal_image_preview");
  preview.classList.add("hidden");
  preview.src = "";
}

document.getElementById("openAddModal")?.addEventListener("click", openAddModal);
document.getElementById("cancelModal")?.addEventListener("click", closeMedalModal);
document.getElementById("closeModal")?.addEventListener("click", closeMedalModal);

// ==========================
// 👁️ Détails + Suppression
// ==========================
function openDetailsModal(medal) {
  document.getElementById("detailsName").innerText = medal.name || "-";
  document.getElementById("detailsImage").src = medal.image
    ? (medal.image.startsWith("http")
        ? medal.image
        : supabase.storage.from("medal-images").getPublicUrl(medal.image).data.publicUrl)
    : "";
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
// 🔘 Setup des boutons
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
// 🔍 Filtres + Recherche
// ==========================
["filterCountry", "filterPeriod", "filterType", "filterState"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", (e) => {
    filters[id.replace("filter", "").toLowerCase()] = e.target.value;
    applyFilters();
  });
});

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  applyFilters();
});

// ==========================
// 🚪 Logout
// ==========================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// ==========================
// 👤 Profil + Modals
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
await initFilters();
await loadMedals();
