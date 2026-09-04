# Conventions techniques transverses — les patterns qui ont fait leurs preuves

> Référence pour l'agent pendant le build (phase 3). Chaque pattern vient d'un problème
> réellement rencontré sur Delivup.

## Identités
- **`admin@delivup.io` = équipe Delivup uniquement.** Projets personnels : `mehdi.stark@gmail.com`
  (whitelists, comptes de démo, contacts techniques, comptes GitHub/Vercel `mehdi-stark`).

## Données
- **Une seule source de vérité du schéma**, migrations générées, jamais de SQL à la main.
  Attention aux types du driver (numériques rendus en string → convertir avant calcul).
- **Machines à états explicites** (enums de statut) plutôt que des booléens qui
  s'accumulent. Chaque transition d'état importante = une ligne d'historique.
- **Idempotence manuelle quand l'index unique ne suffit pas** : en SQL, des colonnes
  NULL échappent aux index uniques — les upserts sur (a, b_nullable, c) doivent être
  faits en select-puis-insert/update.
- **Chemins de stockage lisibles** : préfixe `slug--id8` par client plutôt qu'un UUID
  brut — la console du fournisseur devient navigable.
- **Stocker les données ET le rendu** : un document généré = son JSON structuré + son
  HTML figé. L'un sans l'autre finit toujours par manquer.

## Automatisation (n8n ou équivalent)
- **Les apps n'appellent jamais le moteur directement** : elles écrivent un état
  (checkpoint) en base ; un webhook base-de-données notifie le dispatcher qui route par
  type. Pour RE-déclencher, cycler le statut (pending → approved) — le filtre anti-
  doublon n'accepte que les changements.
- **Passer les paramètres SQL en TABLEAU d'expressions**, jamais en chaîne séparée par
  virgules (une virgule dans une donnée décale tous les paramètres — bug réel).
- **Booléens/valeurs typées vers SQL : passer des strings** ('true'/'false') et caster
  côté SQL — la sérialisation des types n'est pas fiable.
- **Fichiers privés → APIs externes : URLs signées temporaires** générées par l'app au
  déclenchement et stockées avec la tâche — le moteur n'a pas besoin de credential
  stockage.
- **Un hub d'erreurs** (workflow dédié) + journal des exécutions en base, visible
  depuis l'admin.

## IA
- **Table de configuration modèle-par-tâche** lue à l'exécution : changer de modèle =
  un clic dans l'admin, pas un redéploiement. Y mettre TOUTES les tâches (génération,
  vision, QA).
- **Tout ce qui peut être déterministe l'est** : prompts assemblés par code depuis des
  matrices en base ; scores → verdicts par seuils codés ; correspondances par
  recouvrement de mots avec seuil (« mieux vaut vide que faux »).
- **L'API du fournisseur compte autant que le modèle** : ex. seul Anthropic accepte les
  images par URL (pas de téléchargement/base64 dans le moteur d'automatisation) ; les
  réponses JSON se parsent défensivement (fences, slice sur { }).
- **Sorties client-facing : repli déterministe** si le QA refuse — jamais de texte
  douteux chez un client.
- **Images générées : re-encoder la sortie** (WebP via sharp, sans copier les
  métadonnées) — supprime EXIF/XMP/marqueurs IA avant publication.

## Emails & messages
- **Templates en base** ({{variables}}), lus AU MOMENT de l'envoi par tous les
  expéditeurs (app ET automatisation) : une modification dans l'admin s'applique au
  prochain envoi. Page d'édition avec aperçu + envoi de test.
- **Relances automatiques journalisées** : max N par sujet, espacement minimal, jamais
  sans adresse — et un lien FRAIS régénéré à chaque relance (paiement, formulaire).
- **Un seul fournisseur d'email**, réputation d'envoi séparée de la boîte humaine.

## Admin (le pseudo-CRM)
- **Une page `/pipeline` vivante** : le plan du projet dans le produit, mise à jour à
  chaque maillon — c'est aussi la mémoire de reprise entre sessions.
- **Des files de travail, pas des archives** : chaque liste s'ouvre sur « À traiter »
  avec l'action à faire ET le bouton pour la faire ; l'historique en dessous.
- **Une fiche par entité centrale** (client) qui agrège tout : jalons, documents,
  signatures, données, livrables, actions.
- **Badges QA partout où un humain relit.**
- Thème clair/sombre pilotable + responsive dès le début (ça coûte 10× moins cher tôt).

## Méthode
- **Client/lead de test préfixé [TEST]** pour tous les tests bout en bout réels.
- **Tester les routes à session via un script temporaire** qui rejoue la logique
  (supprimé ensuite) ; les webhooks avec de vrais POST.
- **Un commit par maillon**, message détaillé (quoi, pourquoi, ce qui a été testé).
- **Restaurer l'état après un test destructif** (sauvegarder les valeurs, les remettre).
