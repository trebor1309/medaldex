// /js/dashboard.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { t, initI18n, setupLangSwitcher } from "/js/i18n.js";

// Init config + Supabase
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Init i18n
await initI18n();
setupLangSwitcher();

// Vérifier session utilisateur
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (!user || userError) {
  window.location.href = "/login/";
}

// Charger la collection
async function loadMedals() {
  const { data, error } = await supabase.from("medals").select("*").eq("user_id", user.id);
  const container = document.getElementById("medalList");
  container.innerHTML = "";

  if (error) {
    container.innerHTML = `<p class='text-red-500'>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p class='text-gray-400'>${t("dashboard.noMedals")}</p>`;
    return;
  }

  data.forEach((medal) => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 p-4 rounded shadow text-center relative group";
    card.innerHTML = `
      <h3 class='font-bold text-lg'>${medal.name || t("dashboard.noName")}</h3>
      <p class='text-sm text-gray-400'>${medal.country || ""} - ${medal.period || ""}</p>
      <img src='${medal.image || ""}' alt='medal' class='w-24 h-24 object-cover mx-auto my-2 rounded'/>
      <div class='absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center gap-2'>
        <button class='editBtn px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded' data-id='${medal.id}'>✏️</button>
        <button class='deleteBtn px-3 py-1 bg-red-600 hover:bg-red-700 rounded' data-id='${medal.id}'>🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });

  setupEditButtons();
  setupDeleteButtons();
}

// Ajouter ou éditer une médaille
const form = document.getElementById("medalForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = form.dataset.id;
  const fields = ["name", "country", "period", "maker", "type", "state", "description", "image"];
  const medal = Object.fromEntries(fields.map(f => [f, document.getElementById("medal_" + f).value.trim()]));
  medal.user_id = user.id;

  const query = id ? supabase.from("medals").update(medal).eq("id", id) : supabase.from("medals").insert([medal]);
  const { error } = await query;

  if (error) return alert("❌ " + error.message);

  closeMedalModal();
  loadMedals();
});

function setupDeleteButtons() {
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(t("confirm.delete"))) return;
      const { error } = await supabase.from("medals").delete().eq("id", btn.dataset.id);
      if (!error) loadMedals();
    });
  });
}

function setupEditButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { data } = await supabase.from("medals").select("*").eq("id", btn.dataset.id).single();
      if (!data) return;

      form.dataset.id = data.id;
      ["name", "country", "period", "maker", "type", "state", "description", "image"].forEach(f => {
        document.getElementById("medal_" + f).value = data[f] || "";
      });
      document.getElementById("medalModalTitle").innerText = t("edit.title");
      openMedalModal();
    });
  });
}

// Gestion modale
const modal = document.getElementById("medalModal");
const openBtn = document.getElementById("openAddModal");
const closeBtn = document.getElementById("closeModal");
function openMedalModal() {
  modal.classList.remove("hidden");
}
function closeMedalModal() {
  form.reset();
  delete form.dataset.id;
  document.getElementById("medalModalTitle").innerText = t("add.title");
  modal.classList.add("hidden");
}
openBtn?.addEventListener("click", openMedalModal);
closeBtn?.addEventListener("click", closeMedalModal);

// Déconnexion
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// Profile modale (optionnel)
document.getElementById("openProfileModal")?.addEventListener("click", () => {
  document.getElementById("profileModal").classList.remove("hidden");
});
document.getElementById("closeProfileModal")?.addEventListener("click", () => {
  document.getElementById("profileModal").classList.add("hidden");
});

// Init
loadMedals();
