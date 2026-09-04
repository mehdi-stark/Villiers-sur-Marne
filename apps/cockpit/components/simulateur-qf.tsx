"use client";

import { useMemo, useState } from "react";
import { BORNES_QF, euros, tarif, tarifNonReserve, trancheDe } from "@ville/core/donnees/regles";
import type { Activite } from "@ville/core/donnees/types";

/** Le simulateur de quotient familial : un chiffre → la tranche et tous les tarifs,
 *  calculés par le même code que le portail (jamais une seconde grille). */
export function SimulateurQF({ activites }: { activites: Activite[] }) {
  const [qf, setQf] = useState<string>("812");
  const [exterieur, setExterieur] = useState(false);
  const [sansQf, setSansQf] = useState(false);
  const valeur = Number(qf.replace(/\s/g, "").replace(",", "."));
  const tranche = useMemo(() => trancheDe(sansQf || Number.isNaN(valeur) ? null : valeur, exterieur), [valeur, exterieur, sansQf]);
  const borne = BORNES_QF.find((b) => b.tranche === tranche);
  return (
    <section className="carte pile" aria-labelledby="simu">
      <h2 id="simu">Simulateur de quotient familial</h2>
      <div className="rangee" style={{ gap: 12 }}>
        <label style={{ flex: "1 1 160px", display: "grid", gap: 4 }}>
          <span className="muted">Quotient familial (€)</span>
          <input inputMode="decimal" value={qf} onChange={(e) => setQf(e.target.value)} disabled={sansQf} aria-label="Quotient familial en euros" />
        </label>
        <label className="rangee" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={sansQf} onChange={(e) => setSansQf(e.target.checked)} /> QF non calculé</label>
        <label className="rangee" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={exterieur} onChange={(e) => setExterieur(e.target.checked)} /> Extérieur à la commune</label>
      </div>
      <p>
        <span className="badge" data-tone="accent">Tranche {tranche === 10 ? "extérieurs" : tranche}</span>{" "}
        <span className="muted">{tranche === 10 ? "hors commune" : borne && borne.max !== Infinity ? `QF ≤ ${borne.max} €` : "QF ≥ 1 251 €"}{sansQf ? " — sans calcul, la tranche 9 s'applique et aucune rétroactivité" : ""}</span>
      </p>
      <div className="doc"><div className="tableau-defile"><table style={{ minWidth: 520 }}>
        <thead><tr><th>Activité</th><th>Tarif unitaire</th><th>Forfait mensuel</th><th>Non réservé</th></tr></thead>
        <tbody>{activites.map((a) => (
          <tr key={a.id}><td>{a.libelle}</td><td>{euros(tarif(a, tranche))}</td><td>{a.forfaitMensuel ? `${euros(a.forfaitMensuel.montants[tranche - 1]!)} dès ${a.forfaitMensuel.declencheA}` : "—"}</td><td>{a.prevenance.joursAvant ? euros(tarifNonReserve(a, tranche, !sansQf)) : "—"}</td></tr>
        ))}</tbody>
      </table></div></div>
      <p className="tiny">Grille 2025-2026 (01/07/2025). Un argument chiffré pour l'élu : la même fonction sert le portail famille et le back-office.</p>
    </section>
  );
}
