// /js/index.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from "/js/config.js";
import { initI18n, setupLangSwitcher } from "/js/i18n.js";

console.log("✅ index.js chargé !");

// ===========================
// ⚙️  Initialisation globale
// ===========================
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Initialisation i18n ---
await initI18n();
setupLangSwitcher();

// ===========================
// 🧭 Gestion de la session
// ===========================
async function checkSession() {
  const { data } = await supabase.auth.getSession();

  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");
  const dashboardLink = document.getElementById("goDashboard");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginHero = document.getElementById("openLoginHero");
  const signupHero = document.getElementById("openSignupHero");

  if (data.session) {
    loginBtn?.classList.add("hidden");
    signupBtn?.classList.add("hidden");
    loginHero?.classList.add("hidden");
    signupHero?.classList.add("hidden");
    dashboardLink?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {
    loginBtn?.classList.remove("hidden");
    signupBtn?.classList.remove("hidden");
    loginHero?.classList.remove("hidden");
    signupHero?.classList.remove("hidden");
    dashboardLink?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
  }
}
await checkSession();

// ===========================
// 🚪 Déconnexion
// ===========================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// ===========================
// 🍪 Cookie consent
// ===========================
const cookieBanner = document.getElementById("cookieBanner");
const acceptBtn = document.getElementById("acceptCookies");

if (localStorage.getItem("cookiesAccepted")) {
  cookieBanner.style.display = "none";
}

acceptBtn?.addEventListener("click", () => {
  localStorage.setItem("cookiesAccepted", "true");
  cookieBanner.style.display = "none";
});

// ===========================
// 🪟 Gestion des modals
// ===========================
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const closeLogin = document.getElementById("closeLogin");
const closeSignup = document.getElementById("closeSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function openModal(modal) {
  modal.classList.remove("hidden");
}
function closeModal(modal) {
  modal.classList.add("hidden");
}

// --- Ouvrir ---
document.getElementById("openLogin")?.addEventListener("click", () => openModal(loginModal));
document.getElementById("openSignup")?.addEventListener("click", () => openModal(signupModal));
document.getElementById("openLoginHero")?.addEventListener("click", () => openModal(loginModal));
document.getElementById("openSignupHero")?.addEventListener("click", () => openModal(signupModal));

// --- Fermer ---
closeLogin?.addEventListener("click", () => closeModal(loginModal));
closeSignup?.addEventListener("click", () => closeModal(signupModal));

// ===========================
// 🔐 Authentification
// ===========================

// --- Connexion ---
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return alert("⚠️ Merci de remplir tous les champs.");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("❌ " + error.message);

  closeModal(loginModal);
  window.location.href = "/dashboard/";
});

// --- Inscription ---
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  if (!username || !email || !password) return alert("⚠️ Merci de remplir tous les champs.");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("❌ " + error.message);

  if (data.user) {
    const { error: pErr } = await supabase.from("profiles").insert([{ id: data.user.id, username }]);
    if (pErr) console.warn("⚠️ Profile:", pErr.message);
  }

  alert("✅ Compte créé ! Vérifie ton e-mail si nécessaire.");
  closeModal(signupModal);
  window.location.href = "/dashboard/";
});
