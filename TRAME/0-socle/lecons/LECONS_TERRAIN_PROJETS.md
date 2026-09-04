# Leçons de terrain — synthèse transverse des projets (2026)

> Capitalisation du 30/08/2026 sur les mémoires et registres de TOUS les projets
> locaux : DelivUp, CartCall AI, Aramco SLS, Une Chance (muslimcitadel), Tarlim,
> TrustVibe, usine apps mobiles, usine apps Shopify, usine ecom. Chaque règle a
> été payée au moins une fois. À relire au jour 1 de tout projet — puis
> `amelioration-continue` à chaque session.

## ⭐ Les 10 à ne jamais oublier (extrait — relire à CHAQUE session)
1. 🔴 Un push n'est jamais une mise en ligne : vérifier READY. (12)
2. 🔴 Migration appliquée AVANT le code qui s'en sert ; l'agent l'applique lui-même. (15)
3. 🔴 Quotas connus avant qu'ils mordent ; pousser en lot ; jobs longs hors serverless. (13)
4. 🔴 L'IA ne décide jamais d'une donnée métier ; l'argent a un gate humain. (24)
5. 🔴 Un « Fait » coché n'est pas vérifié ; chercher les instances sœurs du défaut. (3)
6. 🔴 Tester le VRAI chemin avec de vraies valeurs ; la capture prouve. (4)
7. 🟠 Challenger avant de construire, y compris son propre code ; construire l'évident. (1)
8. 🟠 Calibrer un seuil par la donnée, jamais par le prompt. (25)
9. 🟠 Marché prouvé + amélioration réelle + tête de pont — jamais un clone moins cher. (30)
10. 🟠 Finition avant livraison ; le bon contenu au bon écran ; jamais de sonde en boucle sur la prod. (8, 10, 20)

Gravité : 🔴 bloquant (prod, argent, sécurité) · 🟠 important (qualité, méthode) · 🟢 confort.

## A. Méthode de travail avec l'agent
1. **Challenger avant de construire, à chaque itération** — y compris son propre
   code de la veille ; simuler le premier usage ; construire l'évident dans la
   même livraison (DelivUp, CartCall, usine mobile).
2. **Analyser les commits et le schéma AVANT tout chantier** (`git pull --rebase`,
   lire la zone visée, vérifier que le besoin existe encore) ; re-pull avant push
   (DelivUp, équipe multi-dev).
3. **Un « Fait » coché n'est pas un état vérifié** : re-vérifier, et chercher les
   instances sœurs du même défaut sur tout le code — un fix appliqué à une route
   manque souvent sa jumelle (Aramco SLS : 32 items « faits », plusieurs faux).
4. **Tester le VRAI chemin, avec de vraies valeurs** : un test qui n'emprunte pas
   le mécanisme réel donne un faux vert ; plusieurs bugs de production n'ont été
   trouvés qu'en EXÉCUTANT le flux de bout en bout (SLS, Une Chance).
5. **Le document le plus récent fait foi** en cas de conflit entre briefs — appliquer
   en signalant l'écart, ne demander que si le récent est ambigu (DelivUp).
