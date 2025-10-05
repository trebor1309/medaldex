/**
 * Vérification et synchronisation automatique des traductions i18n
 * ---------------------------------------------------------------
 * Usage :
 *   node check-i18n.js          → vérifie seulement
 *   node check-i18n.js --fix    → corrige les clés manquantes
 */

import fs from "fs";
import path from "path";

const langDir = "./lang";
const files = ["fr.json", "en.json", "de.json"];
const autoFix = process.argv.includes("--fix");

function loadJson(file) {
  const fullPath = path.join(langDir, file);
  const content = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(content);
}

function saveJson(file, data) {
  const fullPath = path.join(langDir, file);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function flatten(obj, prefix = "") {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? `${prefix}.` : "";
    if (typeof obj[k] === "object" && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

function unflatten(data) {
  const result = {};
  for (const key in data) {
    key.split(".").reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) acc[part] = data[key];
      else acc[part] = acc[part] || {};
      return acc[part];
    }, result);
  }
  return result;
}

console.log("🔍 Vérification des traductions i18n...\n");

const base = loadJson("fr.json");
const flatBase = flatten(base);

let ok = true;

for (const f of files) {
  const data = loadJson(f);
  const flat = flatten(data);

  const missing = Object.keys(flatBase).filter((k) => !(k in flat));
  const extra = Object.keys(flat).filter((k) => !(k in flatBase));

  if (missing.length || extra.length) {
    console.log(`⚠️  ${f} :`);
    if (missing.length) {
      console.log(`   ❌ Clés manquantes (${missing.length}):`, missing.join(", "));

      if (autoFix && f !== "fr.json") {
        console.log(`   🛠️  Ajout des clés manquantes depuis fr.json...`);
        for (const key of missing) {
          flat[key] = `(TODO) ${flatBase[key]}`;
        }
        const updated = unflatten(flat);
        saveJson(f, updated);
        console.log(`   ✅ ${f} mis à jour.`);
      }
    }
    if (extra.length) console.log(`   ⚠️ Clés supplémentaires (${extra.length}):`, extra.join(", "));
    ok = false;
  } else {
    console.log(`✅ ${f} : OK (${Object.keys(flat).length} clés)`);
  }
}

if (ok) {
  console.log("\n🎉 Toutes les traductions sont synchronisées !");
} else if (autoFix) {
  console.log("\n✅ Synchronisation terminée : les fichiers manquants ont été mis à jour avec des valeurs '(TODO)'.");
  console.log("💡 Pense à traduire ces entrées avant le prochain déploiement !");
} else {
  console.log("\n🚨 Certaines différences existent — exécute : node check-i18n.js --fix pour corriger automatiquement.");
}
