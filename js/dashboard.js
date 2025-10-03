// /js/dashboard.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Vérifier si utilisateur connecté
const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = "/login/";

// ✅ Elements DOM
const logoutBtn = document.getElementById("logoutBtn");
const collection = document.getElementById("collection");
const addBtn = document.getElementById("addBtn");
const addModal = document.getElementById("addModal");
const closeAdd = document.getElementById("closeAdd");
const addForm = document.getElementById("addForm");
const editModal = document.getElementById("editModal");
const closeEdit = document.getElementById("closeEdit");
const editForm = document.getElementById("editForm");
const profileModal = document.getElementById("profileModal");
const closeProfile = document.getElementById("closeProfile");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

// ✅ Ouvrir/Fermer modales
addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
closeAdd.addEventListener("click", () => addModal.classList.add("hidden"));
closeEdit.addEventListener("click", () => editModal.classList.add("hidden"));
closeProfile.addEventListener("click", () => profileModal.classList.add("hidden"));

// ✅ Déconnexion
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// ✅ Charger collection
async function loadCollection() {
  const { data, error } = await supabase
    .from("medals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement collection:", error.message);
    return;
  }

  collection.innerHTML = "";
  if (!data || data.length === 0) {
    collection.innerHTML = `<p class="text-gray-400 col-span-full text-center">Aucune entrée pour l'instant.</p>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "bg-gray-900 border border-gray-700 rounded-lg p-4 shadow flex flex-col";

    card.innerHTML = `
      <img src="${item.image || "https://via.placeholder.com/150"}" alt="${item.name}" class="rounded mb-3 h-32 object-cover"/>
      <h3 class="text-lg font-bold">${item.name}</h3>
      <p class="text-sm text-gray-400">${item.country || ""} ${item.period ? "(" + item.period + ")" : ""}</p>
      <div class="flex justify-between mt-3">
        <button class="editBtn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" data-id="${item.id}">✏️</button>
        <button class="deleteBtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" data-id="${item.id}">🗑️</button>
      </div>
    `;

    collection.appendChild(card);
  });

  // Boutons Edit/Delete
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", () => openEdit(btn.dataset.id));
  });
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => deleteMedal(btn.dataset.id));
  });
}

// ✅ Ajouter médaille
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    user_id: user.id,
    name: document.getElementById("name").value,
    country: document.getElementById("country").value,
    period: document.getElementById("period").value,
    maker: document.getElementById("maker").value,
    type: document.getElementById("type").value,
    state: document.getElementById("state").value,
    description: document.getElementById("description").value,
    image: document.getElementById("image").value,
  };

  const { error } = await supabase.from("medals").insert([formData]);

  if (error) {
    alert("❌ Erreur ajout: " + error.message);
    return;
  }

  alert("✅ Médaille ajoutée !");
  addForm.reset();
  addModal.classList.add("hidden");
  loadCollection();
});

// ✅ Ouvrir Edit
async function openEdit(id) {
  const { data, error } = await supabase
    .from("medals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    alert("❌ Erreur chargement: " + error.message);
    return;
  }

  document.getElementById("editName").value = data.name || "";
  document.getElementById("editCountry").value = data.country || "";
  document.getElementById("editPeriod").value = data.period || "";
  document.getElementById("editMaker").value = data.maker || "";
  document.getElementById("editType").value = data.type || "military";
  document.getElementById("editState").value = data.state || "good";
  document.getElementById("editDescription").value = data.description || "";
  document.getElementById("editImage").value = data.image || "";

  editForm.dataset.id = id;
  editModal.classList.remove("hidden");
}

// ✅ Sauvegarder Edit
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = editForm.dataset.id;
  const updatedData = {
    name: document.getElementById("editName").value,
    country: document.getElementById("editCountry").value,
    period: document.getElementById("editPeriod").value,
    maker: document.getElementById("editMaker").value,
    type: document.getElementById("editType").value,
    state: document.getElementById("editState").value,
    description: document.getElementById("editDescription").value,
    image: document.getElementById("editImage").value,
  };

  const { error } = await supabase.from("medals").update(updatedData).eq("id", id).eq("user_id", user.id);

  if (error) {
    alert("❌ Erreur édition: " + error.message);
    return;
  }

  alert("✅ Médaille mise à jour !");
  editModal.classList.add("hidden");
  loadCollection();
});

// ✅ Supprimer médaille
async function deleteMedal(id) {
  if (!confirm("⚠️ Supprimer cette médaille ?")) return;

  const { error } = await supabase.from("medals").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    alert("❌ Erreur suppression: " + error.message);
    return;
  }

  alert("✅ Médaille supprimée !");
  loadCollection();
}

// ✅ Supprimer compte
deleteAccountBtn.addEventListener("click", async () => {
  if (!confirm("⚠️ Supprimer votre compte et toutes vos données ?")) return;

  await supabase.from("medals").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.admin.deleteUser(user.id);

  alert("✅ Compte supprimé.");
  window.location.href = "/";
});

// ✅ Charger collection au démarrage
loadCollection();
