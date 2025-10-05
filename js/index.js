import { supabase } from "/js/config.js";
import { initI18n, setupLangSwitcher } from "/js/i18n.js";

console.log("✅ index.js chargé !");

// Initialisation i18n
initI18n();
setupLangSwitcher();

// --- Navbar dynamic session handling ---
const loginBtn = document.getElementById("openLogin");
const signupBtn = document.getElementById("openSignup");
const dashboardLink = document.getElementById("goDashboard");
const logoutBtn = document.getElementById("logoutBtn");

// --- Hero CTA ---
const loginHero = document.getElementById("openLoginHero");
const signupHero = document.getElementById("openSignupHero");

// --- Cookie banner ---
const cookieBanner = document.getElementById("cookieBanner");
const acceptBtn = document.getElementById("acceptCookies");

// --- Modals ---
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const closeLogin = document.getElementById("closeLogin");
const closeSignup = document.getElementById("closeSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Helpers pour ouvrir/fermer les modals
function openModal(modal) {
  modal.classList.remove("hidden");
}
function closeModal(modal) {
  modal.classList.add("hidden");
}

// --- Session ---
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginBtn.classList.add("hidden");
    signupBtn.classList.add("hidden");
    loginHero.classList.add("hidden");
    signupHero.classList.add("hidden");
    dashboardLink.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    signupBtn.classList.remove("hidden");
    loginHero.classList.remove("hidden");
    signupHero.classList.remove("hidden");
    dashboardLink.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
}
checkSession();

// --- Logout ---
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});

// --- Cookie consent ---
if (localStorage.getItem("cookiesAccepted")) {
  cookieBanner.style.display = "none";
}
acceptBtn?.addEventListener("click", () => {
  localStorage.setItem("cookiesAccepted", "true");
  cookieBanner.style.display = "none";
});

// --- Ouvrir les modals ---
loginBtn?.addEventListener("click", () => openModal(loginModal));
signupBtn?.addEventListener("click", () => openModal(signupModal));
loginHero?.addEventListener("click", () => openModal(loginModal));
signupHero?.addEventListener("click", () => openModal(signupModal));

// --- Fermer les modals ---
closeLogin?.addEventListener("click", () => closeModal(loginModal));
closeSignup?.addEventListener("click", () => closeModal(signupModal));

// --- Login form ---
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

// --- Signup form ---
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
