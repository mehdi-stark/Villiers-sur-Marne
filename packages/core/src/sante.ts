/* SANTÉ D'UNE APPLICATION — « pouvoir revenir dessus dans un mois et retrouver le
 * nécessaire » (demande Mehdi, 06/09/2026). Chaque app expose ce rapport ; le cockpit
 * les interroge et les affiche côte à côte. Deux règles :
 *   - AUCUNE valeur de secret ne sort d'ici : on dit « posée » ou « absente », jamais quoi.
 *   - La route est protégée par SANTE_SECRET : savoir CE QUI MANQUE à une app est déjà
 *     une information utile à un attaquant. */

export type EtatVariable = { nom: string; role: string; posee: boolean; obligatoire: boolean };
export type RapportSante = {
  app: string;
  version: { commit: string | null; branche: string | null; deployeLe: string | null; environnement: string };
  source: string;
  variables: EtatVariable[];
  manquantes: string[];
  region: string | null;
};

/** Décrit une variable sans jamais lire sa valeur ailleurs que pour dire si elle existe. */
export function variable(nom: string, role: string, obligatoire = true): EtatVariable {
  const v = process.env[nom];
  return { nom, role, posee: typeof v === "string" && v.length > 0, obligatoire };
}

export function rapportSante(app: string, variables: EtatVariable[]): RapportSante {
  return {
    app,
    version: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      branche: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      // Vercel n'expose pas la date du déploiement : l'identifiant suffit à la retrouver.
      deployeLe: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      environnement: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "développement"),
    },
    source: process.env.SOURCE_DONNEES ?? "fictif",
    variables,
    manquantes: variables.filter((v) => v.obligatoire && !v.posee).map((v) => v.nom),
    region: process.env.VERCEL_REGION ?? null,
  };
}

/** Handler commun : 401 sans le secret partagé, 503 si le secret n'est pas posé du tout.
 *  Répond en `Response` standard — `packages/core` ne dépend d'aucun framework. */
export function routeSante(app: string, variables: () => EtatVariable[]) {
  return async function GET(req: Request): Promise<Response> {
    const secret = process.env.SANTE_SECRET;
    if (!secret) return Response.json({ erreur: "SANTE_SECRET absent de cette application" }, { status: 503 });
    if (req.headers.get("x-sante-secret") !== secret) return Response.json({ erreur: "non autorisé" }, { status: 401 });
    return Response.json(rapportSante(app, variables()));
  };
}
