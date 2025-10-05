// /js/filters.js
/**
 * Données par défaut : pays, périodes, types, états
 */
export function getDefaultFilters() {
  return {
    countries: {
      France: ["1870–1871", "1914–1918", "1939–1945", "1946–1962", "Après 1962"],
      Allemagne: ["1870–1918", "1919–1933", "1933–1945", "1945–1990", "Après 1990"],
      "Royaume-Uni": ["1914–1918", "1939–1945", "1945–1991", "Après 1991"],
      "États-Unis": ["1861–1865", "1914–1918", "1939–1945", "1950–1975", "Après 1990"],
      Russie: ["Avant 1917", "1917–1945", "1945–1991", "Après 1991"],
      Italie: ["1861–1918", "1919–1945", "Après 1945"],
      Japon: ["Empire (avant 1945)", "Après 1945"],
      Belgique: ["1914–1918", "1940–1945", "Après 1945"],
      Canada: ["1914–1918", "1939–1945", "Après 1945"],
    },
    types: ["Militaire", "Civil", "Police", "Pompiers", "Politique", "Religieux", "Associatif"],
    states: ["Neuf", "Excellent", "Bon", "Moyen", "Usé"],
  };
}

/**
 * Charge les filtres personnalisés de l'utilisateur depuis Supabase
 * @param {object} supabase - instance Supabase (créée dans dashboard.js)
 * @param {string} userId - identifiant de l'utilisateur
 */
export async function loadUserCustomFilters(supabase, userId) {
  const { data, error } = await supabase
    .from("user_custom_values")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.warn("⚠️ Erreur chargement filtres perso :", error.message);
    return { country: [], period: [], type: [] };
  }

  const filters = { country: [], period: [], type: [] };

  data.forEach((entry) => {
    if (entry.type === "country") {
      filters.country.push(entry.value);
    } else if (entry.type === "period") {
      filters.period.push(entry.value);
    } else if (entry.type === "type") {
      filters.type.push(entry.value);
    }
  });

  return filters;
}

/**
 * Ajoute une valeur personnalisée (pays, période ou type)
 */
export async function addUserCustomValue(supabase, userId, type, value) {
  const { error } = await supabase
    .from("user_custom_values")
    .insert([{ user_id: userId, type, value }]);

  if (error) {
    console.error("❌ Erreur ajout valeur personnalisée :", error.message);
    return false;
  }
  return true;
}
