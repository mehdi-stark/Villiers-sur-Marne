# Leçons de terrain — usine à apps mobiles (août-septembre 2026)

> Règles GÉNÉRIQUES nées d'incidents réels sur l'usine agentique mobile
> (radar → gate de viabilité → build Expo → stores). À relire au jour 1 de
> tout projet comportant un JUGE AUTOMATIQUE, une CHAÎNE de traitement ou
> un COCKPIT de pilotage. Les leçons spécifiques (Expo, adb, Play Console)
> restent dans le `LECONS.md` du projet.
>
> Chaque règle a été payée. Les dates sont celles de l'incident.

## A. Faire noter par une IA — le piège le plus coûteux

1. **Une échelle de notation sans BARÈME ANCRÉ s'écrase dans la moyenne
   basse.** Incident du 01/09/2026 : un gate de viabilité avait rendu
   **zéro `go` sur quatorze dossiers**, ce qui passait pour de la rigueur.
   Mesure faite sur les 56 notes émises : **aucune ne dépassait 42**, et
   la règle du `go` exigeait 55. Le verdict était **arithmétiquement**
   décidé d'avance. Le modèle n'utilisait que dix valeurs (12, 15, 18, 22,
   25, 28, 32, 35, 38, 42).
   La cause n'était pas la sévérité, c'était l'absence de barème : on
   disait « sois pessimiste, en cas de doute note bas » sans jamais dire
   ce que valait un point. **Un correcteur sans barème se réfugie dans la
   moyenne basse — c'est vrai des humains aussi.**
   → Donner cinq paliers avec leur SIGNIFICATION et un exemple de ce qui
   les mérite. Et dire explicitement : « si rien ne peut jamais dépasser
   45, tu ne classes plus rien ».

2. **Réancrer l'échelle sans recalibrer les seuils DÉPLACE le défaut.**
   Même journée, quelques heures plus tard : l'échelle réparée (notes de
   42 à 72), les anciens seuils rendaient **5 `go` et ZÉRO `kill`** sur
   les mêmes dossiers — dont une app de contenu jetable avec une dimension
   notée 42. Le gate était passé de « refuse tout » à « n'élimine rien ».
   → Les seuils se lisent SUR le barème : un feu vert qui engage des
   semaines exige le palier « solide », pas le palier « moyen ». Après
   correction : 1 `go`, 9 `pivot`, 4 `kill`.

3. **Mesurer le POUVOIR DISCRIMINANT, jamais la sévérité.** Un juge qui
   refuse tout et un juge qui accepte tout sont malades de la même façon :
   ils ne SÉPARENT pas. Le symptôme le plus parlant : sur l'ancienne
   calibration, une app réellement construite obtenait 37 et une idée
   piochée au hasard 33 — **quatre points d'écart entre du travail réel et
   un tirage au sort**.
   → Un script mesure l'instrument (amplitude, écart-type, tranche la plus
   peuplée, part de chaque verdict) et **sort en erreur** quand le juge
   cesse de trier. Sans lui, la panne avait duré quatorze dossiers sans
   que rien ne la signale : on ne regardait que les verdicts, jamais la
   façon dont ils étaient produits.

4. **L'INDICATEUR DE SURVEILLANCE peut lui-même être mal spécifié.** Le
   garde-fou écrit le matin criait l'après-midi sur une « amplitude
   insuffisante » alors que le juge rendait trois catégories bien
   peuplées. L'amplitude brute n'était pas le bon proxy.
   → Le corriger, **jamais le faire taire** — mais seulement quand une
   mesure INDÉPENDANTE le contredit (ici : la répartition des verdicts).
   C'est ce qui distingue une correction d'un enterrement. Ajuster un
   indicateur parce qu'il crie est le réflexe exact qu'un garde-fou existe
   pour empêcher.

5. **Un verdict sans sa CALIBRATION est une note sans son barème.**
   Le juge ne réanalysait jamais (`on conflict do nothing` + une requête
   qui ignorait les dossiers déjà jugés). Le portefeuille accumulait donc
   des verdicts rendus par des versions différentes, présentés côte à côte
   comme comparables.
   → Versionner la calibration DANS chaque dossier, et prévoir de rejouer.
   Corollaire : **changer un SEUIL ne se rejoue pas avec l'IA** — les
   notes sont les mêmes, seule la règle change. Un mode `--recalculer` qui
   rejoue le seul calcul évite une demi-heure d'appels ET le bruit qui
   empêcherait de dire si un verdict a bougé à cause du seuil ou du hasard.

## B. Chaînes automatisées — là où elles s'arrêtent

6. **Une chaîne qui exige un clic humain à un maillon S'ARRÊTE à ce
   maillon.** Incident du 01/09/2026 : 99 idées attendaient dans la file
   d'entrée, **zéro** devant le juge, qui tournait toutes les heures depuis
   des jours pour écrire « rien à analyser ». Il y avait un producteur en
   amont, un juge en aval, et **rien entre les deux** : il fallait qu'un
   humain ouvre le cockpit et clique sur chaque idée. **On ne fait jamais
   un geste quatre-vingt-dix-neuf fois.**
   → Tout maillon intermédiaire se franchit par le CODE, avec un seuil
   explicite. Garder l'humain là où il engage l'argent, pas là où il
   transporte des données. Vérifier régulièrement qu'aucun étage ne meurt
   de faim pendant qu'un autre déborde.

