// Illustrations d'états vides — SVG inline, couleurs de la charte (jamais d'image externe).
export function IlluCalendrier() {
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label="Calendrier vide">
      <rect x="20" y="22" width="120" height="86" rx="14" fill="var(--accent-soft)" />
      <rect x="20" y="22" width="120" height="24" rx="14" fill="var(--accent)" />
      <circle cx="44" cy="34" r="4" fill="var(--accent-texte)" /><circle cx="60" cy="34" r="4" fill="var(--accent-texte)" opacity=".6" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={34 + i * 26} y="58" width="18" height="12" rx="4" fill="var(--surface)" />)}
      {[0, 1, 2].map((i) => <rect key={i} x={34 + i * 26} y="78" width="18" height="12" rx="4" fill="var(--surface)" />)}
      <circle cx="118" cy="84" r="16" fill="var(--chaud)" /><path d="M110 84h16M118 76v16" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function IlluFacture() {
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label="Aucune facture">
      <rect x="40" y="14" width="80" height="96" rx="12" fill="var(--surface-3)" />
      <rect x="52" y="30" width="56" height="8" rx="4" fill="var(--texte-3)" opacity=".5" />
      <rect x="52" y="46" width="40" height="8" rx="4" fill="var(--texte-3)" opacity=".35" />
      <rect x="52" y="62" width="48" height="8" rx="4" fill="var(--texte-3)" opacity=".35" />
      <circle cx="108" cy="92" r="16" fill="var(--ok)" /><path d="M101 92l5 5 10-10" stroke="var(--surface)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IlluFile() {
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label="Rien à traiter">
      {[0, 1, 2].map((i) => <rect key={i} x="24" y={22 + i * 28} width="112" height="20" rx="8" fill={i === 0 ? "var(--accent-soft)" : "var(--surface-3)"} />)}
      {[0, 1, 2].map((i) => <circle key={i} cx="38" cy={32 + i * 28} r="6" fill={i === 0 ? "var(--accent)" : "var(--texte-3)"} opacity={i === 0 ? 1 : 0.4} />)}
      <circle cx="128" cy="96" r="16" fill="var(--ok)" /><path d="M121 96l5 5 10-10" stroke="var(--surface)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IlluAppareil() {
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label="Aucun appareil">
      <rect x="56" y="10" width="48" height="100" rx="12" fill="var(--surface-3)" />
      <rect x="62" y="20" width="36" height="72" rx="6" fill="var(--surface)" />
      <circle cx="80" cy="56" r="14" fill="var(--accent-soft)" /><path d="M74 56l4 4 8-8" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="101" r="4" fill="var(--texte-3)" opacity=".5" />
    </svg>
  );
}
