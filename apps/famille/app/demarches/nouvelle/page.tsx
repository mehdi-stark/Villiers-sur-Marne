import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TYPES, type TypeDemarche } from "@ville/core/demarches-definitions";
import { familleCourante } from "@/lib/session";
import { FormulaireDemarche } from "@/components/formulaire-demarche";

export const metadata: Metadata = { title: "Nouvelle démarche" };
export const dynamic = "force-dynamic";

export default async function Nouvelle({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const { type } = await searchParams;
  const valide = type && type in TYPES ? (type as TypeDemarche) : null;
  return (
    <>
      <div className="page-tete"><div><span className="salut">{f.famille.nom}</span><h1>{valide ? TYPES[valide].nom : "Nouvelle démarche"}</h1><p className="petit t-2">{valide ? "Les pièces sont demandées une par une ; vous pouvez les photographier." : "Choisissez la démarche à effectuer."}</p></div></div>
      {valide ? <FormulaireDemarche type={valide} /> : (
        <div className="pile">
          {(Object.keys(TYPES) as TypeDemarche[]).map((t) => (
            <Link key={t} href={`/demarches/nouvelle?type=${t}`} className="carte ligne" style={{ gridTemplateColumns: "1fr auto" }}>
              <div><strong>{TYPES[t].nom}</strong><div className="petit t-2">{TYPES[t].explication}</div><div className="mini t-3">{TYPES[t].pieces.length} pièce{TYPES[t].pieces.length > 1 ? "s" : ""} à joindre · {TYPES[t].delai}</div></div>
              <span aria-hidden>→</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