7. **Un geste manuel dans un workflow produit un artefact qui ne se refait
   JAMAIS.** Les captures d'écran d'une langue avaient **douze jours de
   retard** sur l'app parce que le script disait « changer la langue à la
   main avant de relancer ». Ce n'est pas une dégradation acceptable :
   c'est un artefact périmé qui finit publié.
   → Si un sélecteur existe dans le produit, le script le pilote. Chercher
   les libellés que le produit ne traduit PAS : ils sont reconnaissables
   quelle que soit la langue courante.

8. **Un script qui annonce le succès sans le CONSTATER ment.** Le même
   script écrivait « barrière franchie » juste après avoir tapé le bouton
   — il l'a écrit **quatre fois de suite sur un écran qui n'avait pas
   bougé**. Un script qui affirme le contraire de ce qui s'est passé est
   pire qu'un script qui échoue.
   → Constater l'effet (l'écran a changé, le champ contient la valeur),
   pas l'action. Et **échouer plutôt que livrer** : le même script a un
   jour produit une capture au champ vide après avoir signalé trois
   échecs — cette image serait partie sur la fiche du store.

9. **Une opération de MAINTENANCE ne prend pas le verrou de la
   PRODUCTION.** Une reprise de treize dossiers durait vingt minutes,
   pendant lesquelles la passe horaire s'abstenait — proprement, mais elle
   s'abstenait.
   → Verrou distinct, et `expected_every_sec` NUL pour ce qui n'est pas
   périodique : donner une cadence à une opération ponctuelle fait dire au
   surveillant qu'elle est « muette » dès le lendemain. Une fausse alerte
   de plus est une vraie alerte de moins.

10. **L'outil de mesure peut regarder la mauvaise fenêtre.** Sur Android,
    `uiautomator dump` restitue la fenêtre au PREMIER PLAN : clavier
    ouvert, il rendait « Languages / QWERTY / Glide typing » au lieu de
    l'application. Le script cherchait donc ses boutons dans l'arbre du
    clavier et tapait à l'aveugle. Corollaire découvert en corrigeant :
    tout désactiver ne marche pas non plus — sans le moindre clavier
    actif, l'injection de texte n'a plus de destination.
    → Vérifier que l'instrument observe bien l'objet, surtout quand il
    « ne trouve pas » ce qui est manifestement à l'écran.

## C. Cockpit de pilotage — ce qui le rend illisible

11. **Un cockpit répond « QU'EST-CE QUI M'ATTEND », pas « voici ma
    thèse ».** L'accueil était un document de cadrage daté, six écrans de
    téléphone, sans une donnée vivante hormis un total en bas de page —
    et c'était un DOUBLON des documents du dépôt.
    → Trois questions, dans cet ordre : qu'est-ce qui m'attend, qu'est-ce
    qui est cassé, où en est-on. Après refonte : 6,1 → 1,2 écrans.

12. **LE SILENCE VAUT « RIEN À SIGNALER ».** Une section qui n'a rien à
    dire ne s'affiche pas. Un accueil qui montre toujours les mêmes huit
    blocs n'apprend rien à qui l'ouvre trois fois par jour — et c'est
    exactement ce qui le rend illisible. Exemples mesurés : 98 entrées non
    triées en cartes pleines (35 écrans !), 50 lignes toutes marquées
    « conforme », 13 décisions déjà prises sous un bloc « à traiter (0) ».
    → N'afficher que ce qui est en défaut ou qui attend ; le reste est un
    compteur et un repli.

13. **Un compteur qui GONFLE la charge de travail se fait ignorer.** Le
    cockpit annonçait « 13 dossiers à trancher » alors que **dix étaient
    des refus déjà prononcés** — des décisions prises et des semaines
    économisées. Un badge qui ment sur ce qui reste à faire finit ignoré,
    et c'est alors le vrai travail qu'on rate.

14. **Un tableau de contrôle qui se DÉFAUSSE ne contrôle rien.** Deux fois
    dans la même session : il lisait le disque local pour dater des
    artefacts alors que le cockpit tourne sur un hébergeur sans ce disque
    (tout serait resté « inconnu » précisément là où la question se pose,
    sur le téléphone) ; et il rendait « à re-tester avant soumission » sur
    des URL que la machine teste en trois requêtes.
    → Vérifier **depuis là où l'outil tourne** : ce que la machine peut
    prouver, elle le prouve ; ce qu'elle ne peut pas, elle le dit
    « non vérifié » plutôt que de le supposer bon. **Un tableau vert
    obtenu par optimisme est pire qu'aucun tableau : c'est celui qu'on
    croit.**
    Corollaire d'architecture : dans un portefeuille où chaque app a sa
    propre base, la trace destinée au COCKPIT s'écrit dans la base du
    cockpit. La première version écrivait dans celle de l'app — le repli a
    tenu et le message a dit exactement ce qui n'allait pas. **C'est le
    seul intérêt d'un repli : rester debout ET parler.**