6. **Un brief externe se challenge aussi** (SQL/architecture d'un tiers) : adapter à
   l'architecture réelle en expliquant l'écart, jamais implémenter aveuglément.
7. **Livrables dans le repo ou le back-office du projet**, jamais sur un hébergement
   externe (règle constante sur tous les projets).
8. **Finition avant livraison** : libellés humains, boutons disabled sans prérequis,
   mobile/iPhone réel, fuseau explicite, charte — un détail brut discrédite tout
   (DelivUp, critique frontale 18/07).
9. **Ne pas cacher une capacité derrière un « mode simplifié »** : masquer un choix
   de production est indistinguable d'un bug (DelivUp, ⚙ catégorie).
10. **UI = modèle mental de l'utilisateur**, jamais les concepts internes ; le bon
    contenu au bon écran (coûts/marge = admin seulement, jamais côté client)
    (DelivUp, CartCall).
11. **Consolider périodiquement** : reformuler avant de coder, un seul chantier
    après un retour d'incompréhension, relecture des données réelles avant commit.
11bis. **Le cadrage et le backlog se font DEPUIS le back-office** — donc le
    squelette du cockpit vient AVANT le cadrage, même quand l'app n'est pas
    encore certaine. Payé sur `ville` (04/09/2026) : un cadrage de 200 lignes en
    markdown avec sept décisions « à trancher » remis à un opérateur qui lit sur
    son téléphone = une session qui pend (voir 54). L'écran de validation n'est
    pas un fichier : c'est `/pilotage/cadrage` avec un bouton par option et une
    table `decisions` que l'agent relit. Recette `COCKPIT_SQUELETTE.md`.

## B. Déploiement, infra, sécurité
12. **Un push n'est jamais une mise en ligne** : vérifier READY ; 19 déploiements
    morts en silence ont figé une app un jour (DelivUp).
12bis. **READY n'est pas l'URL servie** : un alias posé à la main (`lanceur-usine`)
    reste sur l'ancien déploiement quand la CLI en publie un nouveau — la nouvelle
    route répondait 404 alors que le déploiement était READY. `vercel alias set`
    après chaque déploiement, et le test E2E vise l'URL consommée par les clients,
    jamais l'URL du déploiement (`ville` ↔ Lanceur, 04/09/2026).
13. **Quotas connus AVANT qu'ils mordent** : Vercel Hobby = 100 déploiements/jour
    (les annulés comptent), 4 h CPU/mois, 300 s/fonction → pousser EN LOT, un
    push par lot vérifié ; ne jamais re-proposer l'upgrade quand la décision est
    prise (CartCall : prod figée 24 h ; ecom : jobs tués).
14. **Capturer le CODE DE SORTIE du script de vérification** (`; echo $?`), jamais
    le piper vers grep — un pipe renvoie 0 même si tsc échoue (CartCall).
15. **Migration appliquée AVANT le code qui s'en sert** ; selects explicites sur
    les tables récemment migrées ; l'agent applique lui-même les migrations avec
    les env fournies, jamais « demander à l'opérateur de pousser » (DelivUp
    03/08 : /visuels 500 pendant 25 min).
16. **Sécurité base par script idempotent rejoué** (RLS deny-all, buckets privés)
    chaîné à chaque migration — jamais à la main (Une Chance).
17. **Config sensible côté serveur, jamais en constante frontend** (types de
    fichiers autorisés, rôles, quotas) ; un rôle se vérifie, pas seulement une
    session (SLS : escalade par substring, endpoints sans auth).
18. **Secrets de session déterministes et partagés** entre middleware Edge et
    Node — sinon boucle de login sans erreur 500 (CartCall).
19. **Deux apps déployées séparément restent découplées** même en monorepo ; toute
    modification traversante s'annonce (quoi, impacts, risque) avant d'agir
    (DelivUp).
20. **Jamais de sondes en boucle contre la prod** ; reproduire en local, une
    vérification à la fois ; réglages hébergeur avec accord (usine apps Shopify).
21. **Ne jamais créer/modifier quoi que ce soit sur l'infra d'un AUTRE projet ou
    d'un associé** (instance n8n partagée, base d'un autre projet dans un .env) —
    isoler strictement (CartCall, usine mobile).
22. **Commits signés avec l'auteur attendu** : un autre auteur bloque le
    déploiement (usine mobile, deploy BLOCKED).
23. **Le surveillant ne partage jamais le chemin des surveillés** (crons muets 16
    jours) : heartbeat en base + « silencieux > 2× la cadence = panne ».

## C. Produit, IA, décisions
24. **L'IA ne décide jamais d'une donnée métier** (statut, match, montant, prix) :
    le code calcule, l'humain tranche ce qui engage ; toute sortie IA vue par un
    client passe par QA + gate OU repli factuel par code (constante).
25. **Calibrer par la donnée** : un seuil se juge sur son pouvoir prédictif mesuré
    (score ≥ 70 sans valeur ; le signal factuel `invented_items` à 31 % de
    précision vs 3 % de base) — ne jamais assouplir ni raisonner sur le prompt
    (DelivUp).
