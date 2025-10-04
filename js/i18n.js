// /js/i18n.js
async function loadTranslations(lang = "en") {
  try {
    const response = await fetch(`/lang/${lang}.json`);
    const translations = await response.json();

    // Appliquer les traductions à tous les éléments HTML
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[key]) el.innerHTML = translations[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[key]) el.setAttribute("placeholder", translations[key]);
    });
  } catch (error) {
    console.error("❌ Erreur chargement traduction:", error);
  }
}

function setupLanguageSwitcher() {
  const switcher = document.getElementById("langSwitcher");
  if (!switcher) return;

  const savedLang = localStorage.getItem("lang") || "en";
  switcher.value = savedLang;
  loadTranslations(savedLang);

  switcher.addEventListener("change", () => {
    const lang = switcher.value;
    localStorage.setItem("lang", lang);
    loadTranslations(lang);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSwitcher();
});
