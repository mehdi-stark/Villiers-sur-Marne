import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Fil de retour : sur une page profonde, on doit toujours savoir d'où l'on vient. */
export function Retour({ vers, libelle }: { vers: string; libelle: string }) {
  return (
    <Link href={vers} className="retour">
      <ChevronLeft size={16} aria-hidden />
      {libelle}
    </Link>
  );
}
