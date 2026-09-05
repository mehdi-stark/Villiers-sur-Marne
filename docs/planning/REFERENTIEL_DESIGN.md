# Référentiel design — ville (direction artistique du 04/09/2026, après « affreux le design »)

## Direction artistique (recette DIRECTION_ARTISTIQUE — à VALIDER par Mehdi depuis le cockpit, sujet `design`)
### Références (patterns empruntés, pas copiés)
| Registre | Référence | Ce qu'on prend | Ce qu'on refuse |
|---|---|---|---|
| Produit client (famille) | **Doctolib** (app) | créneaux = pastilles tapables, un geste par écran, confirmation immédiate, en-tête qui salue | densité d'annuaire |
| Produit client | **Lydia / Qonto** | cartes « montant » lisibles en 2 s, chiffres tabulaires, badges d'état colorés par rôle | gamification |
| Produit client | **Apple Santé / Calendrier iOS** | barre d'onglets en bas (pouce), rayons 16-24, couleurs de rôle (repas = chaud, loisirs = violet), blancs généreux | skeuomorphisme |
| Admin (agents, cockpit) | **Linear** | barre latérale, rangées denses, raccourcis, badges sobres, mouvement 150 ms | modales lourdes |
| Admin | **Stripe Dashboard** | tuiles chiffres avec seuils, tables qui respirent, états vides expliqués | graphiques décoratifs |
| Admin | **Notion** | hiérarchie par la typographie, pas par les cadres | icônes emoji fonctionnelles |

### Ce que l'utilisateur doit RESSENTIR / VOIR en 2 secondes
- **Parent** : « c'est simple, c'est ma commune, je sais quoi faire » — salut par le prénom de la famille, la semaine sous les yeux, un tap = un état qui change, la couleur de la commune.
- **Agent** : « je vois ce qu'il reste à pointer et où » — compteurs en tête, rangées par école, un tap présent/absent.
- **Mehdi (cockpit)** : « je sais ce qui m'attend et ce que ça bloque » — chiffres, badges, décisions en cartes.

