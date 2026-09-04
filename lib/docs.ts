import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

// Les documents canoniques (docs/planning/*.md) sont la source de vérité relue à
// froid. Le cockpit les REND et en extrait ce qui se tranche : le §7 du cadrage
// (une décision = options + recommandation) et les lignes du backlog.
const DOSSIER = path.join(process.cwd(), "docs", "planning");

export type Decision = {
  cle: string; // "cadrage:1"
  numero: number;
  titre: string;
  texte: string; // le corps, sans la ligne Options/Recommandation
  options: string[];
  recommandation: string | null;
};

export type LigneBacklog = {
  cle: string; // "backlog:<slug>"
  item: string;
  debloque: string;
  taille: string;
  decisionDoc: string; // ce que le fichier dit aujourd'hui
};

export async function lireDoc(nom: string): Promise<string> {
  return readFile(path.join(DOSSIER, nom), "utf8");
}

export function rendreMarkdown(md: string): string {
  return marked.parse(md, { gfm: true, breaks: false }) as string;
}

/** Retire les balises markdown de surface pour un libellé (gras, code). */
function texteBrut(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\s+/g, " ").trim();
}

export function slug(s: string): string {
  return texteBrut(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Section « Décisions à valider » du cadrage : une entrée par item numéroté.
 *  Convention (gabarit CADRAGE) : dernière ligne de l'item =
 *  `Options : A · B · C — Recommandation : A`. Sans ligne Options → Oui / Non. */
export function extraireDecisions(md: string): Decision[] {
  const section = md.split(/^## 7 ·[^\n]*\n/m)[1]?.split(/^## /m)[0] ?? "";
  const items = section.split(/^(?=\d+\. )/m).map((s) => s.trim()).filter((s) => /^\d+\. /.test(s));
  return items.map((brut) => {
    const numero = Number(brut.match(/^(\d+)\./)![1]);
    const corps = brut.replace(/^\d+\.\s*/, "").replace(/\n\s+/g, " ");
    const titre = texteBrut(corps.match(/\*\*([^*]+)\*\*/)?.[1] ?? corps.slice(0, 60));
    const ligneOptions = corps.match(/Options\s*:\s*(.+?)(?:\s+—\s+Recommandation\s*:\s*(.+?))?\s*\.?$/);
    const options = ligneOptions?.[1] ? ligneOptions[1].split(/\s+·\s+/).map(texteBrut).filter(Boolean) : ["Oui", "Non"];
    const recommandation = ligneOptions?.[2] ? texteBrut(ligneOptions[2]).replace(/\.$/, "") : null;
    const texte = texteBrut(corps.replace(/Options\s*:.*$/, "").replace(/^\*\*[^*]+\*\*\s*—?\s*/, ""));
    return { cle: `cadrage:${numero}`, numero, titre, texte, options, recommandation };
  });
}

/** Lignes du tableau du backlog (Item | Débloque | Taille | Décision). */
export function extraireBacklog(md: string): LigneBacklog[] {
  return md
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-{3,}/.test(l) && !/^\|\s*Item\s*\|/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length >= 4)
    .map(([item, debloque, taille, decisionDoc]) => ({
      cle: `backlog:${slug(item!)}`,
      item: texteBrut(item!),
      debloque: texteBrut(debloque!),
      taille: texteBrut(taille!),
      decisionDoc: texteBrut(decisionDoc!),
    }));
}

export const OPTIONS_BACKLOG = ["Go", "Plus tard", "Non"] as const;

/** Une ligne de backlog est OUVERTE seulement si le document dit « En attente » ;
 *  « Fait », « Go — opérateur », « Non »… sont des décisions déjà écrites. */
export function backlogOuvert(l: LigneBacklog): boolean {
  return /^en attente/i.test(l.decisionDoc);
}
