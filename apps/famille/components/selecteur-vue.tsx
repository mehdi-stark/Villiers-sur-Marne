import Link from "next/link";

/* UN SEUL sélecteur de vue, présent à l'identique sur les trois écrans temporels :
 * on doit savoir OÙ on est et pouvoir changer d'échelle sans réapprendre. */
export type Vue = "jour" | "semaine" | "mois";

export function SelecteurVue({ vue, jour, semaine, mois, enfant }: { vue: Vue; jour: string; semaine: string; mois: string; enfant?: string | null }) {
  // L'enfant choisi SUIT le changement d'échelle : on ne le reperd pas en passant au mois.
  const e = enfant ? `&e=${enfant}` : "";
  const liens: { cle: Vue; label: string; href: string }[] = [
    { cle: "jour", label: "Jour", href: `/jour?d=${jour}${e}` },
    { cle: "semaine", label: "Semaine", href: `/?s=${semaine}${e}` },
    { cle: "mois", label: "Mois", href: `/calendrier?m=${mois}${e}` },
  ];
  return (
    <div className="segmente" role="group" aria-label="Échelle d'affichage" style={{ justifySelf: "start" }}>
      {liens.map((l) => (l.cle === vue
        ? <span key={l.cle} data-actif aria-current="page">{l.label}</span>
        : <Link key={l.cle} href={l.href}>{l.label}</Link>))}
    </div>
  );
}

/** Navigation ← titre → : la même mécanique pour un jour, une semaine ou un mois. */
/** `::first-letter` ne s'applique pas à un span inline : la majuscule se pose ici. */
export const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function NavPeriode({ precedent, suivant, titre, libellePrecedent, libelleSuivant }: { precedent: string; suivant: string; titre: string; libellePrecedent: string; libelleSuivant: string }) {
  return (
    <div className="segmente nav-periode">
      <Link href={precedent} aria-label={libellePrecedent}>←</Link>
      <span data-actif>{capitale(titre)}</span>
      <Link href={suivant} aria-label={libelleSuivant}>→</Link>
    </div>
  );
}
