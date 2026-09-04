# Recette — Lanceur mobile : créer un projet depuis le téléphone

**Besoin** : « je suis dehors, j'ai une idée, je veux que le projet existe sur mon
Mac avec la trame et une session Claude Code ouverte quand je rentre ».

**Architecture** (prouvée sur l'usine ecom, 30/08/2026) — pas d'app native :
1. **PWA « Nouveau projet »** (écran du cockpit, même login OTP + Face ID) : type
   (icônes), nom, idée → une DEMANDE en base (`regles.projets_demandes`, jsonb, sans
   migration). Liste des demandes avec état (en attente / en cours / créé / échec).
2. **Écouteur sur le Mac** (`app/ecouter.sh`, launchd toutes les 30 s via
   `app/installer_ecouteur.sh`) : `POST /api/cron/projets-demandes?action=prendre`
   (secret cron) → pour chaque demande, `LANCER_CLAUDE=1 nouveau-projet.sh type nom idée`
   (dossier `~/code/<nom>`, gabarits, VS Code, Terminal + Claude sur le prompt) →
   `?action=terminer` → **push** sur le téléphone « Projet créé — session ouverte ».
3. Mac endormi/fermé : la demande attend ; rattrapage au réveil. Rien n'est perdu.

**Pourquoi pas SSH/Raccourcis iOS ?** exige le Mac joignable à l'instant T (Tailscale,
réveil). La file en base marche toujours, et laisse une trace.