25bis. **Faire noter par une IA : ANCRER L'ÉCHELLE, puis mesurer si elle
    SÉPARE.** Sans barème explicite (« que vaut 20, 50, 80 ? »), un modèle se
    réfugie dans la moyenne basse : 56 notes émises, aucune > 42, pour un seuil
    de feu vert à 55 — le verdict était arithmétiquement décidé d'avance, et
    zéro feu vert en 14 dossiers passait pour de la rigueur. Un correcteur sans
    barème note bas, comme un humain. Deux corollaires payés le même jour :
    réancrer l'échelle SANS recalibrer les seuils déplace le défaut (le juge est
    alors passé à 0 refus) ; et ce qu'on surveille n'est pas la sévérité mais le
    POUVOIR DISCRIMINANT — un juge qui refuse tout et un juge qui accepte tout
    ne trient ni l'un ni l'autre. Versionner la calibration dans chaque verdict,
    et pouvoir rejouer le seul CALCUL quand un seuil change (les notes, elles,
    n'ont pas bougé) (usine mobile, 01/09/2026).
26. **Fonctionnalités LLM robustes** : modèle par environnement, déterministe +
    LLM-juge, jamais silencieux, coût maîtrisé (CartCall).
27. **Notifications = événements rares** : jamais un e-mail par commission (« 300
    commissions = 299 mails pour rien ») ; seuils, digests conditionnels ; un
    signal humain (guru dormant) ne se templatise pas (CartCall).
28. **Actions automatisées = taxonomie fermée** ; pouvoirs revalidés en base ;
    autonomie gagnée sur mesures J+7, jamais sur confiance (usine ecom, Une Chance).
29. **Sur iOS, ne jamais promettre « corrigé » sans test sur l'appareil réel** ;
    un texte de référence (Coran) ne se corrige jamais « à l'œil » — la police se
    patche, le texte reste authentique (Une Chance).

## D. Marché et rentabilité
30. **Thèse de marché : prouvé + amélioration réelle + beachhead** — jamais un
    clone moins cher ; un incumbent fort n'est pas un kill automatique si la
    tête de pont (produit, tendance, géo) est réelle (usine apps Shopify).
31. **Le wedge est sacré** : chaque écart se justifie contre les plaintes MINÉES
    des concurrents (PromptLandia vs codeSpark) ; pas de dark pattern, jamais.
32. **Positionnement par ce qu'on ne fait pas** : détecter et informer, laisser le
    marchand résoudre ; intégrations plutôt que tout faire (CartCall SAV).
33. **Le registre culturel du marché prime sur la conversion** : le voicemail
    commercial est « trop forcé » en FR/EU — abandonné, ne pas re-proposer.
34. **Marketing factuel, forme ambitieuse** : la qualité perçue vend ; survendre
    = mentir, pas marketer (usine apps Shopify).
35. **Un service communautaire n'est pas un business** : offre unique assumée,
    prioriser confiance/confidentialité/maintenabilité sur le revenu quand c'est
    la mission (Une Chance) — l'exigence de qualité reste la même.
36. **Rentabilité = marge nette par vente encaissée**, taxes de transaction,
    retours et SAV inclus ; re-jouer le stock à chaque changement de modèle ;
    purger les non-viables ; prix plausibles ; CAC/CPC à côté de la marge ;
    doctrine commerce dans l'absolu (usine ecom).
37. **North star = le 1-clic** : tout ce qui rapproche du lancement autonome
    passe avant ; la première boutique/app est le terrain d'apprentissage dont
    chaque manque devient une capacité codée (usines).
38. **Faire PERCER plutôt que maximiser le MRR** (loi de puissance des stores :
    top 5 % ≈ 400× le bas) : multiplier les tickets à coût marginal ≈ 0, tuer
    vite, doubler sur ce qui prend — chaque app garde son seuil de rentabilité
    (usine mobile, doctrine portefeuille).
39. **« Mieux pour moins cher » avec 3 garde-fous** : le prix bas ne crée pas la
    distribution ; le « mieux » est le moat, le prix l'accélérateur ; moins cher
    ≠ gratuit total (paywall honnête convertit ~5× mieux qu'un freemium flou).
40. **Mesurer la FORME du moat (part leader + HHI)**, pas sa taille ; chaque
    nouveau produit repart à zéro avis → tête de pont identifiée AVANT le build
    (usine apps Shopify).
41. **Les règles de plateforme se durcissent** (Apple 4.3(b) juin 2026 : retrait
    rétroactif ; Play : 12 testeurs/14 j pour les comptes personnels) : vérifier
    à date, protéger le COMPTE avant l'app (jamais de gimmick parmi les premières
    publications).

41bis. **B2G : les prix réels sont dans les DECP** (data.economie.gouv.fr,
    `decp-v3-marches-valides`) — montant HT, durée, SIRET du titulaire en une
    requête ; les sites éditeurs ne publient rien et les stores n'ont pas d'avis
    exploitables. Et **un verdict calculé ne s'adoucit pas à la main** : 65/100
    dégradé à NO-GO par une faille haute non parée — la parade se CODE
    (`paree: true` quand elle est signée) et le calcul se rejoue (`ville`, 04/09/2026).

41ter. **Un jeton passé sans guillemets finit dans un message d'erreur** : `T="--token X"`
    puis `vercel … $T` (zsh ne découpe pas) → « unknown option: --token vcp_… » affiché
    en clair, donc transité par le chat, donc à révoquer. Toujours `--token "$VAR"`,
    et masquer la sortie (`sed "s/$VAR/***/g"`) avant de la lire (`ville`, 04/09/2026).

41quater. **Une adresse d'équipe n'est pas une adresse personnelle** : `ville` a embarqué
    `admin@delivup.io` (whitelist, seed, VAPID) parce que c'était l'adresse de la session.
    Règle Mehdi : `admin@delivup.io` = Delivup (équipe) seulement ; tout projet personnel
    = `mehdi.stark@gmail.com`. Contrôle : `git grep admin@delivup.io` vide (04/09/2026).

65. **Propre n'est pas beau** : trois apps responsives, sans débordement, en jetons —
    et « affreuses » (Mehdi, `ville`, 04/09/2026). Il manquait la DIRECTION : références
    réelles, maquette validée avant le code, système de design partagé, navigation par
    registre (onglets bas en grand public), identité et mouvement, et une note /5 par
    écran. Recette `DIRECTION_ARTISTIQUE.md` ; étape 4bis du prompt de démarrage.

## E. Chaînes, contrôles et instruments (usine mobile, 09/2026)
42. **Une chaîne qui exige un clic humain à un maillon s'ARRÊTE à ce maillon** :
    99 entrées en attente en amont, zéro en aval, un cron qui tournait chaque
    heure pour écrire « rien à faire » — pendant des jours, sans que rien ne le
    signale. On ne fait jamais un geste quatre-vingt-dix-neuf fois. Tout maillon
    intermédiaire se franchit par le CODE avec un seuil explicite ; l'humain
    reste là où il engage l'ARGENT, pas là où il transporte des données.
43. **Un script qui annonce le succès sans le CONSTATER ment** — « franchi »
    écrit quatre fois de suite sur un écran immobile. Constater l'EFFET (l'écran
    a changé, le champ contient la valeur), jamais l'action. Et ÉCHOUER plutôt
    que livrer : le même script a produit une capture au champ vide après avoir
    signalé trois échecs, image qui serait partie sur une fiche de store.
