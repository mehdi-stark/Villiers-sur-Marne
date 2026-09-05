// Thème PAR COMMUNE — en jetons, jamais en couleurs dans les composants. Le
// portail est neutre (décision 4 du cadrage recommandée) : une commune = une
// entrée ici, lue depuis `communeId`. Couleurs SANS source officielle = provisoires.
export type Commune = {
  id: string;
  nom: string;
  courte: string; // libellé compact (header, icône)
  accent: string; // couleur d'ACTION (boutons, liens, états actifs) — contraste ≥ 4,5 sur blanc
  accentSombre: string; // même rôle, thème sombre
  accentVif: string; // la couleur de la charte telle quelle, pour les APLATS (fonds pleins, badges)
  institutionnel: string; // le ton officiel de la ville (en-têtes, marque, registre admin)
  creme: string | null; // fond chaud de la charte (Villiers : #f4f0eb) — null = fond neutre
  appel: string; // couleur d'appel, avec parcimonie (un CTA, un badge)
  policeTitre: string | null; // police de titre de la charte (Google Fonts) ou null = Instrument Sans
  logoUrl: string | null; // logo officiel servi par l'app (droits : voir mentionLogo)
  mentionLogo: string | null;
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
    // Charte RELEVÉE dans la feuille de style du site officiel (theme.css du thème
    // villiers94-2023, 05/09/2026, 428 Ko) : vert #71b21a (105 occurrences = couleur
    // DOMINANTE), bleu #015f89 (73 = institutionnel), crème #f4f0eb (43 = fond des
    // sections), orange #ef984b (24), texte #333333, police « Exo ». Le vert brut n'a
    // que 2,6:1 sur blanc : la couleur d'ACTION est son cran foncé (#4a7411, 5,5:1),
    // le vert vif reste pour les aplats. À confirmer par la charte graphique de la ville.
    accent: "#4a7411",
    accentSombre: "#8fd43a",
    accentVif: "#71b21a",
    institutionnel: "#015f89",
    creme: "#f4f0eb",
    appel: "#ef984b",
    policeTitre: "Exo",
    logoUrl: "/logo-villiers.svg",
    mentionLogo: "Logo et emblème : Ville de Villiers-sur-Marne. Maquette de proposition, sans lien officiel avec la commune.",
    siteUrl: "https://www.villiers94.fr",
    telephoneAccueil: "01 49 41 28 00",
    emailAccueil: "inscription.scolaire@mairie-villiers94.com",
    logoInitiale: "V",
  },
  demo: { id: "demo", nom: "Commune de démonstration", courte: "Démo", accent: "#2f5bea", accentSombre: "#6d8cff", accentVif: "#2f5bea", institutionnel: "#1f3a93", creme: null, appel: "#d9772a", policeTitre: null, logoUrl: null, mentionLogo: null, siteUrl: "#", telephoneAccueil: "01 00 00 00 00", emailAccueil: "accueil@exemple.invalid", logoInitiale: "D" },
};

export function commune(id: string | undefined): Commune {
  return COMMUNES[id ?? ""] ?? COMMUNES["villiers-sur-marne"]!;
}

/** Jetons CSS injectés sur <html> : `--accent` clair/sombre — le reste de la charte ne bouge pas. */
/** Jetons CSS injectés sur <html> : l'accent de la commune, en clair, en sombre CHOISI,
 *  et en sombre hérité du système — le thème se choisit dans le menu profil. */
/** Jetons CSS de la commune : action, aplats, institutionnel, fond crème, appel — en clair,
 *  en sombre CHOISI et en sombre hérité du système. Le fond crème donne la chaleur du site
 *  officiel ; en sombre il redevient neutre (un beige sombre n'existe pas). */
export function jetonsCommune(c: Commune): string {
  const clair = [
    `--accent:${c.accent}`, `--accent-fort:color-mix(in srgb, ${c.accent} 82%, black)`, `--accent-soft:color-mix(in srgb, ${c.accentVif} 14%, white)`,
    `--accent-vif:${c.accentVif}`, `--institutionnel:${c.institutionnel}`, `--institutionnel-soft:color-mix(in srgb, ${c.institutionnel} 10%, white)`,
    `--appel:${c.appel}`, `--appel-soft:color-mix(in srgb, ${c.appel} 18%, white)`,
    c.creme ? `--fond:${c.creme}` : "", c.creme ? `--surface-2:color-mix(in srgb, ${c.creme} 55%, white)` : "", c.creme ? `--surface-3:color-mix(in srgb, ${c.creme} 88%, white)` : "",
  ].filter(Boolean).join(";");
  const sombre = [
    `--accent:${c.accentSombre}`, `--accent-fort:color-mix(in srgb, ${c.accentSombre} 78%, white)`, `--accent-soft:color-mix(in srgb, ${c.accentSombre} 20%, black)`,
    `--accent-vif:${c.accentVif}`, `--institutionnel:color-mix(in srgb, ${c.institutionnel} 55%, white)`, `--institutionnel-soft:color-mix(in srgb, ${c.institutionnel} 30%, black)`,
    `--appel:${c.appel}`, `--appel-soft:color-mix(in srgb, ${c.appel} 26%, black)`,
  ].join(";");
  const police = c.policeTitre ? `--police-titre:"${c.policeTitre}", var(--font-display), var(--police-corps);` : "";
  return `:root{${clair};${police}}[data-theme="dark"]{${sombre}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]):not([data-theme="dark"]){${sombre}}}`;
}

/** Contraste WCAG entre deux couleurs hexadécimales (4,5 pour du texte, 3 pour un gros titre). */
export function contraste(a: string, b: string): number {
  const lum = (hex: string) => {
    const v = hex.replace("#", "");
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
