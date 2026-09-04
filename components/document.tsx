import { rendreMarkdown } from "@/lib/docs";

/** Rend un document canonique (docs/planning). Les tableaux défilent dans leur
 *  conteneur — jamais le document. Contenu = nos propres fichiers du repo. */
export function Document({ md, replie, titre }: { md: string; replie?: boolean; titre?: string }) {
  const html = rendreMarkdown(md).replace(/<table>/g, '<div class="tableau-defile"><table>').replace(/<\/table>/g, "</table></div>");
  const corps = <div className="doc" dangerouslySetInnerHTML={{ __html: html }} />;
  if (!replie) return corps;
  return (
    <details className="carte">
      <summary>{titre ?? "Lire le document complet"}</summary>
      <div style={{ marginTop: 12 }}>{corps}</div>
    </details>
  );
}