44. **Un tableau de contrôle qui se DÉFAUSSE ne contrôle rien** : « inconnu »
    parce qu'il lisait un disque absent de l'hébergeur, « à re-tester
    toi-même » sur des URL testables en trois requêtes. Vérifier DEPUIS LÀ OÙ
    L'OUTIL TOURNE. Ce que la machine peut prouver, elle le prouve ; le reste
    est marqué non vérifié, jamais supposé bon — un tableau vert obtenu par
    optimisme est pire qu'aucun tableau, c'est celui qu'on croit.
45. **L'INSTRUMENT de mesure est suspect au même titre que ce qu'il mesure** :
    un garde-fou qui alerte sur le mauvais proxy (amplitude au lieu de la
    répartition), un banc qui compte des liens de texte comme cibles tactiles et
    crie « 114 » là où il y en a trois, un `uiautomator` qui restitue la fenêtre
    du clavier au lieu de l'app. Corriger l'indicateur — jamais le faire taire —
    et seulement quand une mesure INDÉPENDANTE le contredit. Un instrument qui
    crie au loup, on cesse de l'écouter.
46. **Un geste manuel dans un workflow produit un artefact qui ne se refait
    jamais** : des captures de store à douze jours de retard parce qu'un script
    disait « changer la langue à la main ». Si le sélecteur existe dans le
    produit, le script le pilote — en s'accrochant aux libellés que le produit
    ne traduit PAS.
47. **Un VERDICT n'est pas une CONSIGNE** : « PIVOT 33 % » dit où en est un
    dossier, jamais ce qu'on en fait. Dériver PAR CODE le geste qui suit en
    nommant ce qui bloque, et dire explicitement quand il n'y a RIEN à faire —
    sinon on rouvre dix fois un dossier clos. Corollaire : un compteur qui
    GONFLE la charge (13 « à trancher » dont 10 déjà refusés) finit ignoré, et
    c'est alors le vrai travail qu'on rate.
