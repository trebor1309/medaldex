const LANG_FILES = {
  fr: "/lang/fr.json",
  en: "/lang/en.json"
};

let currentLang = localStorage.getItem("lang") || detectLanguage();

function detectLanguage() {
  const userLang = navigator.language.slice(0, 2);
  return ["fr", "en"].includes(userLang) ? userLang : "fr";
}

async function loadLanguage(lang = "fr") {
  try {
    const response = await fetch(LANG_FILES[lang]);
    const translations = await response.json();
    currentLang = lang;

    // Textes normaux
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const keys = el.getAttribute("data-i18n").split(".");
      let text = keys.reduce((acc, k) => acc?.[k], translations);

      // Variables dynamiques
      if (el.dataset.i18nVars) {
        const vars = JSON.parse(el.dataset.i18nVars);
        for (let key in vars) {
          text = text.replace(`{${key}}`, vars[key]);
        }
      }
      if (text) el.innerText = text;
    });

    // Placeholders (input, textarea)
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const keys = el.getAttribute("data-i18n-placeholder").split(".");
      let text = keys.reduce((acc, k) => acc?.[k], translations);
      if (text) el.placeholder = text;
    });

    // Sauvegarde
    localStorage.setItem("lang", lang);

    // Sync switchers
    document.querySelectorAll("#langSwitcher").forEach(sel => sel.value = lang);

  } catch (e) {
    console.error("Erreur chargement traduction:", e);
  }
}

function setupLangSwitcher() {
  document.addEventListener("change", e => {
    if (e.target.id === "langSwitcher") {
      loadLanguage(e.target.value);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(currentLang).then(setupLangSwitcher);
});