**Secrets** : `~/.config/trames/lanceur.env` (chmod 600), jamais dans le repo.
**Installer** : `~/code/trames/app/installer_ecouteur.sh` (demande l'URL + le secret).
**Désinstaller** : `installer_ecouteur.sh --desinstaller`. Journal : `~/.config/trames/lanceur.log`.

## Compléments (30/08/2026, soir — prouvés E2E)

- **Ouverture de session VÉRIFIÉE** (`app/ouvrir-session.sh`) : chemin absolu de `claude`
  (le shell d'un `.command` lancé sous launchd n'a pas `~/.local/bin` dans son PATH —
  Claude ne s'ouvrait pas, silencieusement), `.claude-session.pid` écrit par le
  `.command` puis contrôlé (`kill -0`) : résultat honnête « session ouverte (pid) » ou
  « NON ouverte — double-clique LANCER_CLAUDE.command ». Le `.command` reste dans le
  dossier : double-clic = relancer Claude avec le prompt (`.claude-prompt.txt`).
- **Reprise d'un projet existant** : l'écouteur publie la liste de `~/code` (dossiers
  avec CLAUDE.md/.trame.json, toutes les 10 min) ; la page propose « Reprendre » →
  VS Code + Claude avec le prompt « lis CLAUDE.md et docs/planning, exécute la prochaine
  action » (+ consigne libre). Test : reprise en 37 s, pid vérifié.
- **Étapes live** (`?action=etape`) affichées sur la carte de la demande ; cartes (pas de
  table) sur mobile.

## V2 (31/08/2026) — app DÉDIÉE, découplée de tout cockpit projet

Le Lanceur est désormais une app à part entière : `trames/lanceur/` (Next 15,
postgres.js, OTP e-mail propre, PWA « Lanceur » 🚀 avec raccourcis d'icône).
Projet Vercel `lanceur` → https://lanceur-usine.vercel.app. L'écouteur du Mac
parle à `/api/ecouteur` avec `LANCEUR_SECRET` (config `~/.config/trames/lanceur.env` :
`LANCEUR_URL` + `LANCEUR_SECRET`). Plus AUCUN écran ni route dans le cockpit ecom.

**Après le premier déploiement (une fois, à la main)** : Vercel active « Vercel
Authentication » sur tout nouveau projet → tout répond 302 vers vercel.com/sso-api,
même l'API de l'écouteur. Dashboard Vercel → lanceur → Settings → Deployment
Protection → Vercel Authentication : **Disabled**. L'app a sa PROPRE porte
(OTP whitelist + middleware fail-closed), comme un cockpit.

**Confiance Claude Code (« Do you trust the files in this folder? »)** : sans
pré-confiance, la session lancée attend une main humaine. Le flag par projet est
`hasTrustDialogAccepted` dans `~/.claude.json` ; l'agent IA n'est pas autorisé à
écrire lui-même ce fichier (garde-fou assumé) — l'OPÉRATEUR colle le petit bloc
python fourni dans la réponse de session (ou l'écrit une fois) juste avant la
ligne `open -a Terminal …` de `app/ouvrir-session.sh`, pour pré-accorder la
confiance aux dossiers que CE lanceur crée ou reprend.

## V2.1 (31/08/2026) — notifications, détail, setup en une commande (prouvés E2E)

- **Push web du Lanceur** : clés VAPID auto-générées en base, bouton « 🔔 Être
  notifié quand le Mac a fini », envoi à la fin de chaque demande (lien vers le
  détail), subscriptions mortes purgées. Testé : sub factice → envoi → purge.
- **Écran détail `/demande/[id]`** : chronologie (demandé/pris/terminé), étape,
  résultat, dossier, rouvrir une session avec consigne, commandes manuelles.
- **`trames.sh lanceur`** : setup complet de l'écouteur sur un Mac neuf
  (config + launchd + ping authentifié de l'API) en une commande.
- **Pré-confiance Claude ACTIVE** (validée par Mehdi 31/08) dans
  `ouvrir-session.sh` : preuve E2E — dossier créé depuis la PWA, transcript de
  session présent ~15 s après, aucun dialogue « trust this folder ».
- Connexion : e-mails de `ADMIN_EMAILS` uniquement (whitelist fail-closed,
  réponse identique pour un e-mail inconnu — pas d'oracle).

## V2.2 (31/08/2026) — adoption automatique, fin de session, Face ID (prouvés E2E)

- **`adopter` ouvre la session tout seul** (bug réel : la trame se posait, mais
  aucune session ni prompt — l'opérateur restait devant un dossier muet). Désormais :
  PROMPT_A_COLLER.md d'adoption (confirmer l'audit → maillon 1) + session Claude
  ouverte automatiquement (LANCER_CLAUDE=1 par défaut ; l'app Mac « Nouveau
  projet » fait pareil). Un seul moteur partout : `ouvrir-session.sh` (pré-confiance,
  hook de fin, session vérifiée par pid) — app Mac, app web, CLI.
- **Fin de session remontée** : `ouvrir-session.sh` dépose un hook Stop
  (`.claude/fin-session.sh` → `.claude-fin.txt` : date, dernier commit, fichiers
  non commités) ; l'écouteur le publie (`action=fin`) → push « Session terminée »
  + résumé sous le projet dans « Reprendre ». Jamais déposé si `.claude/settings.json`
  existe déjà.
- **Pastille « Mac en ligne / vu il y a X min »** sur l'accueil (heartbeat à chaque
  passage de l'écouteur) — distingue « Mac endormi » de « demande en attente ».
- **Face ID sur le Lanceur** : passkeys en règles jsonb (@simplewebauthn), bouton
  « Activer Face ID ici » (session ouverte) puis connexion en un geste ; le code
  e-mail reste le repli. rpID = hostname → propre au domaine du Lanceur.

## V2.3 (31/08/2026) — accueil tableau de bord (prouvé E2E)

- **Parc d'un coup d'œil** : chaque ligne « Reprendre » affiche, fermée, la
  dernière fin de session (« ✓ dernier commit · session <date> ») dès que le
  hook Stop a tourné une fois.
- **Sections différenciées** : blocs teintés + compteurs (Demandes n / Reprendre n).
- **Masquer / purge** : ✕ sur toute demande terminée (le projet reste dans
  « Reprendre ») ; purge AUTO des demandes terminées depuis plus de 7 j.

## V2.4 (31/08/2026) — consignes à chaud, icônes, rafraîchissement ciblé

- **Consigne à une session DÉJÀ ouverte** : « ✉︎ Envoyer à la session ouverte »
  dans le pli du projet → file en base → l'écouteur écrit
  `<projet>/.claude-consignes.md` → la session la lit *entre deux maillons*
  (la règle est inscrite dans TOUS les prompts par `ouvrir-session.sh`).
  Plus besoin d'attendre la fin d'une session pour infléchir le travail.
- **Icônes par projet** dans « Reprendre », déduites du `.trame.json`
  (domaine ecommerce → 🛍️, plateforme shopify-app → 🧩, mobile → 📱, saas → ☁️…).
- **Rafraîchissement ciblé** : `/api/etat` interrogée toutes les 10 s **seulement
  quand une demande est active**, et la page ne se rafraîchit que si l'état a
  bougé — fini le `<meta refresh>` qui rechargeait en pleine saisie.

## V3 (31/08/2026) — audit du Lanceur : blocages traités et dette restante

**Traité dans cette version :**
- **Isolation des données** : toutes les clés préfixées `lanceur_` (migration sans
  perte de `projets_demandes`/`projets_mac`) ; **secret de session propre**
  (`LANCEUR_AUTH_SECRET`, repli `AUTH_SECRET`) — la fuite du secret d'un autre
  projet n'ouvre plus celui-ci.
- **Anti-spam OTP** : 5 envois/heure (sinon un tiers noie la boîte de l'opérateur ;
  la réponse reste identique dans tous les cas — pas d'oracle).
- **Sessions visibles et pilotables** : pastille « ● session en cours » (pid vivant
  remonté toutes les 2 min) + **arrêt à distance** d'une session partie en vrille.
- **Adoption depuis le téléphone** : un projet sans trame propose « 🧬 Adopter la
  trame » avec choix du profil → trame + audit + session sur le maillon 1 (prouvé :
  7 s, `.trame.json` conforme au profil choisi).
- **Accusé de traitement des consignes** : le hook de fin compte les consignes
  cochées « traitée » → l'écran passe de « remise » à « traitée par Claude ».
- **Un champ, deux boutons** dans le pli : « ↩︎ Reprendre » (nouvelle session) et
  « ✉︎ Envoyer maintenant » (session en cours, désactivé s'il n'y en a pas).
- **`profil.sh`** : mapping type → plateforme/domaine en SOURCE UNIQUE
  (nouveau-projet.sh et ecouter.sh le partagent).

**Dette assumée, à traiter quand une base dédiée existera :**
- Les données du Lanceur vivent encore dans la base d'un AUTRE projet (ecom).
  Risque : une purge/migration ou une base en pause là-bas arrête le Lanceur.
  **Migration clé en main** : créer un projet Supabase (gratuit), puis
  `node lanceur/scripts/migrer-base.mjs "<URL_ecom>" "<URL_lanceur>"` →
  `vercel env add DATABASE_URL production` → redéploiement. Rien n'est effacé
  côté source (rollback = repointer l'URL).
- L'écouteur ne tourne que **Mac éveillé, session utilisateur ouverte** (launchd
  `gui/`) — par nature ; les demandes attendent et se rattrapent au réveil.
- Un seul Mac supporté (deux écouteurs se disputeraient la file).
- On voit le début et la fin d'une session, pas son contenu en direct.

## V3.1 (01/09/2026)

- **Sessions en cours en tête** de « Reprendre » (tri : session active, puis
  modification la plus récente) — c'est ce qu'on cherche en rouvrant l'app.
- **Arrêt en deux temps** : « ⏹ Arrêter la session » ouvre le pli et demande
  « Confirmer l'arrêt » / « Annuler » (aucun `confirm()` navigateur) — un tap
  distrait ne tue plus une session en plein travail. Prouvé : session toujours
  vivante après le premier tap, arrêtée après confirmation.
- **`scripts/basculer-base.sh "<URL>"`** : bascule complète du Lanceur sur sa
  propre base en UNE commande (migration des lignes `lanceur_*`, `DATABASE_URL`
  posée sur Vercel, redéploiement, vérification HTTP) ; la base source garde une
  copie — rollback = y repointer l'URL. Reste à faire par l'opérateur : créer le
  projet Supabase (gratuit) et copier l'URI « Transaction pooler » — le mot de
  passe Postgres n'est affiché qu'à la création, aucun outil ne peut le lire.

## V3.2 (01/09/2026) — base DÉDIÉE (dette soldée) + garde anti-pid-recyclé

- **Le Lanceur a sa propre base** (Neon `lanceur`, eu-central-1, PG 17, offre
  gratuite) : 10 lignes migrées sans perte, `DATABASE_URL` basculée, redéployée,
  cycle complet re-prouvé (demande depuis la PWA → écouteur → session ouverte).
  Plus aucun couplage avec la base d'un autre projet. La base source garde une
  copie (rollback = y repointer l'URL).
- **Créer une base pour n'importe quel projet** :
  `3-outillage/scripts/creer-base-neon.sh <projet> [region]` → URI prête à poser
  dans l'hébergeur (clé API dans `~/.config/trames/neon.env`, chmod 600).
- **Garde anti-pid-recyclé** : `kill -0 <pid>` ne prouve pas que le processus est
  la session Claude — macOS recycle les pid. La détection ET l'arrêt à distance
  vérifient désormais la ligne de commande (`ps -o command=` contient « claude ») ;
  sans cela, « Arrêter la session » pouvait tuer un programme quelconque.

## V4 (02/09/2026) — RÉFÉRENTIEL DU PARC (`/parc`)

Demande Mehdi : « j'ai cinquante comptes, chaque projet a sa base, ses domaines,
ses providers, ça s'empile, c'est ingérable — il faut un référentiel ».

**Trois sources, aucune saisie inutile :**
1. **Scan du Mac** (`app/scanner-projet.py`, publié toutes les 10 min) : stack
   (dépendances, monorepos inclus), services d'après les NOMS de variables
   d'environnement, hôte et région de la base, projet Vercel, dépôt git, dernier
   commit, adoption de la trame. **Aucun secret** : jamais une valeur de variable,
   jamais un identifiant de connexion — vérifié à l'écran.
2. **Domaines réellement possédés** (`app/lister-domaines.sh`) : demandés aux
   comptes des plateformes, jamais devinés dans les README (on y ramassait
   nextjs.org et twitter.com). Registrar + expiration résolus par **RDAP**
   (registre, jamais le DNS) — ex. yuqot.com → OVH, expire 14/11/26 ;
   marnwellstudio.com → IONOS, expire 19/08/27.
3. **Annotations humaines** : propriétaire, statut (actif / en pause / client /
   archivé / à trancher), comptes utilisés, notes — ce que rien ne peut deviner.

**Vue d'ensemble** : bases par hébergeur, comptes de dépôt, services les plus
utilisés, domaines par échéance. Filtre plein texte sur tout.

**Deux pièges payés :**
- La CLI Vercel écrit ses tableaux sur **stderr** : sans `2>&1`, le pipe est vide
  et la liste des domaines revenait déserte sans erreur.
- Les registres RDAP (Verisign…) répondent **403 aux IP de datacenter** : la
  résolution doit se faire depuis le Mac, pas depuis l'app hébergée.

## V4.2 (02/09) — « c'est quel compte, déjà ? »

Le référentiel répond maintenant à la question qui coûte le plus cher deux mois
plus tard : **quel compte pour quel outil, sur quel projet**.

- **Section « Comptes & accès » par projet** : une ligne par outil, avec le
  compte RÉEL et un **lien direct vers la bonne console** — `github.com/<owner>/<repo>`,
  `vercel.com/<équipe>/<projet>`, `console.neon.tech/app/projects/<id>`,
  `supabase.com/dashboard/project/<ref>`. Un tap et on y est.
- **Résolution automatique** (`app/resoudre-comptes.sh`, publié par l'écouteur) :
  l'orgId Vercel (`team_…`) devient le nom d'équipe via l'API Vercel (le tableau
  de `vercel teams ls` ne donne que le slug) ; l'endpoint Neon (`ep-…`) devient
  « projet + organisation » via l'API Neon. Le scanner extrait ces identifiants
  PUBLICS (endpoint, ref Supabase, orgId) — jamais un mot de passe.
- **Annotation libre pour le reste** : « OVH = perso ; Stripe = pro » s'ajoute
  aux lignes détectées (les services à clé ne sont pas devinables sans lire la
  clé, ce qu'on refuse de faire).
- **Regroupement par statut** (Actifs / Clients / En pause / À trancher / Sans
  statut / Archivés) au lieu d'une liste de 38 lignes.
- **Identité git héritée signalée** (⚠︎) : sans `user.email` local, les commits
  repartent sous l'identité globale — 70 cas dans le parc.

## V2 du référentiel (02/09) — les COMPTES, pas seulement les outils

Plan complet : `lanceur/PLAN_V2.md`. Première tranche livrée :

- **Page `/comptes`** : un bloc par service avec l'**e-mail réel** du compte, ses
  organisations, les projets qui en dépendent, et un champ « coût / mois ».
  Trois sections : détectés automatiquement, **registrars** (où sont payés les
  domaines, avec leurs domaines et échéances), et « utilisés mais sans compte
  connu » (12 services : OpenAI, Shopify, Stripe, Sentry…) — ce qui reste à
  renseigner est VISIBLE au lieu d'être absent.
- **E-mails détectés par API** : Vercel (`/v2/user` via le jeton de la CLI) et
  Neon (`/users/me`) donnent `gloomingagency@gmail.com`. Ces e-mails remontent
  ensuite dans CHAQUE fiche projet : « Vercel — gloomingagency@gmail.com ·
  Yuqot's projects · projet ecom-admin ↗ ».
- **Jointure identifiant → compte** : orgId Vercel, endpoint Neon, ref Supabase,
  owner GitHub, registrar du domaine. La question « c'est quel compte ? » est
  répondue par la donnée, jamais par la mémoire.
- **Annotation par COMPTE et non par projet** : un compte de registrar noté une
  fois vaut pour tous ses domaines.
- **`trames.sh cle supabase <sbp_…>`** : jeton vérifié avant écriture ; dès qu'il
  est fourni, les projets Supabase et leur compte se résolvent seuls.

## V2 tranches ③④⑤ (02/09) — coûts, fiche pleine page, export

- **Coûts** : chaque compte porte un « coût / mois » et chaque domaine un
  « coût / an » (saisis une fois, sur la page Comptes). Le bandeau totalise
  **par devise** — convertir sans taux daté serait faux — et affiche
  « n/N comptes chiffrés » : un total ne vaut que ce qui est renseigné.
- **Fiche projet pleine page** `/parc/<projet>` : comptes avec e-mail et liens
  vers les consoles, domaines et échéances, technique, reprise de session,
  annotation. C'est la page qu'on ouvre deux mois plus tard.
- **Export** : `/export` (imprimable ⌘P → PDF, trois tableaux : comptes,
  domaines, projets) et `/api/export` (JSON complet, session requise). Un
  référentiel doit survivre à la panne de l'outil qui l'affiche.
- **Fusion à la publication** : un scan partiel n'efface plus un compte connu.

## V2 tranches ⑥⑦⑧ (02/09) — alertes, coût par projet, recherche

- **Alerte de renouvellement** : à chaque publication des domaines, ceux qui
  expirent sous 30 j déclenchent un push (nom, registrar, jours restants, lien
  vers Comptes). **Une alerte par domaine ET par échéance** : un renouvellement
  réarme l'alerte, un scan répété ne spamme pas. État actuel : yuqot.com à 72 j,
  marnwellstudio.com à 351 j — rien à pousser aujourd'hui, l'alerte partira seule.
- **Coût par projet** : sa part des abonnements (un compte partagé entre N projets
  compte pour 1/N) plus ses domaines ramenés au mois, affiché « ≈ X/mois » avec le
  détail au survol. Vérifié : 20 € ÷ 4 projets + 12 €/an = 6 €/mois ; les devises
  ne sont jamais converties (« 30 € · 25 $ »).
- **Recherche globale** `/recherche` : un champ pour les projets, les comptes ET
  les domaines. « ovh » trouve yuqot.com avec son registrar et son échéance ;
  « neon » trouve le compte. On cherche rarement « un projet » — on cherche « où
  est passé ce truc ».

## V2.1 (02/09) — navigation et rappels ciblés

- **Barre de navigation** unique (Lancer · Parc · Comptes · Chercher · Export),
  onglet actif visible — les liens dispersés dans les en-têtes ne disaient plus
  où l'on se trouvait.
- **Bloc « À compléter »** : les 4 manques les PLUS UTILES d'abord (un compte
  inconnu sur le service qu'utilisent le plus de projets, un domaine sans coût),
  chacun avec son champ et son bouton. Une liste de douze blocs vides ne se
  remplit jamais ; quatre questions ciblées, si.

## Domaines : croiser les sources (02/09)

Les comptes des plateformes ne voient que ce qu'elles hébergent. Un domaine
acheté chez un registrar et branché ailleurs (Shopify, DNS externe) n'y figure
pas. `lister-domaines.sh` ajoute donc les domaines vus dans la CONFIG des
projets — URL **ou adresse e-mail** (`contact@croscel.com`), fournisseurs d'e-mail
exclus — puis résout chacun par RDAP. Résultat : 3 domaines payés au lieu de 2,
dont croscel.com (IONOS, expire le 25/07/2027) rattaché au projet ecom.

## Décrire une idée, et la cadrer avant de la coder (03/09/2026)

**Le problème** : « le texte de l'idée a une limite, ça n'a pas de sens — comment je
décris une idée ? » Et, plus profond : le Lanceur créait un projet en partant droit
au code, alors qu'`EXIGENCES.md` § 2 interdit de construire avant un marché mesuré.

**Ce qu'il faut pour qu'une idée arrive entière jusqu'au prompt**

- **Un champ qui accepte un texte** (4 000 caractères, multi-ligne), plus un champ
  **contraintes** : ce sont exactement les deux lignes à remplir du prompt de
  démarrage — le formulaire pose les questions de la trame, pas une case vide.
  Sur téléphone, une grande zone = dictée au micro du clavier ; c'est le vrai mode
  de saisie d'une idée.
- **Un transport par fichier** : `app/preparer-demandes.py` écrit
  `~/.config/trames/demandes/<id>.idee.txt` (chmod 700, purge à 7 j) et ne fait
  circuler que le chemin ; la ligne est séparée par US (`\x1f`) et non par des
  tabulations (bash fusionne deux tabulations consécutives : un champ vide décalait
  toute la ligne). `app/construire-prompt.py` remplace les trois `sed` : une idée
  contenant `#`, `/` ou des retours à la ligne les cassait.

**Le mode de démarrage** (radio dans le formulaire, défaut = cadrage)

| Mode | Ce que fait la session | Où elle s'arrête |
|---|---|---|
| 🧭 **Cadrer d'abord** | étapes 1→3 (cadrage, marché mesuré, audit), enchaînées sans attendre | verdict go/no-go, aucun code |
| 🚀 **Premier maillon** | la trame entière | fonctionnalité testée en réel |

En mode cadrage, les « ⏸ STOP » des étapes sont RETIRÉS du prompt (un prompt qui dit
à la fois « enchaîne » et « attends ma validation » fait attendre pour rien), et la
session écrit son verdict dans `.claude-resume.txt`.

**Le canal de retour** — sans lui, « planifier d'abord » n'est qu'une session qui pend :
- `LANCER_CLAUDE.command` efface `.claude-resume.txt` au démarrage (il ne peut donc
  appartenir qu'à la session en cours) ;
- le hook `Stop` l'ajoute à `.claude-fin.txt`, l'écouteur le publie (2 500 caractères
  et non 400 : un verdict coupé ne vaut rien), le push met le VERDICT en titre ;
- sur la fiche de la demande, un bouton **« ▶︎ Cadrage validé — construire »** ouvre
  une session de reprise qui enchaîne les étapes 4 à 7.

## Les outils d'un projet, et le compte derrière chacun (03/09/2026)

**Le problème** : la fiche listait les comptes TROUVÉS. Un outil sans compte affiché
n'est pas une case vide — c'est un accès qu'on ne retrouvera pas le jour où il faudra
résilier, renouveler ou réparer.

**La règle d'affichage** — trois choses ensemble, ou rien :
1. **la cause** : pourquoi ce compte n'est pas connu automatiquement ;
2. **la dette d'automatisation nommée** : la commande exacte qui le résoudrait
   (`vercel login`, `trames.sh cle supabase <sbp_…>`, « brancher la lecture de clé ») ;
3. **le champ de saisie**, sur place — un « à renseigner » qu'on ne peut pas renseigner
   là où on le découvre ne se renseigne jamais.

Ce qui se saisit se saisit **une fois par compte** (`annoterCompte`) et se propage à tous
les projets du service par jointure. Le registrar de chaque domaine est un outil comme un
autre : « le domaine, c'est chez qui ? » est la question qui a fait naître ce référentiel.

## `/idees` — capturer sans déclencher (03/09/2026)

Noter une idée exigeait de créer un dossier et d'ouvrir une session : le seul geste
disponible était trop gros, donc les idées tièdes ne se notaient pas. Une idée est un
objet — on la capture (dictée, aussi longue qu'il faut), on y revient, on la précise, puis
un bouton en fait un projet (type + mode de démarrage) ou l'abandonne. Les idées lancées
et abandonnées restent visibles : ce qu'on a fait de ses idées compte autant que celles
qui restent, et une idée abandonnée qu'on re-note trois mois plus tard est du travail
repayé.

## Résoudre les comptes avec les clés déjà présentes (03/09/2026)

Décrire une dette d'automatisation ne la paie pas. `app/resoudre-cles.py` lit les `.env`
des projets, reconnaît une clé **par sa valeur** (`sk_live_…`, `re_…`, `shpat_…`,
`sntrys_…`, `cloudinary://…`) et demande au fournisseur à quel compte elle appartient.

**Les garde-fous, tous nés d'un incident de la première passe :**
- **La clé ne sort pas** : lue sur le Mac, envoyée au seul fournisseur qui l'a émise,
  jetée. Le cache (`~/.config/trames/cles-resolues.json`, chmod 600) n'indexe qu'une
  empreinte sha256 tronquée — un cache lisible ne doit pas être un trousseau.
- **Les messages d'erreur sont filtrés** : « Invalid API Key provided: sk_test_**** »
  partait vers la base. On garde la cause, jamais la citation.
- **Les motifs ambigus sont corroborés** : « 32 hex » n'est un jeton Twilio que si un SID
  `AC…` est dans le même fichier ; `sk-ant-` passe avant `sk-`.
- **Un compte par PROJET** : deux clés Resend = deux comptes (`parProjet`).
- **Une clé morte n'efface pas un compte résolu ailleurs**, et un service ne se plaint
  qu'une fois.
- Cadence : 25 appels par passe au plus, succès valable 7 j, échec retenté à 6 h.

Sur `/parc`, ce qui reste s'affiche en tête, **rangé par nombre de projets débloqués** :
un compte se saisit une fois et répare tous les projets du service — la réparation la
moins chère d'abord.

## Une clé morte est une panne (03/09/2026)

`resoudre-cles.py` lève `CleRefusee` quand le fournisseur REJETTE la clé — à distinguer
d'une précondition manquante (un SID absent à côté d'un jeton Twilio, par exemple). La
gravité (`cle_morte`) voyage avec l'enregistrement jusqu'à l'app, où elle déclenche un
push — **une alerte par clé ET par projet**, la signature étant effacée dès que la clé
remarche, ce qui réarme l'alerte pour la fois suivante (même mécanique que les échéances
de domaines).

**Piège coûteux** : deux filtres en aval, un côté Mac et un côté app, disaient « ce
service est déjà résolu, donc rien à signaler » — et supprimaient les pannes. Une clé
morte passe TOUJOURS : le compte du service est peut-être connu par ailleurs, mais le
projet qui porte la clé cassée, lui, n'encaisse plus.

## Ce qui justifie un abonnement

La page Comptes classe chaque compte par le nombre de projets **vivants** (« actif » ou
« client ») qui s'en servent. Un compte dont tous les projets sont archivés est un
candidat à la résiliation — utile même sans connaître son prix. Et le verdict ne se rend
que si TOUS ses projets sont qualifiés : sinon l'écran dit « statut des projets inconnu »
et propose la qualification en masse, au lieu d'accuser un compte sain.

## Le trousseau — choisir son compte, ne plus chercher sa clé (03/09/2026)

**Le besoin** (Mehdi) : « tous les comptes sur les applications sont MES comptes. Quand on
crée un projet, on choisit lequel utiliser — ça évite d'aller chercher à chaque fois les
clés et les tokens. »

**La décision de sécurité, prise explicitement** : les valeurs ne quittent pas le Mac. Le
*choix* voyage, le secret reste. Trois conséquences de conception :

1. `app/trousseau.py recolter` regroupe, par service et par `.env`, les variables qui
   constituent UN compte (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` : poser l'une sans
   l'autre donne un projet à moitié branché). Deux projets portant la même clé partagent
   le compte ; deux clés différentes du même service sont deux comptes.
   Fichier `~/.config/trames/trousseau.json`, 0600.
2. `trousseau.py index` publie service, libellé, e-mail/organisation, projets, validité et
   **noms** des variables. La publication côté app ne recopie pas l'objet : elle le
   reconstruit champ par champ, et `variables` n'accepte que `[A-Z0-9_]{2,60}` — une garde
   CODÉE, qui survit à un refactor distrait.
3. `trousseau.py injecter <dossier> <ids>` écrit les variables dans `.env.local` (0600,
   ajouté au `.gitignore`), **sans jamais écraser** une variable déjà présente, et rend un
   résumé qui va dans le prompt : « COMPTES DÉJÀ BRANCHÉS : … ne me les redemande pas ».

Sur le téléphone, le sélecteur est un composant CLIENT : les comptes suggérés dépendent du
type de projet, et le type se choisit dans le même formulaire — rendu côté serveur, la
liste conseillait le type par défaut même après en avoir choisi un autre.

## Les trois gisements du trousseau (03/09/2026, complément)

Une première version ne lisait que les `.env` : on choisissait Stripe et Resend, mais pas
Vercel ni la base — la moitié du projet restait à brancher à la main, donc la corvée
survivait. La récolte couvre désormais :

1. **les `.env` des projets** — clé reconnue par sa valeur ET par le nom de sa variable ;
2. **les sessions des CLI et les clés de la trame** — `com.vercel.cli/auth.json`,
   `~/.config/trames/neon.env`, `supabase.env`, `github.env` ; l'identité du compte est
   résolue par l'API du fournisseur (`/v2/user`, `/users/me`) et mise en cache 7 jours ;
3. **la saisie à la main** — `trousseau.py ajouter <service> <libellé> VAR=valeur …`, pour
   ce qu'aucune API ne donne. La valeur n'est ni affichée ni journalisée.

`brancherComptes` (type de demande `comptes`) pose un compte sur un projet **existant**
depuis sa fiche du parc : c'est le cas d'usage le plus fréquent, une clé manque toujours
au milieu d'une session. L'injection n'écrase jamais une variable déjà là.


## Les deux pièges qui ont coûté une soirée (04/09/2026)

**Une liste d'action qui exclut ce sur quoi elle agit.** L'écran « Adopter la trame » ne
listait que les dossiers ayant `CLAUDE.md` ou `.trame.json` — ceux qui ont DÉJÀ la trame.
Le filtre venait de « lister les projets de la trame » et avait été réutilisé tel quel pour
« proposer l'adoption ». Quand une liste sert à deux usages opposés (ce qui est fait / ce
qui reste à faire), relire sa condition pour CHACUN.

**Deux URL, un seul Mac.** L'écouteur interrogeait `lanceur-usine.vercel.app`, resté figé
sur un déploiement de quatre jours, pendant que `vercel --prod` publiait sur
`lanceur-three.vercel.app`. Les nouvelles actions de l'API répondaient « action inconnue »
et le trousseau ne se publiait jamais. Après tout déploiement, vérifier que **l'URL
configurée dans `~/.config/trames/lanceur.env` sert bien le déploiement courant** — un
alias Vercel pointé à la main ne suit pas les mises en production.

`trames.sh cle github <PAT>` complète `neon` et `supabase` : c'est le dernier accès que le
trousseau ne peut pas récolter seul (la CLI `gh` n'est pas installée sur cette machine).