48. **Le silence doit valoir « rien à signaler »** dans un cockpit : une section
    sans rien à dire ne s'affiche pas. 98 entrées non triées en cartes pleines
    faisaient 35 écrans de téléphone ; 50 lignes toutes « conformes » n'en
    apprenaient aucune. Mesuré après refonte : accueil 6,1 → 1,2 écran.
49. **Une maintenance ne prend pas le verrou de la PRODUCTION**, et ce qui n'est
    pas périodique n'a pas de cadence attendue — sinon le surveillant le déclare
    muet dès le lendemain. Une fausse alerte de plus est une vraie alerte de
    moins.
50. **Chercher `rgba(255,255,255` après tout changement de thème** : un bouton
    hérité d'une maquette sombre devient invisible en clair. Ce n'est pas
    cosmétique — un bouton « copier » invisible, c'est une valeur retapée à la
    main, et une dénomination légale saisie de travers dans le formulaire qui
    commande toute la chaîne du store.
51. **Un champ borné arbitrairement décide du travail à sa place** : le Lanceur
    plafonnait « l'idée » d'un nouveau projet à 400 caractères sur deux lignes.
    Rien ne l'exigeait (la colonne est du JSONB) — mais la conséquence, elle,
    était réelle : on ne pouvait plus décrire un projet, seulement le nommer, et
    la session partait cadrer sur une phrase. Avant de poser une limite,
    demander ce qu'elle protège : si la réponse est « rien », c'est une décision
    de produit déguisée en réglage.
52. **Un texte libre ne voyage pas dans une ligne** : cette même idée traversait
    la chaîne en TSV (`read -r`, retours à la ligne écrasés) puis était injectée
    par `sed` — donc cassable par un `#`, un `/` ou un `&`. Dès qu'un champ est
    du texte saisi par un humain, il s'écrit dans un FICHIER et seul son chemin
    circule ; la substitution se fait par un programme qui sait échapper (ici
    Python), jamais par `sed`.
