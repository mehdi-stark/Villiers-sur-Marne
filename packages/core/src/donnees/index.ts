import { sourceFictive } from "./fictif";
import type { SourceDonnees } from "./types";

// ADAPTATEUR : le front ne connaît que `SourceDonnees`. Aujourd'hui « fictif » ;
// « export-agora » (reprise de données à l'échéance du marché) et « api-agora »
// (interop signée) sont déclarés mais NON BRANCHÉS — et le disent.
function nonBranchee(nom: "export-agora" | "api-agora", cause: string): SourceDonnees {
  const refus = async () => { throw new Error(`Source ${nom} non branchée : ${cause}`); };
  return { nom, disponible: async () => ({ ok: false, cause }), famille: refus, enfants: refus, activites: refus, reservations: refus, factures: refus };
}

export const SOURCES: Record<string, SourceDonnees> = {
  fictif: sourceFictive,
  "export-agora": nonBranchee("export-agora", "aucun export Agora+ reçu (reprise de données à demander à Infocom'94 à l'échéance du marché)"),
  "api-agora": nonBranchee("api-agora", "aucune API publique Agora+ ; l'interopérabilité doit être écrite dans un pilote signé (faille haute du verdict marché)"),
};

export function sourceActive(): SourceDonnees {
  const nom = process.env.SOURCE_DONNEES ?? "fictif";
  const s = SOURCES[nom];
  if (!s) throw new Error(`SOURCE_DONNEES inconnue : ${nom}`);
  return s;
}
