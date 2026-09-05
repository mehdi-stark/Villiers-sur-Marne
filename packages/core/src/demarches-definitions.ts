// Définitions PURES des démarches (pas d'accès base) : partagées par le serveur ET les
// composants client. Un module client qui importe la couche base casse le bundle —
// piège payé le 04/09/2026.
export type CodePiece = "identite" | "domicile" | "caf" | "vaccins" | "imposition";
export type TypeDemarche = "inscription_periscolaire" | "quotient_familial" | "coordonnees";
export type Etat = "deposee" | "en_cours" | "validee" | "refusee";

export const PIECES: Record<CodePiece, { nom: string; aide: string }> = {
  identite: { nom: "Pièce d'identité", aide: "Carte d'identité ou passeport du parent qui inscrit." },
  domicile: { nom: "Justificatif de domicile", aide: "De moins de 3 mois (facture d'énergie, quittance, avis de taxe d'habitation)." },
  caf: { nom: "Attestation de paiement CAF", aide: "De moins de 3 mois, avec le montant des prestations versées." },
  vaccins: { nom: "Vaccinations", aide: "Pages du carnet de santé où figurent les vaccins de l'enfant." },
  imposition: { nom: "Avis d'imposition", aide: "Avis 2025 sur les revenus 2024, pour les deux parents (hors déclaration commune)." },
};

export const TYPES: Record<TypeDemarche, { nom: string; explication: string; pieces: CodePiece[]; delai: string }> = {
  inscription_periscolaire: { nom: "Inscription périscolaire", explication: "Inscrire votre enfant aux accueils du matin, du soir, à la restauration et aux mercredis pour l'année scolaire.", pieces: ["identite", "domicile", "caf", "vaccins"], delai: "Traitée sous 48 h ouvrées par l'Espace Accueil et Facturation." },
  quotient_familial: { nom: "Calcul du quotient familial", explication: "Obtenir le tarif adapté à vos ressources. Sans ce calcul, la tranche 9 (tarif maximal) s'applique, sans rétroactivité.", pieces: ["imposition", "caf"], delai: "Le quotient est pris en compte le mois suivant son calcul." },
  coordonnees: { nom: "Changement de coordonnées", explication: "Mettre à jour votre adresse, votre téléphone ou votre e-mail sur le dossier famille.", pieces: ["domicile"], delai: "Prise en compte sous 48 h." },
};

export const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo par pièce
export const MIMES = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];

export const ETATS: Record<Etat, { libelle: string; tone: "accent" | "warn" | "ok" | "danger"; quoi: string }> = {
  deposee: { libelle: "Envoyée", tone: "accent", quoi: "Reçue par l'Espace Accueil et Facturation. Rien à faire de votre côté." },
  en_cours: { libelle: "En cours d'examen", tone: "warn", quoi: "Un agent examine vos pièces." },
  validee: { libelle: "Validée", tone: "ok", quoi: "C'est bon : la démarche est prise en compte." },
  refusee: { libelle: "À corriger", tone: "danger", quoi: "Une pièce ne convient pas — le motif est ci-dessous." },
};

/** Taille lisible : « 640 o », « 82 Ko », « 1,4 Mo » — jamais « 0 Ko ». */
export function taille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
