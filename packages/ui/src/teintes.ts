/* TEINTE D'UN ENFANT — avec trois enfants ou plus, les cartes se ressemblent toutes.
 * Chaque enfant reçoit une teinte STABLE, dérivée de son identifiant : la même sur son
 * avatar, sa puce de sélection et le liseré de sa carte, dans les deux applications.
 * Six teintes distinctes en clair comme en sombre (jetons `--enfant-1..6`) ; le contraste
 * du texte ne dépend jamais d'elles — elles ne colorent que des aplats et des bordures. */
export function teinteEnfant(id: string): 1 | 2 | 3 | 4 | 5 | 6 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}
