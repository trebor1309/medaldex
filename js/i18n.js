let translations = {};
let currentLang = "en";

function t(key) {
  return translations[key] || key;
}

async function initI18n() {
  currentLang = localStorage.getItem("lang") || "en";
  await loadTranslations(currentLang);
  applyTranslations();
}

function setupLangSwitcher() {
  const switcher = document.getElementById("langSwitcher");
  if (!switcher) return;

  switcher.value = currentLang;
  switcher.addEventListener("change", async () => {
    const lang = switcher.value;
    localStorage.setItem("lang", lang);
    await loadTranslations(lang);
    applyTranslations();
  });
}

async function loadTranslations(lang) {
  try {
    const response = await fetch(`/lang/${lang}.json`);
    translations = await response.json();
  } catch (err) {
    console.error("❌ Erreur chargement i18n:", err);
    translations = {};
  }
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) el.innerHTML = translations[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key]) el.setAttribute("placeholder", translations[key]);
  });
}

export { t, initI18n, setupLangSwitcher };
