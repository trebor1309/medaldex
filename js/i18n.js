// /js/i18n.js
export async function initI18n() {
  const lang = localStorage.getItem("lang") || "en";
  await loadTranslations(lang);
  setupLanguageSwitcher();
}

async function loadTranslations(lang) {
  try {
    const response = await fetch(`/lang/${lang}.json`);
    const translations = await response.json();

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

  switcher.addEventListener("change", async () => {
    const newLang = switcher.value;
    localStorage.setItem("lang", newLang);
    await loadTranslations(newLang);
  });
}
