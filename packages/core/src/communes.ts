// Thème PAR COMMUNE — en jetons, jamais en couleurs dans les composants. Le
// portail est neutre (décision 4 du cadrage recommandée) : une commune = une
// entrée ici, lue depuis `communeId`. Couleurs SANS source officielle = provisoires.
export type Commune = {
  id: string;
  nom: string;
  courte: string; // libellé compact (header, icône)
  accent: string; // couleur principale (clair)
  accentSombre: string; // même rôle, thème sombre
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
    accent: "#1f4e9c", // PROVISOIRE : bleu institutionnel proche de la charte villiers94.fr — à remplacer par la charte officielle de la ville
    accentSombre: "#6d9bff",
    siteUrl: "https://www.villiers94.fr",
    telephoneAccueil: "01 49 41 28 00",
    emailAccueil: "inscription.scolaire@mairie-villiers94.com",
    logoInitiale: "V",
  },
  demo: { id: "demo", nom: "Commune de démonstration", courte: "Démo", accent: "#2f5bea", accentSombre: "#6d8cff", siteUrl: "#", telephoneAccueil: "01 00 00 00 00", emailAccueil: "accueil@exemple.invalid", logoInitiale: "D" },
};

export function commune(id: string | undefined): Commune {
  return COMMUNES[id ?? ""] ?? COMMUNES["villiers-sur-marne"]!;
}

/** Jetons CSS injectés sur <html> : `--accent` clair/sombre — le reste de la charte ne bouge pas. */
export function jetonsCommune(c: Commune): string {
  return `:root{--accent:${c.accent};--accent-soft:color-mix(in srgb, ${c.accent} 12%, white)}@media (prefers-color-scheme: dark){:root{--accent:${c.accentSombre};--accent-soft:color-mix(in srgb, ${c.accentSombre} 22%, black)}}`;
}
