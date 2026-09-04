import { decisionsPrises, type DecisionPrise } from "./decisions";
import { backlogOuvert, extraireBacklog, extraireDecisions, lireDoc, OPTIONS_BACKLOG } from "./docs";
import { analyse } from "./marche";

// Toutes les décisions du projet, triées par ce qu'elles BLOQUENT : le cadrage
// bloque l'analyse de marché, le verdict marché bloque l'architecture, le
// backlog ne bloque rien (il attend son maillon).
export type Ouverte = {
  sujet: "cadrage" | "design" | "marche" | "backlog";
  cle: string;
  titre: string;
  texte?: string;
  options: readonly string[];
  recommandation: string | null;
  bloque: string;
  rang: number; // plus petit = plus urgent
  prise: DecisionPrise | null;
  decideeDoc: string | null; // décision déjà écrite dans le document (backlog « Fait », « Go — opérateur »…)
};

export async function toutesLesDecisions(): Promise<Ouverte[]> {
  const [cadrageMd, designMd, backlogMd, pc, pd, pm, pb] = await Promise.all([lireDoc("CADRAGE.md"), lireDoc("DIRECTION_ARTISTIQUE.md").catch(() => ""), lireDoc("BACKLOG.md"), decisionsPrises("cadrage"), decisionsPrises("design"), decisionsPrises("marche"), decisionsPrises("backlog")]);
  const a = analyse();
  const liste: Ouverte[] = [];
  for (const d of extraireDecisions(cadrageMd)) liste.push({ sujet: "cadrage", cle: d.cle, titre: d.titre, texte: d.texte, options: d.options, recommandation: d.recommandation, bloque: "l'analyse de marché et l'architecture", rang: 1, prise: pc.get(d.cle) ?? null, decideeDoc: null });
  for (const d of extraireDecisions(designMd)) liste.push({ sujet: "design", cle: `design:${d.numero}`, titre: d.titre, texte: d.texte, options: d.options, recommandation: d.recommandation, bloque: "les écrans suivants (aucun écran sans direction validée)", rang: 2, prise: pd.get(`design:${d.numero}`) ?? null, decideeDoc: null });
  liste.push({ sujet: "marche", cle: "marche:verdict", titre: `Verdict marché ${a.final} (${a.score}/100) — que fait-on ?`, texte: "Parer la faille interop remonte le verdict à GO conditionnel sans changer les notes.", options: ["Parer la faille : je porte l'interop (contact Infocom'94 / mairie)", "Démonstrateur sans vente, risque assumé", "NO-GO accepté : on s'arrête"], recommandation: "Parer la faille : je porte l'interop (contact Infocom'94 / mairie)", bloque: "l'architecture et tout code métier", rang: 3, prise: pm.get("marche:verdict") ?? null, decideeDoc: null });
  for (const l of extraireBacklog(backlogMd)) liste.push({ sujet: "backlog", cle: l.cle, titre: l.item, texte: `Débloque : ${l.debloque} · taille ${l.taille} · doc : ${l.decisionDoc}`, options: OPTIONS_BACKLOG, recommandation: null, bloque: l.debloque, rang: 4, prise: pb.get(l.cle) ?? null, decideeDoc: backlogOuvert(l) ? null : l.decisionDoc });
  return liste.sort((x, y) => x.rang - y.rang);
}

export async function nombreOuvertes(): Promise<number> {
  return (await toutesLesDecisions()).filter((d) => !d.prise && !d.decideeDoc).length;
}