15. **Un VERDICT n'est pas une CONSIGNE.** La liste affichait « dossier :
    PIVOT 33 % » — un jugement sans suite. L'opérateur : « il y a
    plusieurs idées mais on ne sait pas trop quoi en faire. » Le dossier
    contenait pourtant tout : la cible, le canal, la fonction décisive, et
    quatre notes argumentées.
    → Dériver PAR CODE le geste qui suit, en nommant ce qui bloque (« la
    distribution bloque à 42/100 : … »), jamais « le score est bas ». Et
    dire explicitement quand il n'y a **rien à faire** : un dossier classé
    ne se rouvre pas dix fois.

## D. Interface — les défauts qui coûtent le plus cher

16. **Du code hérité d'une maquette SOMBRE devient invisible en thème
    clair.** Un bouton « copier » en blancs semi-transparents (`rgba(255,
    255, 255, 0.65)`) sur fond clair : littéralement invisible. Ce n'était
    pas un défaut d'apparence — ces valeurs existent pour être collées
    dans les formulaires d'organismes de vérification, et **un bouton
    qu'on ne voit pas est une valeur qu'on retape à la main**. C'est ce
    qui a produit une dénomination légale saisie de travers dans le
    formulaire qui commande toute la chaîne du store (19/08/2026).
    → Aucune couleur en dur : toujours les jetons du thème. Chercher
    `rgba(255,255,255` dans tout projet ayant changé de thème.

17. **Le design se JUGE sur l'écran où l'outil s'utilise.** Juger la
    clarté d'un cockpit consulté au téléphone sur un écran de quinze
    pouces, c'est juger un autre produit. Un banc rend les deux largeurs
    et mesure ce qui déborde, ce qui est sous 40 px, et la densité au
    premier écran — une correction se PROUVE par une seconde capture.
    Attention : **le banc lui-même doit être juste.** Le mien comptait les
    liens en texte courant comme des cibles tactiles et criait « 114 » sur
    une page qui en avait trois. Un banc qui crie au loup, on cesse de
    l'écouter.

## F. Garder les garde-fous utilisables

18. **Des garde-fous dispersés ne protègent qu'à moitié.** Cinq contrôles
    nés de cinq incidents, chacun dans son dossier : avant une livraison
    on en lance deux, et c'est toujours le troisième qui aurait parlé.
    Un point d'entrée unique (`./verifier.sh`) retire la question
    « lequel dois-je lancer ? ».
    Deux détails qui décident de son usage réel : chaque contrôle affiche
    CE QU'IL PROTÈGE et pas seulement son nom (« le bouton copier reste
    visible » se comprend six mois plus tard, pas « verifier-charte :
    OK ») ; et un contrôle qu'on n'a PAS lancé est dit comme tel — un
    contrôle sauté dont personne ne parle se confond avec un contrôle
    réussi.

19. **Un contrôle qui échoue pour une raison SANS RAPPORT avec ce qu'il
    surveille est pire qu'un contrôle absent.** Premier lancement du
    point d'entrée : deux croix rouges pour une variable d'environnement
    manquante. On apprend vite à ignorer les croix d'un outil qui se
    trompe de sujet — et le jour où l'une est vraie, on l'ignore aussi.
    Charger l'environnement en tête, ou refuser de lancer le contrôle en
    le disant.

20. **« Rien à faire » n'est pas « rien à dire ».** L'état vide d'un
    cockpit est le moment où il en sait le plus : ce qui tourne, à quelle
    cadence, combien de temps la file tiendra. Répondre par un paragraphe
    gris enseigne qu'il n'y a rien à y chercher, et on cesse de l'ouvrir.

21. **Une consigne doit porter son geste.** « Reprendre la distribution,
    ou écarter » nomme l'action mais laisse la boucle ouverte si le geste
    est ailleurs. L'exception se raisonne : ce qui engage de l'ARGENT
    n'est pas à portée de pouce — on l'ouvre, on lit, puis on décide.

## E. Ce que ces leçons ont produit comme garde-fous

Un principe traverse tout ce qui précède : **on ne fait pas confiance, on
constate** — et l'instrument de constatation est lui aussi suspect.

| Garde-fou | Ce qu'il empêche de revivre |
|---|---|
| Barème explicite dans le prompt de notation | Un juge incapable de dire oui |
| Script de calibration qui sort en erreur | Une panne de tri qui dure 14 dossiers |
| Calibration versionnée + mode de reprise | Comparer des notes de barèmes différents |
| Promotion automatique entre étages | Une chaîne morte au milieu |
| Constat de l'effet, jamais de l'action | Un script qui annonce l'inverse du réel |
| Refus de produire un artefact mauvais | Une capture vide publiée sur un store |
| Banc de mesure d'interface (2 largeurs) | Un outil illisible là où il s'utilise |
| Contrôles « prêt à livrer » sur preuves | Deux jours perdus par aller-retour |
