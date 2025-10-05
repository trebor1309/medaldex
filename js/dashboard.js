// /js/dashboard.js — version enrichie (filtres dynamiques + upload image + patchs)
console.log("✅ dashboard.js chargé !");
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { t, initI18n, setupLangSwitcher } from "/js/i18n.js";
import { getDefaultFilters, loadUserCustomFilters } from "/js/filters.js";

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
  const defaults = getDefaultFilters(); 
  const customs = await loadUserCustomFilters(supabase, user.id);

  const countries = Object.keys(defaults.countries).concat(customs.country);
  const periods = Object.values(defaults.countries).flat().concat(customs.period);
  const types = defaults.types.concat(customs.type);

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
// 🪶 Modals Add / Edit + Filtres dynamiques
// ==========================

// ✅ Remplit les <select> du modal avec les valeurs disponibles
async function populateModalFilters() {
  // Récupération des filtres combinés
  const defaults = getDefaultFilters();
  const customs = await loadUserCustomFilters(supabase, user.id);

  // Fusionne les valeurs (évite les doublons)
  const allCountries = [...new Set([...Object.keys(defaults.countries), ...customs.country])];
  const allTypes = [...new Set([...defaults.types, ...customs.type])];
  const allStates = [...new Set(defaults.states)];

  // On cible les <select> dans le modal
  const selCountry = document.getElementById("medal_country");
  const selPeriod = document.getElementById("medal_period");
  const selType = document.getElementById("medal_type");
  const selState = document.getElementById("medal_state");

  // Réinitialise
  selCountry.innerHTML = `<option value="">${t("filters.country") || "🌍 Pays"}</option>`;
  selPeriod.innerHTML = `<option value="">${t("filters.period") || "📅 Période"}</option>`;
  selType.innerHTML = `<option value="">${t("filters.type") || "🎖️ Type"}</option>`;
  selState.innerHTML = `<option value="">${t("filters.state") || "💎 État"}</option>`;

  // Remplit les options
  allCountries.forEach(c => {
    selCountry.innerHTML += `<option value="${c}">${c}</option>`;
  });

  // Si un pays est choisi → on ajuste les périodes
  selCountry.addEventListener("change", (e) => {
    const selected = e.target.value;
    const periods = defaults.countries[selected] || [];
    selPeriod.innerHTML = `<option value="">${t("filters.period") || "📅 Période"}</option>`;
    periods.forEach(p => {
      selPeriod.innerHTML += `<option value="${p}">${p}</option>`;
    });
  });

  allTypes.forEach(t_ => {
    selType.innerHTML += `<option value="${t_}">${t_}</option>`;
  });

  allStates.forEach(s => {
    selState.innerHTML += `<option value="${s}">${s}</option>`;
  });
}

// ✅ Ouvre le modal d’ajout
async function openAddModal() {
  await populateModalFilters();
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModalTitle").innerText = t("add.title") || "➕ Ajouter une entrée";
  document.getElementById("medalModal").classList.remove("hidden");

  const preview = document.getElementById("medal_image_preview");
  preview.classList.add("hidden");
  preview.src = "";
}

// ✅ Ouvre le modal d’édition
async function openEditModal(medal) {
  await populateModalFilters();

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
// ==========================
// ✍️ Gestion des champs "Manuel" (pays / période / type)
// ==========================
const manualConfig = [
  { button: "manualCountryBtn", input: "manual_country_input", select: "medal_country", storage: "manual_countries" },
  { button: "manualPeriodBtn", input: "manual_period_input", select: "medal_period", storage: "manual_periods" },
  { button: "manualTypeBtn", input: "manual_type_input", select: "medal_type", storage: "manual_types" },
];

manualConfig.forEach(({ button, input, select, storage }) => {
  const btn = document.getElementById(button);
  const inp = document.getElementById(input);
  const sel = document.getElementById(select);

  if (!btn || !inp || !sel) return;

  // 🔘 Afficher / cacher le champ manuel
  btn.addEventListener("click", () => {
    inp.classList.toggle("hidden");
    inp.focus();
  });

  // 💾 Quand l’utilisateur valide (Enter)
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 🧠 Empêche la soumission du formulaire
      e.stopPropagation();
      const newVal = inp.value.trim();
      if (!newVal) return;

      const existing = JSON.parse(localStorage.getItem(storage) || "[]");
      if (!existing.includes(newVal)) {
        existing.push(newVal);
        localStorage.setItem(storage, JSON.stringify(existing));
    }

    // Ajouter dans le select et sélectionner
      const opt = document.createElement("option");
      opt.value = newVal;
      opt.textContent = newVal;
      sel.appendChild(opt);
      sel.value = newVal;

      inp.value = "";
      inp.classList.add("hidden");
  }
});


  // ✅ Recharger les valeurs manuelles sauvegardées
  const saved = JSON.parse(localStorage.getItem(storage) || "[]");
  saved.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
});

// ✅ Ferme le modal
function closeMedalModal() {
  medalForm.reset();
  delete medalForm.dataset.id;
  document.getElementById("medalModal").classList.add("hidden");

  const preview = document.getElementById("medal_image_preview");
  preview.classList.add("hidden");
  preview.src = "";
}

// ✅ Boutons d’action
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
