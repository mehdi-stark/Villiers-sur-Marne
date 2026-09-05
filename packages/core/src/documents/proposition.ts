import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Commune } from "../communes";

// DOSSIER DE PROPOSITION — 2 pages, aux couleurs de la commune : le document qu'on laisse
// après le rendez-vous. Chaque chiffre vient du code (grille, marchés, contacts), aucun
// n'est saisi ici : un dossier qui invente un chiffre ne se rattrape pas.
export type ContenuProposition = {
  commune: Commune;
  constats: { titre: string; detail: string }[];
  apports: { titre: string; detail: string }[];
  chiffres: { valeur: string; libelle: string }[];
  marche: { medianeHT: number; dureeMois: number; seuilSansProcedure: number };
  genereLe: string;
  urlDemo: string;
};

// WinAnsi (polices standard) accepte l'euro : on le garde, on ne mange que le reste.
const propre = (s: string) => s.replace(/[\u00A0\u202F\u2009]/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\u20AC]/g, "-");
const hex = (h: string) => { const v = h.replace("#", ""); return rgb(parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255); };

export async function pdfProposition(c: ContenuProposition): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Portail famille — proposition pour ${c.commune.nom}`);
  doc.setAuthor("Proposition independante");
  doc.setCreationDate(new Date(c.genereLe));
  doc.setModificationDate(new Date(c.genereLe));
  const gras = await doc.embedFont(StandardFonts.HelveticaBold), reg = await doc.embedFont(StandardFonts.Helvetica);
  const vert = hex(c.commune.accent), bleu = hex(c.commune.institutionnel), creme = hex(c.commune.creme ?? "#f4f0eb"), gris = rgb(0.35, 0.35, 0.38);
  const L = 56, LARGE = 595 - 2 * L;

  const enveloppe = (texte: string, taille: number, police: typeof reg, largeur: number): string[] => {
    const mots = propre(texte).split(" ");
    const lignes: string[] = []; let ligne = "";
    for (const m of mots) { const essai = ligne ? `${ligne} ${m}` : m; if (police.widthOfTextAtSize(essai, taille) > largeur) { lignes.push(ligne); ligne = m; } else ligne = essai; }
    if (ligne) lignes.push(ligne);
    return lignes;
  };

  // --- Page 1 : le constat et la proposition -------------------------------------------
  const p1 = doc.addPage([595, 842]);
  p1.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: bleu });
  p1.drawText(propre(c.commune.nom.toUpperCase()), { x: L, y: 800, size: 12, font: gras, color: rgb(1, 1, 1) });
  p1.drawText("Portail famille - proposition", { x: L, y: 772, size: 22, font: gras, color: rgb(1, 1, 1) });
  p1.drawText(propre(`Document de travail, ${new Date(c.genereLe).toLocaleDateString("fr-FR")}`), { x: L, y: 752, size: 9, font: reg, color: rgb(0.85, 0.9, 0.95) });

  let y = 706;
  p1.drawText("Ce que les familles vivent aujourd'hui", { x: L, y, size: 14, font: gras, color: bleu }); y -= 20;
  for (const item of c.constats) {
    p1.drawRectangle({ x: L, y: y - 4, width: 3, height: 12, color: vert });
    p1.drawText(propre(item.titre), { x: L + 12, y, size: 10.5, font: gras }); y -= 14;
    for (const l of enveloppe(item.detail, 9.5, reg, LARGE - 12)) { p1.drawText(l, { x: L + 12, y, size: 9.5, font: reg, color: gris }); y -= 12; }
    y -= 6;
  }

  y -= 8;
  p1.drawRectangle({ x: L - 8, y: y - 8, width: LARGE + 16, height: 2, color: creme });
  y -= 24;
  p1.drawText("Ce que la proposition apporte", { x: L, y, size: 14, font: gras, color: bleu }); y -= 20;
  for (const item of c.apports) {
    p1.drawRectangle({ x: L, y: y - 4, width: 3, height: 12, color: vert });
    p1.drawText(propre(item.titre), { x: L + 12, y, size: 10.5, font: gras }); y -= 14;
    for (const l of enveloppe(item.detail, 9.5, reg, LARGE - 12)) { p1.drawText(l, { x: L + 12, y, size: 9.5, font: reg, color: gris }); y -= 12; }
    y -= 6;
  }

  p1.drawText(propre(`Demonstration en ligne : ${c.urlDemo}`), { x: L, y: 60, size: 9, font: gras, color: vert });
  p1.drawText(propre("Proposition independante, sans lien officiel avec la commune. Logo : Ville de Villiers-sur-Marne."), { x: L, y: 46, size: 7.5, font: reg, color: gris });

  // --- Page 2 : les chiffres, le cadre, la suite ---------------------------------------
  const p2 = doc.addPage([595, 842]);
  p2.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: creme });
  p2.drawText("Les chiffres du dossier", { x: L, y: 810, size: 16, font: gras, color: bleu });

  let yy = 740;
  const colonne = (LARGE - 24) / 2;
  c.chiffres.forEach((ch, i) => {
    const x = L + (i % 2) * (colonne + 24);
    if (i % 2 === 0 && i > 0) yy -= 62;
    p2.drawRectangle({ x, y: yy - 34, width: colonne, height: 52, color: creme });
    p2.drawText(propre(ch.valeur), { x: x + 12, y: yy - 4, size: 18, font: gras, color: vert });
    for (const [k, l] of enveloppe(ch.libelle, 8.5, reg, colonne - 24).slice(0, 2).entries()) p2.drawText(l, { x: x + 12, y: yy - 20 - k * 10, size: 8.5, font: reg, color: gris });
  });

  let y2 = yy - 90;
  p2.drawText("Le cadre", { x: L, y: y2, size: 14, font: gras, color: bleu }); y2 -= 20;
  const cadre = [
    `Marches comparables : mediane ${(c.marche.medianeHT / 1000).toFixed(1).replace(".", ",")} k EUR HT sur ${c.marche.dureeMois} mois (donnees essentielles de la commande publique).`,
    `Un pilote sous ${(c.marche.seuilSansProcedure / 1000).toFixed(0)} k EUR HT se contracte sans publicite ni mise en concurrence (seuil au 01/04/2026).`,
    "Paiement des familles par PayFIP (DGFiP) : seul moyen legal pour une regie ; aucun flux ne transite par l'editeur.",
    "Donnees hebergees dans l'Union europeenne, une base par commune, aucun mot de passe stocke (code a usage unique).",
    "Le back-office des agents reste la propriete de la collectivite : file du jour, pointage, demarches, tarifs.",
  ];
  for (const l of cadre) { for (const ligne of enveloppe(`- ${l}`, 9.5, reg, LARGE)) { p2.drawText(ligne, { x: L, y: y2, size: 9.5, font: reg, color: gris }); y2 -= 12; } y2 -= 4; }

  y2 -= 14;
  p2.drawRectangle({ x: L, y: y2 - 58, width: LARGE, height: 70, color: bleu });
  p2.drawText("La suite", { x: L + 14, y: y2 - 6, size: 12, font: gras, color: rgb(1, 1, 1) });
  p2.drawText(propre("1. Une demonstration de 20 minutes, sur telephone, avec vos tarifs reels."), { x: L + 14, y: y2 - 24, size: 9, font: reg, color: rgb(0.9, 0.94, 0.98) });
  p2.drawText(propre("2. Un pilote sur une ecole ou un service, avec vos agents."), { x: L + 14, y: y2 - 38, size: 9, font: reg, color: rgb(0.9, 0.94, 0.98) });
  p2.drawText(propre("3. L'interoperabilite avec l'outil de gestion, portee par le syndicat informatique."), { x: L + 14, y: y2 - 52, size: 9, font: reg, color: rgb(0.9, 0.94, 0.98) });

  p2.drawText(propre(`Contact de la commune : ${c.commune.telephoneAccueil} - ${c.commune.emailAccueil}`), { x: L, y: 60, size: 8.5, font: reg, color: gris });
  p2.drawText(propre(`Document genere le ${new Date(c.genereLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} (heure de Paris).`), { x: L, y: 46, size: 7.5, font: reg, color: gris });
  return doc.save();
}
