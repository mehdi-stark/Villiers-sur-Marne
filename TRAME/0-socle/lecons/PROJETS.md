
- **osascript « tell application Terminal » BLOQUE depuis launchd** (pas d'autorisation
  Automation dans ce contexte) : l'écouteur mobile est resté suspendu. Ouvrir Terminal
  par `open -a Terminal fichier.command` (aucun Apple Event) — 30/08/2026.
- **Un `.command` lancé par Terminal depuis launchd n'a pas le PATH utilisateur** :
  `claude` introuvable, fenêtre fermée, aucun signal. Toujours un chemin absolu ET une
  preuve d'exécution (pid) vérifiée par l'appelant — « pas d'erreur » ≠ « ça a marché ».
- **`python3 - <<'EOF'` prend le heredoc comme STDIN** : `json.load(sys.stdin)` lit
  alors le script lui-même, pas le pipe — le dépôt échouait en silence. Script python
  dans un FICHIER dès qu'il doit lire stdin. Corollaire : ne jamais marquer une tâche
  « remise » avant la confirmation de son exécution réelle (le Lanceur confirme
  maintenant par les ids réellement déposés) — 31/08/2026.
- **Un juge IA sans barème ancré ne peut pas dire oui** : 56 notes émises, aucune au-dessus
  de 42, pour un seuil de feu vert à 55 — zéro feu vert en 14 dossiers, ce qui passait pour
  de la rigueur. Donner cinq paliers avec leur signification, PUIS recalibrer les seuils
  dessus (sans quoi le juge passe de « refuse tout » à « n'élimine rien »), PUIS mesurer le
  pouvoir discriminant par script — 01/09/2026.
- **Une chaîne s'arrête au premier maillon qui exige un clic humain** : 99 entrées en
  attente en amont, zéro devant le juge, un cron qui tournait chaque heure pour écrire
  « rien à analyser ». Franchir les maillons intermédiaires par le CODE avec un seuil
  explicite ; garder l'humain là où il engage l'argent — 01/09/2026.
- **Vérifier depuis là où l'outil TOURNE** : un tableau de contrôle qui lisait le disque
  local rendait « inconnu » sur l'hébergeur, précisément là où la question se pose. Faire
  remonter la preuve en base au moment où l'artefact est produit — et tester les URL
  plutôt que d'écrire « à re-tester avant soumission » — 01/09/2026.
- **Un chemin relatif se résout AU MOMENT OÙ ON LE REÇOIT** : `adopter.sh .` faisait
  `basename .` → « . » → nom de projet vide → le glob `AUDIT_TRAME_**.md` attrapait
  l'audit d'un AUTRE projet (l'usine mobile a reçu celui de CartCall). Corollaire :
  un nom vide ne doit jamais produire un glob qui attrape tout — sans nom exploitable,
  générer plutôt que recopier — 01/09/2026.
- **Un référentiel de parc ne se remplit pas à la main** : scanner ce qui est
  détectable (stack, services par NOMS de variables, base, dépôt, domaines des
  comptes), n'annoter que l'indevinable (propriétaire, statut). Sources d'autorité :
  les comptes des plateformes pour la propriété, RDAP pour le registrar — jamais
  les README (bibliographie) ni le DNS (un domaine payé peut ne pas résoudre) — 02/09/2026.
- **CLI Vercel : tableaux sur stderr** (`vercel domains ls | …` est vide sans `2>&1`).
- **RDAP depuis un serveur : 403** (IP de datacenter filtrées) — résoudre depuis une machine résidentielle.
- **Une tâche de fond a saturé la machine de son propriétaire** : un agent launchd toutes
  les 30 s, chaque tour forkant un scan complet (git + python + CLI par projet), plus des
  navigateurs de test résiduels → limite de processus atteinte, plus AUCUN shell ne pouvait
  forker (même `:` échouait) ; deux sessions d'agents bloquées d'un coup. Trois règles pour
  toute tâche périodique locale : **verrou** (une seule exécution à la fois, verrou orphelin
  expiré), **intervalle proportionné au coût** (un état qui bouge à la journée ne se scanne
  pas toutes les 10 min) et **priorité basse** (`Nice`, `LowPriorityIO`). Corollaire : ne
  jamais laisser un test lancer des navigateurs sans les fermer dans un `finally` —
  02/09/2026.
- **Un scan partiel ne doit jamais effacer ce qui est établi** : un appel d'API qui
  échoue une fois (ici `urllib` sur ce Python : « unsupported hash type blake2s »)
  republiait un inventaire sans le compte Vercel — le référentiel « oubliait » un
  compte pourtant connu. Deux règles : publier par FUSION (l'entrée d'un service
  absent du nouveau scan est conservée, datée), et faire les appels réseau avec
  l'outil déjà éprouvé du projet (curl) plutôt qu'une pile fragile — 02/09/2026.
- **Un domaine peut être à nous sans figurer chez aucun hébergeur** : croscel.com
  (IONOS, rattaché à une boutique Shopify) manquait au référentiel, qui n'interrogeait
  que les comptes Vercel/Netlify. Une adresse e-mail dans la CONFIG d'un projet
  (`contact@croscel.com`) trahit un domaine possédé aussi sûrement qu'une URL —
  en excluant les fournisseurs (gmail, outlook…). Corollaire : croiser plusieurs
  sources avant de conclure « je n'ai que deux domaines » — 02/09/2026.
- **Avant tout `Write`, regarder si le fichier existe ; avant tout plan, grep l'existant** : un
  module d'audit photo livré a été écrasé par un nouveau fichier du même nom (restauré par git),
  et un plan de chantier a réinventé une matrice déjà codée. « État de l'art vérifié » commence
  par `grep -rl <domaine> src docs` dans le projet lui-même — 03/09/2026.
- **Un quota offert est une ressource FINIE partagée entre projets** : 100 images d'édition
  gratuites vidées sur la première boutique = zéro pour les suivantes. Le code tient le compte
  en base (global + par projet), n'incrémente qu'après une sortie RÉELLEMENT produite, et
  s'arrête proprement au plafond (alerte, repli sur la source). Corollaire vérifié le même
  jour : un modèle « image-to-image » se juge sur une photo réelle ET par un QA comparatif —
  FLUX.2 klein sur Workers AI a ignoré la photo d'entrée (objet inventé), Qwen-Image-Edit l'a
  respectée sur une photo sans texte et a déformé les chiffres d'un collage — 03/09/2026.
