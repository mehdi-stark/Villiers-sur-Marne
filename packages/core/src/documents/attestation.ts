import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db, schema } from "../db";
import { euros } from "../donnees/regles";
import type { Commune } from "../communes";

// Attestation de paiement — données structurées + PDF figé stockés ensemble (CONVENTIONS :
// jamais l'un sans l'autre). Le PDF est déterministe : même données → même document.
export type DonneesAttestation = {
  familleId: string; famille: string; email: string; periode: string; commune: Commune;
  lignes: { date: string; enfant: string; prestation: string; montant: number }[];
  total: number; paye: number; etat: "payee" | "a_payer"; genereLe: string;
};

function nettoyer(s: string): string { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E]/g, "?"); } // polices standard : pas d'accents

export async function pdfAttestation(d: DonneesAttestation): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Attestation de paiement ${d.periode}`); doc.setAuthor(d.commune.nom); doc.setCreationDate(new Date(d.genereLe)); doc.setModificationDate(new Date(d.genereLe));
  const page = doc.addPage([595, 842]);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold), reg = await doc.embedFont(StandardFonts.Helvetica);
  const bleu = rgb(0.004, 0.373, 0.537);
  page.drawRectangle({ x: 0, y: 802, width: 595, height: 40, color: bleu });
  page.drawText(nettoyer(d.commune.nom), { x: 40, y: 816, size: 14, font: gras, color: rgb(1, 1, 1) });
  page.drawText("Attestation de paiement", { x: 40, y: 760, size: 20, font: gras, color: bleu });
  const lignes = [`Periode : ${d.periode}`, `Famille : ${nettoyer(d.famille)} (${nettoyer(d.email)})`, `Etat : ${d.etat === "payee" ? "payee" : "a payer"} - montant facture ${nettoyer(euros(d.total))} - montant paye ${nettoyer(euros(d.paye))}`, `Prestations periscolaires et extrascolaires - ${nettoyer(d.commune.nom)} - Espace Accueil et Facturation ${d.commune.telephoneAccueil}`];
  let y = 730;
  for (const l of lignes) { page.drawText(l, { x: 40, y, size: 11, font: reg }); y -= 18; }
  y -= 12;
  page.drawText("Date", { x: 40, y, size: 10, font: gras }); page.drawText("Enfant", { x: 120, y, size: 10, font: gras }); page.drawText("Prestation", { x: 220, y, size: 10, font: gras }); page.drawText("Montant", { x: 480, y, size: 10, font: gras });
  y -= 6; page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.85) }); y -= 14;
  for (const l of d.lignes.slice(0, 40)) { page.drawText(l.date, { x: 40, y, size: 9.5, font: reg }); page.drawText(nettoyer(l.enfant).slice(0, 18), { x: 120, y, size: 9.5, font: reg }); page.drawText(nettoyer(l.prestation).slice(0, 48), { x: 220, y, size: 9.5, font: reg }); page.drawText(nettoyer(euros(l.montant)), { x: 480, y, size: 9.5, font: reg }); y -= 14; }
  if (d.lignes.length > 40) { page.drawText(`... et ${d.lignes.length - 40} autres lignes`, { x: 40, y, size: 9.5, font: reg }); y -= 14; }
  y -= 10; page.drawText(`Total : ${nettoyer(euros(d.total))}`, { x: 400, y, size: 12, font: gras });
  page.drawText(`Document genere le ${new Date(d.genereLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} (heure de Paris). Fait pour servir et valoir ce que de droit (employeur, impots).`, { x: 40, y: 60, size: 8.5, font: reg, color: rgb(0.4, 0.4, 0.45) });
  return doc.save();
}

export async function genererEtStockerAttestation(app: string, d: DonneesAttestation): Promise<{ id: string; pdf: Uint8Array }> {
  const pdf = await pdfAttestation(d);
  const [row] = await db.insert(schema.documents).values({ app, type: "attestation_paiement", familleId: d.familleId, periode: d.periode, donnees: d as unknown as Record<string, unknown>, pdfBase64: Buffer.from(pdf).toString("base64") }).returning({ id: schema.documents.id });
  return { id: row!.id, pdf };
}

export async function lireDocument(id: string, familleId: string) {
  const { and, eq } = await import("drizzle-orm");
  const [row] = await db.select().from(schema.documents).where(and(eq(schema.documents.id, id), eq(schema.documents.familleId, familleId))).limit(1);
  return row ?? null;
}