53. **La tabulation est un blanc d'IFS — donc un mauvais séparateur** : `IFS=$'\t'
    read -r a b c` FUSIONNE deux tabulations consécutives, si bien qu'un champ
    vide décale silencieusement tous les suivants (un profil vide devenait le
    mode, le mode devenait un chemin). Dès qu'un champ peut être vide, séparer
    par un caractère non blanc — US (`\x1f`) — et le vérifier sur une ligne à
    trous, pas seulement sur une ligne pleine.
54. **Un « stop » sans écran de validation, c'est une session qui pend** : un
    mode « cadrer d'abord, coder après » n'existe que s'il est complet — la
    session écrit son verdict dans un fichier remonté (`.claude-resume.txt`),
    l'opérateur le lit sur son téléphone, et UN bouton relance la suite. Un
    prompt qui dit « ⏸ STOP : je valide » à quelqu'un qui ne lit pas le terminal
    n'est pas un point de validation : c'est une session bloquée. Corollaire :
    ne jamais laisser cohabiter dans un même prompt une consigne d'attente et
    une consigne d'enchaînement — un prompt qui se contredit attend pour rien.
55. **Un `<textarea>` renvoie des CRLF, pas des LF** : la norme HTML impose
    `\r\n` à la soumission. Mesuré le 03/09 : 179 caractères stockés pour 176
    saisis, soit un `\r` invisible par ligne — qui traverse la base et finit
    dans le fichier de prompt déposé sur la machine. Tout texte multi-ligne
    venant d'un formulaire se normalise à l'écriture (`replace(/\r\n?/g, "\n")`),
    une fois, dans la fonction qui écrit — jamais à l'affichage.
56. **`-webkit-line-clamp` ne coupe rien sur un `<button>`** (ni sur les autres
    contrôles de formulaire) : le contrôle enveloppe son contenu dans une boîte
    anonyme, et la troncature s'applique à une boîte qui n'est pas celle du
    texte — on voyait une troisième ligne tranchée en deux. Le clamp se pose
    sur un `<span>` intérieur. Règle générale : toute propriété qui dépend du
    modèle de boîte (`display`, `line-clamp`, `overflow`) se pose sur un
    élément qu'on contrôle entièrement, pas sur un contrôle natif.
57. **Un « à renseigner » sans cause déplace le travail** : afficher qu'un
    compte est inconnu ne sert à rien si l'écran ne dit pas POURQUOI il l'est,
    ce qui le rendrait automatique (la commande exacte), et ne permet pas de le
    poser sur-le-champ. Trois choses ensemble, ou rien : la cause, la dette
    d'automatisation nommée, et le champ de saisie — sinon la case reste vide
    six mois et le référentiel ment par omission. Corollaire de saisie : ce qui
    se note se note UNE FOIS PAR COMPTE et se propage par jointure ; le noter
    par projet, c'est le noter cinquante fois puis ne plus le noter du tout.
58. **Un message d'erreur de fournisseur contient des morceaux de clé** : au
    premier essai réel du résolveur de comptes, ce qui partait vers la base
    disait « Invalid API Key provided: sk_test_************ » et
    « Incorrect API key provided: sk-d9fe1***********a ». Masqué par le
    fournisseur ne veut pas dire anodin : un préfixe trahit le service, une
    longueur trahit le format, et une base n'a pas à contenir de fragment de
    secret. Tout message d'API qu'on republie passe par un filtre, ou ne se
    republie pas — on garde la CAUSE, jamais la citation.
59. **Un motif de reconnaissance trop large invente des pannes** : « 32
    caractères hexadécimaux » décrit un jeton Twilio — et aussi une clé VAPID,
    un secret de session, un identifiant. Trois faux « compte à renseigner » en
    une passe, sur des projets parfaitement sains. Un signal ambigu ne se
    retient que CORROBORÉ (ici : le SID `AC…` dans le même fichier), et les
    motifs se rangent du plus spécifique au plus général (`sk-ant-` avant
    `sk-`, sinon une clé Anthropic part se faire refuser chez OpenAI).
60. **Un service, ce n'est pas un compte** : deux clés Resend dans deux projets
    = deux comptes. Un référentiel qui range les comptes par SERVICE affiche à
    un projet le compte de son voisin. Ce n'est pas une approximation, c'est
    l'erreur qui fait résilier le mauvais abonnement. Ce qui est résolu par la
    clé D'UN projet s'attribue à CE projet ; l'agrégat par service ne sert que
    la page d'inventaire.
61. **Ne jamais taire une information qu'on possède parce qu'un autre capteur
    l'a manquée** : le compte Stripe d'un projet était résolu par sa clé, mais
    n'apparaissait pas sur sa fiche — le scanner de noms de variables, lui, ne
    lisait pas `.env.production.local`. Deux capteurs qui se contredisent :
    celui qui TROUVE fait foi. On affiche ce qu'on sait, et on répare l'autre
    capteur dans la même session.
62. **Une exception de gravité voyage AVEC la donnée, elle ne se re-déduit pas
    à chaque étage** : le résolveur savait distinguer « clé refusée par le
    fournisseur » (une panne) de « service pas encore branché » (un trou de
    référentiel) — mais deux étages plus loin, un filtre « ce service est déjà
    résolu, donc rien à signaler » supprimait les cinq pannes réelles. La même
    règle erronée était écrite deux fois, dans deux langages, à deux endroits.
    Quand un enregistrement porte une gravité, tout filtre en aval doit la
    lire ; et une règle de filtrage qui existe en double finira par diverger.
63. **Exiger une forme d'identité, c'est perdre l'identité** : « compte connu »
    était défini comme « on a un e-mail ». Or Supabase n'expose que
    l'organisation, Resend que les domaines vérifiés. Résultat : des comptes
    parfaitement identifiés s'affichaient « à renseigner », et le travail
    retombait sur l'opérateur pour rien. Ce qui compte est de pouvoir DÉSIGNER
    le compte — e-mail, organisation, identifiant public, dans cet ordre de
    préférence, jamais en condition.
64. **Un jugement rendu sur des données partielles accuse le sain** : « aucun
    projet vivant » s'est affiché sur 13 comptes parce que les projets qui s'en
    servent n'avaient pas de statut — pas parce qu'ils étaient morts. Un verdict
    ne se rend que si TOUTES les pièces sont là ; sinon l'écran dit ce qui
    manque pour juger, et propose le geste qui le complète. Un avertissement qui
    se trompe une fois est un avertissement qu'on n'ouvrira plus.
65. **Le préfixe d'une valeur n'identifie pas son émetteur** : `sk_test_…` est
    le format de Stripe ET de Clerk ; `sk-…` celui d'OpenAI ET de DeepSeek.
    Trois des cinq « clés mortes » annoncées un jour plus tôt étaient en fait
    des clés parfaitement valides d'un AUTRE fournisseur, envoyées se faire
    refuser chez le mauvais — et le compte affiché sur la fiche du projet était
    faux. Une reconnaissance par la valeur se corrobore par le NOM de la
    variable (`STRIPE` pour Stripe, `DEEPSEEK` pour DeepSeek) : deux indices
    concordants, ou rien. Corollaire : une alerte émise sur une détection non
    corroborée coûte plus cher que l'absence d'alerte, parce qu'elle a été crue.
66. **Un composant client ne doit importer que du pur** : un fichier partagé
    entre le rendu serveur et un composant `"use client"` a tiré le pilote
    Postgres dans le paquet du navigateur. Le build a cassé — bruyamment, donc
    bien. Séparer dès le premier partage : les types et les fonctions sans
    effet d'un côté, tout ce qui touche la base ou un secret de l'autre.
67. **Un secret ne se protège pas par une promesse, mais par une porte
    étroite** : « l'index ne contient pas les clés » n'est vrai que le jour où
    on l'écrit. La publication ne recopie donc pas l'objet reçu, elle le
    RECONSTRUIT champ par champ, et le champ qui liste les variables n'accepte
    que des NOMS (`[A-Z0-9_]{2,60}`) — une valeur ne peut pas passer, même si
    un refactor futur l'y met. Une garde codée survit à l'intention.
68. **Un trousseau n'est utile que s'il couvre les TROIS gisements** : les clés
    des projets (`.env`), les sessions des CLI (`~/Library/Application
    Support/com.vercel.cli/auth.json`, les clés de la trame) et le reste, saisi
    une fois à la main. La première version ne lisait que les `.env` : on
    pouvait choisir Stripe et Resend au moment de créer un projet, mais pas
    Vercel ni la base — donc la moitié du projet restait à brancher à la main,
    et le geste qu'on voulait supprimer survivait. Un outil qui supprime 60 %
    d'une corvée ne la supprime pas : on la fait encore.
69. **Une liste d'action qui exclut par construction ce sur quoi elle agit** :
    l'écran « Adopter la trame » ne listait que les dossiers possédant déjà
    `CLAUDE.md` ou `.trame.json` — c'est-à-dire ceux qui ont DÉJÀ la trame. 32
    projets sur 39 étaient invisibles, et le bouton n'apparaissait que là où il
    ne servait à rien. Le filtre avait été écrit pour « lister les projets de la
    trame » puis réutilisé pour « proposer l'adoption », sans que personne
    relise sa condition. Quand une liste sert à DEUX usages opposés (ce qui est
    déjà fait / ce qui reste à faire), son filtre doit être relu pour chacun.
70. **Tout type accepté par l'interface doit l'être par l'exécutant** : le
    Lanceur acceptait un nouveau type de demande que le script du Mac ne
    connaissait pas ; la demande était enregistrée, affichée, puis jetée en
    silence. Une liste blanche dupliquée des deux côtés d'une file est un
    piège : elle doit être vérifiée par un test qui les compare, ou dérivée
    d'une source unique.

## Un détecteur aveugle est pire que pas de détecteur (04/09/2026)

`capturer.mjs` comparait `document.documentElement.scrollWidth > window.innerWidth`.
En simulation mobile, le navigateur DÉZOOME pour faire tenir le contenu :
`innerWidth` devient la largeur du CONTENU (1200), pas celle de l'écran (390).
La comparaison était donc TOUJOURS fausse à 390 px.

Mesuré : une table de 1200 px dans un écran de 390 px n'était pas signalée.
La bonne mesure est `clientWidth` — le viewport de MISE EN PAGE, qui reste à 390.

Ce que ça coûtait : des mois de « aucun débordement horizontal » rassurants,
sur lesquels plusieurs projets se sont appuyés pour déclarer le responsive
prouvé. Un outil de vérification qui ne trouve jamais rien ne rassure pas :
il ANESTHÉSIE. Le bug était dans la trame, donc dans tous les projets adoptants.

**Règle** : tout détecteur se valide d'abord sur un cas qui doit ÉCHOUER.
Un vert n'a de valeur que si l'on a vu l'outil produire un rouge. Vaut pour les
tests, les linters, les alertes et les sondes de supervision.
71. **Un garde-fou se vérifie en lui donnant une vraie panne à attraper** : le
    contrôle « aucune clé dans l'index publié » exigeait 12 caractères
    ALPHANUMÉRIQUES juste après le préfixe — or une vraie clé porte un `_` très
    tôt (`sk_live_51Q…`, `sk_test_****`). Il ne pouvait donc matcher AUCUNE clé
    réelle et rendait « propre » à tous les coups. Il avait servi trois fois
    dans la journée à affirmer qu'aucun secret ne fuyait. Un instrument qui ne
    peut pas échouer ne prouve rien : après avoir écrit un contrôle, lui
    soumettre l'incident exact qu'il est censé attraper — et n'y croire que
    lorsqu'il est passé au rouge.
72. **Rassembler les garde-fous derrière une commande unique** (`trames.sh
    controles`) : dispersés, on en lance deux sur cinq et c'est le troisième qui
    aurait parlé. Chacun annonce CE QU'IL PROTÈGE, et un contrôle qui ne peut
    pas s'exécuter s'affiche « sauté » — sauté en silence, il se confond avec un
    contrôle réussi. Les quatre premiers sont nés d'incidents datés : listes
    blanches divergentes, colonnes décalées, secret publié, alias figé.
73. **« Un projet » n'est pas « un package.json »** : sur 71 dossiers de
    `~/code`, 39 seulement étaient vus. Les absents étaient du Flutter
    (`pubspec.yaml`), du Spring (`pom.xml`), du Terraform (`main.tf`), des
    contrats Solidity — et surtout des **dossiers conteneurs** dont les vrais
    projets vivent un niveau plus bas (`ambassy/ambassy-next`,
    `muslimcitadel/2nd_chance`). On cherchait une application qu'aucun écran ne
    montrait, et on finissait par poser la trame à la main. Une détection de
    projet se teste contre le VRAI répertoire de travail, pas contre l'idée
    qu'on s'en fait ; et l'imbrication d'UN niveau suffit (au-delà, on liste des
    dépendances). Après correction : 90 projets, dont 45 imbriqués.
74. **Deux inventaires du même monde doivent partager leur définition** : la
    liste du Lanceur et le scan du parc avaient chacun leur filtre. Un projet vu
    par l'une et pas par l'autre donne un lien qui mène à une fiche inexistante.
    Même table de marques, même profondeur, des deux côtés.
75. **Une liste qui dépasse l'écran a besoin d'INTENTIONS, pas de pagination** :
    89 projets ne se parcourent pas, ils se cherchent. Un champ de filtre (ce
    qu'on fait quand on sait ce qu'on veut), trois vues qui correspondent à trois
    intentions réelles (en cours / sous trame / à adopter) et un plafond de 12
    avec « afficher les N autres ». Numéroter des pages n'aurait fait que
    découper le scroll infini en tranches.
76. **Un déploiement lancé depuis le mauvais dossier ne dit pas qu'il s'est
    trompé** : `vercel --prod` exécuté à la racine du dépôt au lieu du dossier
    de l'app a rendu une URL parfaitement crédible (`lanceur-…vercel.app`) et
    une page qui s'affichait — mais l'action ajoutée dix minutes plus tôt
    répondait « action inconnue ». Le succès apparent d'un déploiement ne prouve
    rien : la vérification est de demander à l'URL DE PRODUCTION quelque chose
    que SEULE la nouvelle version sait faire.
77. **Un mock-up dit l'intention mieux qu'un paragraphe** : décrire une
    interface au clavier depuis un téléphone est perdu d'avance. Le chemin
    inverse du trousseau (le fichier doit ALLER du téléphone à la machine)
    passe forcément par la base — mais il n'y RESTE PAS : le contenu est effacé
    dès qu'il est écrit dans le projet. Une pièce jointe est un colis, pas un
    archivage ; la source de vérité est le dépôt. Deux garde-fous nés du même
    raisonnement : les images sont réduites côté navigateur (1600 px) avant
    l'envoi — une base n'est pas un entrepôt photo — et une pièce déposée puis
    jamais rattachée est purgée à 48 h.
78. **Une pièce jointe ne sert que si le prompt la nomme** : un fichier posé
    dans `docs/mockups/` qu'aucune consigne ne mentionne ne sera pas ouvert. Le
    prompt de démarrage dit qu'elles existent, où elles sont, qu'il faut les
    REGARDER d'abord — et laquelle fait foi en cas de contradiction avec le
    texte. Poser un artefact sans dire qu'il existe, c'est ne pas l'avoir posé.
