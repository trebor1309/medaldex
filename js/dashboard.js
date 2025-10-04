// js/dashboard.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "./config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // Vérif utilisateur
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "/login/";
    return;
  }

  const medalsList = document.getElementById("medalsList");
  const addModal = document.getElementById("addModal");
  const editModal = document.getElementById("editModal");
  const addForm = document.getElementById("addForm");
  const editForm = document.getElementById("editForm");

  let editingId = null;

  // ✅ Charger les médailles
  async function loadMedals() {
    medalsList.innerHTML = "";
    const { data, error } = await supabase
      .from("medals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement:", error.message);
      return;
    }

    if (!data.length) {
      medalsList.innerHTML = `<p class="text-gray-400">Aucune entrée pour le moment.</p>`;
      return;
    }

    data.forEach(medal => {
      const div = document.createElement("div");
      div.className = "bg-gray-800 p-4 rounded shadow flex justify-between items-center";

      div.innerHTML = `
        <div>
          <h3 class="font-bold">${medal.name}</h3>
          <p class="text-sm text-gray-400">${medal.country || ""} - ${medal.period || ""}</p>
        </div>
        <div class="flex space-x-2">
          <button class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm" data-id="${medal.id}" data-action="edit">✏️</button>
          <button class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm" data-id="${medal.id}" data-action="delete">🗑️</button>
        </div>
      `;

      medalsList.appendChild(div);
    });
  }

  // ✅ Ajouter médaille
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newMedal = {
      user_id: user.id,
      name: document.getElementById("addName").value,
      country: document.getElementById("addCountry").value,
      period: document.getElementById("addPeriod").value,
      maker: document.getElementById("addMaker").value,
      type: document.getElementById("addType").value,
      state: document.getElementById("addState").value,
      description: document.getElementById("addDescription").value,
      image: document.getElementById("addImage").value,
    };

    const { error } = await supabase.from("medals").insert([newMedal]);
    if (error) {
      alert("❌ Erreur ajout: " + error.message);
      return;
    }

    addModal.classList.add("hidden");
    addForm.reset();
    loadMedals();
  });

  // ✅ Edit médaille
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedMedal = {
      name: document.getElementById("editName").value,
      country: document.getElementById("editCountry").value,
      period: document.getElementById("editPeriod").value,
      maker: document.getElementById("editMaker").value,
      type: document.getElementById("editType").value,
      state: document.getElementById("editState").value,
      description: document.getElementById("editDescription").value,
      image: document.getElementById("editImage").value,
    };

    const { error } = await supabase
      .from("medals")
      .update(updatedMedal)
      .eq("id", editingId)
      .eq("user_id", user.id);

    if (error) {
      alert("❌ Erreur édition: " + error.message);
      return;
    }

    editModal.classList.add("hidden");
    loadMedals();
  });

  // ✅ Actions boutons edit/delete
  medalsList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "edit") {
      editingId = id;
      const { data } = await supabase.from("medals").select("*").eq("id", id).single();
      if (data) {
        document.getElementById("editName").value = data.name || "";
        document.getElementById("editCountry").value = data.country || "";
        document.getElementById("editPeriod").value = data.period || "";
        document.getElementById("editMaker").value = data.maker || "";
        document.getElementById("editType").value = data.type || "";
        document.getElementById("editState").value = data.state || "";
        document.getElementById("editDescription").value = data.description || "";
        document.getElementById("editImage").value = data.image || "";
        editModal.classList.remove("hidden");
      }
    }

    if (action === "delete") {
      if (!confirm("⚠️ Supprimer cette entrée ?")) return;
      await supabase.from("medals").delete().eq("id", id).eq("user_id", user.id);
      loadMedals();
    }
  });

  // ✅ Déconnexion
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  });

  loadMedals();
});
