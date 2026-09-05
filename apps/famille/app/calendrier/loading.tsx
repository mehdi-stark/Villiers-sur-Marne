import { SqueletteLigne } from "@ville/ui";

/** Squelette À LA FORME du calendrier : la grille du mois est là avant ses réservations. */
export default function Chargement() {
  return (
    <div className="pile" aria-busy="true" aria-label="Chargement du calendrier">
      <div className="pile" style={{ gap: 10 }}>
        <SqueletteLigne largeur={110} hauteur={12} />
        <SqueletteLigne largeur="42%" hauteur={30} />
      </div>
      <div className="carte">
        <div className="calendrier-grille" aria-hidden>
          {Array.from({ length: 35 }, (_, i) => <div key={i} className="squelette" style={{ height: 62, borderRadius: 12 }} />)}
        </div>
      </div>
    </div>
  );
}
