import Link from "next/link";
import { teinteEnfant } from "@ville/ui/teintes";

/* PLUSIEURS ENFANTS — le cas normal, pas l'exception (11 enfants pour 6 familles dans
 * le jeu réel de la ville). Empiler toutes les cartes marche à deux, plus à quatre.
 * Un seul contrôle, présent sur les trois échelles : « Tous » ou un enfant.
 * Le choix voyage dans l'URL (partageable, revenable en arrière) — pas dans un état
 * local qui se perd au changement de page. */

export type EnfantChoix = { id: string; prenom: string; classe: string };

export function SelecteurEnfant({ enfants, choisi, href }: { enfants: EnfantChoix[]; choisi: string | null; href: (e: string | null) => string }) {
  if (enfants.length < 2) return null; // un enfant unique n'a pas besoin d'être choisi
  return (
    <div className="enfants-choix" role="group" aria-label="Enfant affiché">
      <Link href={href(null)} className="puce-enfant" data-actif={choisi === null || undefined} aria-current={choisi === null ? "true" : undefined}>
        <span className="puce-tous" aria-hidden>{enfants.length}</span>
        <span>Tous</span>
      </Link>
      {enfants.map((e) => (
        <Link key={e.id} href={href(e.id)} className="puce-enfant" data-enfant={teinteEnfant(e.id)} data-actif={choisi === e.id || undefined} aria-current={choisi === e.id ? "true" : undefined}>
          <span className="puce-avatar" aria-hidden>{e.prenom.slice(0, 1)}</span>
          <span>{e.prenom}<small>{e.classe}</small></span>
        </Link>
      ))}
    </div>
  );
}
