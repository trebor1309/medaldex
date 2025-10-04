let currentLang = "en"; // langue par défaut

async function loadLanguage(lang = "en") {
  try {
    const response = await fetch(`/lang/${lang}.json`);
    const translations = await response.json();
    currentLang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const keys = el.getAttribute("data-i18n").split(".");
      let text = keys.reduce((acc, k) => acc[k], translations);

      if (el.dataset.i18nVars) {
        const vars = JSON.parse(el.dataset.i18nVars);
        for (let key in vars) {
          text = text.replace(`{${key}}`, vars[key]);
        }
      }

      if (el.placeholder !== undefined && el.hasAttribute("data-i18n-placeholder")) {
        el.placeholder = text;
      } else {
        el.innerText = text;
      }
    });
  } catch (e) {
    console.error("Erreur chargement traduction:", e);
  }
}

// Détection langue navigateur
function detectLanguage() {
  const userLang = navigator.language.slice(0, 2);
  return ["fr", "en"].includes(userLang) ? userLang : "en";
}

// Switcher
function setupLangSwitcher() {
  const switcher = document.getElementById("langSwitcher");
  if (!switcher) return;
  switcher.value = currentLang;
  switcher.addEventListener("change", (e) => {
    loadLanguage(e.target.value);
  });
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  const lang = detectLanguage();
  loadLanguage(lang).then(setupLangSwitcher);
});
