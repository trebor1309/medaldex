import fs from "fs";
import path from "path";

// Dossiers à scanner
const LANG_DIR = "./lang";
const ROOT_DIR = "./";

// Charger les fichiers JSON de langues
const languages = ["fr", "en", "de"];
const translations = {};
for (const lang of languages) {
  const file = path.join(LANG_DIR, `${lang}.json`);
  translations[lang] = JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Fonction récursive pour récupérer tous les fichiers HTML
function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith(".html")) {
      results.push(fullPath);
    }
  });
  return results;
}

// Extraire toutes les clés data-i18n
const htmlFiles = getAllHtmlFiles(ROOT_DIR);
const allKeys = new Set();

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const matches = content.match(/data-i18n(?:-placeholder)?="([^"]+)"/g) || [];
  matches.forEach((m) => {
    const key = m.split("=")[1].replace(/"/g, "");
    allKeys.add(key);
  });
});

// Vérification des clés
let missing = {};
languages.forEach((lang) => {
  missing[lang] = [];
  allKeys.forEach((key) => {
    if (!(key in translations[lang])) {
      missing[lang].push(key);
    }
  });
});

// Rapport
console.log("🔍 Vérification des traductions :");
languages.forEach((lang) => {
  if (missing[lang].length === 0) {
    console.log(`✅ ${lang}.json est complet`);
  } else {
    console.log(`⚠️ ${lang}.json manque ${missing[lang].length} clé(s) :`);
    console.log(missing[lang].join(", "));
  }
});
