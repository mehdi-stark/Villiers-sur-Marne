// Thème PAR COMMUNE — en jetons, jamais en couleurs dans les composants. Le
// portail est neutre (décision 4 du cadrage recommandée) : une commune = une
// entrée ici, lue depuis `communeId`. Couleurs SANS source officielle = provisoires.
export type Commune = {
  id: string;
  nom: string;
  courte: string; // libellé compact (header, icône)
  accent: string; // couleur principale (clair)
  accentSombre: string; // même rôle, thème sombre
  secondaire: string; // second ton de la charte (Villiers : vert)
  appel: string; // couleur d'appel (Villiers : orange) — utilisée avec parcimonie (un CTA, un badge)
  policeTitre: string | null; // police de titre de la charte (Google Fonts) ou null = Instrument Sans
  siteUrl: string;
  telephoneAccueil: string; // Espace Accueil et Facturation
  emailAccueil: string;
  logoInitiale: string; // fallback si aucun logo officiel fourni
};

export const COMMUNES: Record<string, Commune> = {
  "villiers-sur-marne": {
    id: "villiers-sur-marne",
    nom: "Villiers-sur-Marne",
    courte: "Villiers",
    // Extrait du site officiel villiers94.fr le 04/09/2026 (CSS inline : #015f89 × 38 occurrences = bleu
    // institutionnel, #71b21a = vert, #ff6600 = orange d'appel ; police « Exo » ; favicon = feuilles de vigne
    // blanches sur bleu). À CONFIRMER par la charte graphique de la ville, mais ce n'est plus une invention.
    accent: "#015f89",
    accentSombre: "#4fb3e0",
    secondaire: "#71b21a",
    appel: "#ff6600",
    policeTitre: "Exo",
    siteUrl: "https://www.villiers94.fr",
    telephoneAccueil: "01 49 41 28 00",
    emailAccueil: "inscription.scolaire@mairie-villiers94.com",
    logoInitiale: "V",
  },
  demo: { id: "demo", nom: "Commune de démonstration", courte: "Démo", accent: "#2f5bea", accentSombre: "#6d8cff", secondaire: "#157f4a", appel: "#d9772a", policeTitre: null, siteUrl: "#", telephoneAccueil: "01 00 00 00 00", emailAccueil: "accueil@exemple.invalid", logoInitiale: "D" },
};

export function commune(id: string | undefined): Commune {
  return COMMUNES[id ?? ""] ?? COMMUNES["villiers-sur-marne"]!;
}

/** Jetons CSS injectés sur <html> : `--accent` clair/sombre — le reste de la charte ne bouge pas. */
export function jetonsCommune(c: Commune): string {
  const clair = `--accent:${c.accent};--accent-fort:color-mix(in srgb, ${c.accent} 82%, black);--accent-soft:color-mix(in srgb, ${c.accent} 11%, white);--secondaire:${c.secondaire};--secondaire-soft:color-mix(in srgb, ${c.secondaire} 14%, white);--appel:${c.appel};--appel-soft:color-mix(in srgb, ${c.appel} 14%, white)`;
  const sombre = `--accent:${c.accentSombre};--accent-fort:color-mix(in srgb, ${c.accentSombre} 80%, white);--accent-soft:color-mix(in srgb, ${c.accentSombre} 22%, black);--secondaire:${c.secondaire};--secondaire-soft:color-mix(in srgb, ${c.secondaire} 24%, black);--appel:${c.appel};--appel-soft:color-mix(in srgb, ${c.appel} 24%, black)`;
  const police = c.policeTitre ? `--police-titre:"${c.policeTitre}", var(--font-display), var(--police-corps);` : "";
  return `:root{${clair};${police}}@media (prefers-color-scheme: dark){:root{${sombre}}}`;
}
