// Emblème PROVISOIRE — feuille de vigne stylisée, DESSINÉE POUR CE PROJET.
// Ce n'est PAS le logo officiel de la ville (feuilles de vigne + typographie déposées) :
// l'utiliser exigerait l'accord écrit de la commune (droit de marque). Il s'en inspire
// pour que l'app soit reconnaissable, et se remplace en une ligne le jour de l'accord.
export function svgEmbleme(couleur: string, options: { fond?: string; rayon?: number } = {}): string {
  const fond = options.fond ?? couleur;
  const r = options.rayon ?? 112;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${r}" fill="${fond}"/>
  <g fill="#ffffff">
    <path d="M256 392c0-46 6-86 22-122 16-36 40-64 74-86-4 40-16 74-36 102-20 28-40 46-60 56z" opacity=".92"/>
    <path d="M232 300c-18-12-30-30-36-54-6-24-4-50 6-78 22 18 36 40 42 66 6 26 4 48-12 66z"/>
    <path d="M198 246c-24 2-46-6-66-24-20-18-32-42-38-72 30 4 54 16 72 36 18 20 28 40 32 60z"/>
    <path d="M282 320c22-10 46-10 70 0 24 10 44 28 60 54-30 6-56 4-78-8-22-12-38-27-52-46z" opacity=".85"/>
    <rect x="246" y="300" width="20" height="112" rx="10"/>
  </g>
</svg>`;
}
