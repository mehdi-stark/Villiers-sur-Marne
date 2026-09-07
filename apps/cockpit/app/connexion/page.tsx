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
        titre: "Cockpit Ville",
        accroche: "Cadrage, backlog et décisions du projet — depuis n'importe où.",
        initiale: "V",
        apresEnvoi: "Si {email} fait partie des adresses autorisées, un code à 6 chiffres vient d'y être envoyé. Il expire dans 10 minutes.",
        aide: "Un code à 6 chiffres, valable 10 minutes. Accès réservé aux adresses autorisées.",
      }}
      avant={<BoutonFaceId suite={cible} />}
    />
  );
}

export default function Connexion() {
  return <Suspense><Formulaire /></Suspense>;
}
