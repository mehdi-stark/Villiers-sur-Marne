import { NextResponse } from "next/server";
import { commune } from "@ville/core/communes";
import { pdfProposition } from "@ville/core/documents/proposition";
import { ACTIVITES, ECOLES, FICTIF_STATS } from "@ville/core/donnees/fictif";
import { euros, tarif } from "@ville/core/donnees/regles";
import { MARCHES_DECP } from "@ville/core/marche";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Le dossier de proposition, généré à la demande — chaque chiffre vient du code. */
export async function GET() {
  const c = commune(process.env.COMMUNE_ID);
  const cantine = ACTIVITES.find((a) => a.type === "cantine")!;
  const pdf = await pdfProposition({
    commune: c,
    genereLe: new Date().toISOString(),
    urlDemo: process.env.FAMILLE_URL ? `${process.env.FAMILLE_URL}/decouvrir` : "villiers-famille.vercel.app/decouvrir",
    constats: [
      { titre: "Un portail qui date techniquement", detail: "Le portail actuel repose sur AngularJS 1.x, sans mise a jour de securite depuis janvier 2022, servi en Windows-1252, avec le zoom desactive sur telephone - un defaut d'accessibilite (RGAA) constate le 04/09/2026." },
      { titre: "Des libelles qui n'aident pas", detail: "Des messages non traduits sont livres en production (Mandat a cree, Attestation payment, Bulletin d'vaccins) et une demande d'information sur les cookies deposee sur Services Publics+ en octobre 2023 est restee sans reponse." },
      { titre: "Le delai renvoie au guichet", detail: "Hors delai, le portail affiche Contactez les services : chaque refus devient un appel a l'Espace Accueil et Facturation, alors que la regle est calculable." },
    ],
    apports: [
      { titre: "La semaine se lit par service", detail: "Une ligne par service - pause meridienne, accueils, loisirs - avec son horaire, son tarif de tranche et l'etat de chaque jour. Un tap reserve ou annule ; hors delai, la case dit jusqu'a quand c'etait possible." },
      { titre: "La facture se comprend", detail: "Calculee depuis les pointages des agents : presences, forfaits mensuels declenches, reserve non consomme. Paiement PayFIP et attestation de paiement en un tap." },
      { titre: "Les demarches se font depuis le telephone", detail: "Inscription periscolaire, calcul du quotient, changement de coordonnees : les pieces se photographient, l'agent valide ou demande une correction motivee, la famille suit l'avancement." },
      { titre: "Un back-office pour les agents", detail: "File du jour par ecole et par service, pointage tactile presence/absence journalise, demarches a traiter, tarifs et delais references avec leur source." },
    ],
    chiffres: [
      { valeur: String(ECOLES.length), libelle: "ecoles et leurs accueils periscolaires couverts" },
      { valeur: "10", libelle: "tranches de quotient familial, grille 2025-2026" },
      { valeur: `${euros(tarif(cantine, 1))} - ${euros(tarif(cantine, 9))}`, libelle: "le repas selon le quotient, tarifs de la ville" },
      { valeur: "7 j", libelle: "francs de delai pour les repas, calcules par le code" },
      { valeur: String(FICTIF_STATS.activites), libelle: "services tarifes deja modelises" },
      { valeur: "3", libelle: "applications : familles, agents, pilotage" },
    ],
    marche: { medianeHT: MARCHES_DECP.medianeHT, dureeMois: MARCHES_DECP.dureeMedianeMois, seuilSansProcedure: 60000 },
  });
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="proposition-portail-famille-${c.id}.pdf"`, "Cache-Control": "public, max-age=300" } });
}