## Tokens (source unique : `packages/ui/tokens.css`)
Rôles de couleur clair/sombre (fond, surfaces 1-3, bords, texte 1-3, accent/soft/fort = **bleu Villiers `#015f89`** extrait du site officiel, secondaire vert `#71b21a`, appel orange `#ff6600`, ok/warn/danger/info + soft, **chaud** pour la restauration, **loisir** pour l'ALSH) ; titres en **Exo** (police du site) ; échelle typographique 12 → 36 ; espacement 4 pt ; rayons 8/12/16/24/pill ; élévations 1-3 ; durées 120/200/320 ms. L'accent de la commune (`packages/core/src/communes.ts`) est injecté par le layout et prime.

## Primitives (`packages/ui`)
`CoquilleClient` (onglets bas + liens desktop), `CoquilleAdmin` (barre latérale + tiroir mobile), `EtatVide` illustré (`IlluCalendrier`, `IlluFacture`, `IlluFile`, `IlluAppareil`), `TuileChiffre` (compteur animé), `Cascade` (apparition en cascade), `BoutonTap` (spring) ; classes : `.bouton` (primaire/discret/danger, sm/lg/pleine), `.carte`, `.carte-accent`, `.badge[data-tone]`, `.bandeau`, `.ligne`, `.icone-ronde`, `.tableau-defile`.

## Coquille standard (recette `COQUILLE_APPLICATION`, 05/09/2026)
- **Sections de navigation** : cockpit « Pilotage / Le projet / Le produit » · agents « Aujourd'hui / Dossiers / Référentiel » · famille = onglets bas. Chaque entrée porte son compteur (décisions à trancher, démarches à traiter) — la couleur `warn` signale ce qui bloque.
- **Menu profil** (bas de barre latérale, en-tête à droite côté client) : identité, apparence **clair / sombre / système**, réglages, appareils et sécurité, déconnexion en dernier. Plus aucun « Quitter » isolé.
- **Thème persistant** : jetons sous `[data-theme]` + `prefers-color-scheme`, script inline dans `<head>` (aucun flash) ; prouvé par test (le choix survit au rechargement).
- **Démo peuplée** : 6 familles, 11 enfants, réservations variées, 3 démarches, pointages du jour (`apps/agents/scripts/seed-demo.mjs`, idempotent et purgeable) — un écran vide ne se juge pas.

## Navigation par registre
- Famille : **onglets en bas** (Ma semaine · Factures · Enfants · Appareils) — plus de hamburger ; desktop : liens en en-tête.
- Agents et cockpit : **barre latérale** dès 900 px, tiroir en dessous.

## Mouvement
Spring au tap (créneaux, boutons primaires), cascade des listes (8 px, 40 ms), compteurs sur les chiffres clés ; `prefers-reduced-motion` respecté partout.

## Mobile (preuve : capture 390 px, clair et sombre)
Safe areas, inputs ≥ 16 px, `min-width: 0`, onglets fixes avec `env(safe-area-inset-bottom)`.

## Rubrique /5 par écran (audit-app) — remplie à chaque livraison, à côté de la capture
| Écran | Hiérarchie | Contraste | Densité | Cohérence | Identité | Mouvement | États | Livrable |
|---|---|---|---|---|---|---|---|---|
| Famille · Ma semaine (390, clair + sombre) | 4 | 4 | 4 | 5 | 3 | 4 | 4 | oui — identité : initiale générique en attendant la charte de Villiers |
| Famille · Factures | 4 | 5 | 4 | 5 | 3 | 3 | 5 | oui — mouvement : rien n'anime encore le montant |
| Agents · File du jour (1440 + 390) | 5 | 5 | 4 | 5 | 3 | 4 | 5 | oui — identité : même remarque |
| Cockpit · Pilotage (1440) | 4 | 5 | 4 | 5 | 3 | 4 | 4 | oui |
| Cockpit · Décisions (390) | 5 | 5 | 5 | 5 | 4 | 4 | 5 | oui — assistant « une décision à la fois » |
| Famille · Ma semaine PAR SERVICE (390, clair + sombre) | 5 | 5 | 4 | 5 | 4 | 4 | 5 | oui — chaque service nommé, horaire, tarif, formules groupées |
| Famille · Démarche guidée (390) | 5 | 5 | 5 | 5 | 4 | 3 | 5 | oui — une pièce par carte, le bouton dit ce qui manque |
| Agents · Démarches à traiter (1440 + 390) | 5 | 5 | 5 | 5 | 4 | 3 | 5 | oui — refus impossible sans motif |
| Toutes · Coquille (sections + menu profil, 1280) | 5 | 5 | 5 | 5 | 4 | 4 | 5 | oui — 05/09/2026, testée (profil + thème persistant) |
| Famille · Réglages (390) | 5 | 5 | 5 | 5 | 4 | 3 | 5 | oui |

### Correctif du 04/09/2026 (retour : « on ne comprend pas les services réservés »)
Trois défauts corrigés : (1) la semaine empilait des pastilles par JOUR sans jamais nommer le
service — elle se lit désormais PAR SERVICE, une ligne par service, cinq colonnes de jours
alignées sous un en-tête unique ; (2) les libellés étaient des abréviations (« repas », « matin »)
au lieu des noms de la ville (« Pause méridienne », « Accueil du matin ») — chaque ligne porte
maintenant le nom complet, l'horaire et le tarif ; (3) les services SANS réservation affichaient
« Libre » avec un bouton mort — ils portent un badge « Inscrit à l'année » et une phrase qui
l'explique. Les trois formules du mercredi (journée, matinée, après-midi) sont UN service avec
un sélecteur de formule, au lieu de trois blocs quasi vides.

Notes du 04/09/2026 (première passe, avant maquette validée) : l'axe **identité** plafonne à 3 tant que la
charte officielle de Villiers (couleur, logo, typographie) n'est pas fournie ; l'écran Décisions du cockpit
demande une refonte « une décision à la fois » (assistant) — inscrit au backlog.

## Icônes et logos
- Marques/services : logos officiels SVG (`simple-icons`) ; icônes d'interface : `lucide` ; jamais d'emoji fonctionnel.
- Identité commune : initiale sur dégradé de l'accent tant que la charte officielle de Villiers n'est pas fournie (PROVISOIRE).
