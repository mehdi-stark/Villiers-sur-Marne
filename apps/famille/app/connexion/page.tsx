"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BoutonFaceId } from "@ville/core/ui/passkeys";
import { FormulaireConnexion } from "@ville/core/ui/connexion";

function Formulaire() {
  const suite = useSearchParams().get("suite") ?? "/";
  const cible = suite.startsWith("/") ? suite : "/";
  return (
    <FormulaireConnexion
      suite={cible}
      textes={{
        titre: "Portail Famille",
        accroche: "Réserver, payer, suivre — pour vos enfants, depuis votre téléphone.",
        initiale: "V",
        apresEnvoi: "Si {email} est rattachée à un dossier famille, un code à 6 chiffres vient d'y être envoyé. Il expire dans 10 minutes.",
        aide: "Un code à 6 chiffres, valable 10 minutes. L'adresse doit être celle de votre dossier famille.",
      }}
      avant={<BoutonFaceId suite={cible} />}
      apres={<a className="mini" href="/decouvrir">Découvrir le portail</a>}
    />
  );
}

export default function Connexion() {
  return <Suspense><Formulaire /></Suspense>;
}
