let translations = {};
let currentLang = "en"; // langue par défaut

// ✅ Fonction pour traduire une clé
export function t(key) {
  return key.split(".").reduce((o, i) => (o ? o[i] : null), translations) || key;
}

// ✅ Charger un fichier JSON de langue
async function loadLang(lang) {
  try {
    const res = await fetch(`/lang/${lang}.json`);
    if (!res.ok) throw new Error("Lang file not found");
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyTranslations();
  } catch (e) {
    console.error("❌ Erreur chargement langue:", e.message);
  }
}

// ✅ Appliquer les traductions à la page
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    el.title = t(key);
  });
}

// ✅ Initialiser i18n
export async function initI18n() {
  const saved = localStorage.getItem("lang");
  const lang = saved || navigator.language.split("-")[0] || "en";
  await loadLang(lang);
}

// ✅ Gérer le sélecteur de langue
export function setupLangSwitcher() {
  const switcher = document.getElementById("langSwitcher");
  if (!switcher) return;

  switcher.value = currentLang;

  switcher.addEventListener("change", async (e) => {
    await loadLang(e.target.value);
  });
}
