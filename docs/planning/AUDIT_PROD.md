# Audit de mise en production — ville (2026-09-04)

## ✅ Vérifié en place (avec la preuve)
## 🔴 P0 — bloquant avant de vrais utilisateurs
## 🟠 P1 — dans les 2 semaines suivant le lancement
## 🟢 P2 — confort
## Métrique de vérité du produit (pas le trafic) : <…>

## Garde d'entrée de la connexion (06/09/2026)

**Le problème posé par l'opérateur** : « on consomme des e-mails pour rien » et « une boîte
peut flinguer notre charge ». Deux dépenses distinctes, toutes deux réelles :
l'**e-mail** (facturé au message) et la **requête base** (facturée au calcul chez Neon).

**Ce qui existait** : le contrôle « cette adresse a-t-elle le droit d'entrer ? » précédait
déjà tout envoi — aucun code n'est jamais parti vers un inconnu. Mais ce contrôle COÛTAIT
une requête base par tentative, y compris pour une adresse inventée : marteler `/api/auth`
faisait payer la base à chaque coup.

**Ce qui est posé** (`packages/core/src/garde.ts`, les trois applications) — du moins cher
au plus cher, la base n'étant atteinte qu'en dernier :

| Filtre | Coût | Défaut |
|---|---|---|
| Format de l'adresse | aucune E/S | regex |
| Quota par IP | mémoire | 10 tentatives / 10 min, par application |
| Quota par adresse | mémoire | 5 / h (le quota d'envoi de la ville) |
| Autorisation en cache | mémoire, TTL 60 s | positive **et** négative |
| Comptage des envois réels | base | 5 / h — filet, atteint seulement après les filtres |
| Validation du code | mémoire puis base | 20 essais / 10 min et par IP, sinon 429 |

**Pas d'oracle, en corps et en temps.** La réponse est identique pour une adresse connue
ou non ; un **délai plancher de 350 ms** égalise les latences — sans lui, « inconnu »
(réponse immédiate) et « code envoyé » (insertion + appel au fournisseur) se distinguaient
à la montre. Mesuré : 5 ms d'écart entre les deux cas.

**Portée assumée** : ces compteurs vivent dans la mémoire d'UNE instance serverless. Ils
absorbent le cas réel — un script, un scanner, une boucle — mais ne constituent pas un
quota distribué. Le comptage en base reste le filet ; il n'est atteint que par des
tentatives déjà filtrées. Si le trafic le justifie un jour, la brique à remplacer est
`quota()`, et elle seule.

**Un martèlement se voit** : au-delà du quota IP, une alerte `connexion_martelee_<app>` est
posée — **une seule par quart d'heure et par application**, sinon l'attaque paierait sa
propre trace. Elle apparaît dans le cockpit, page Système, section « Alertes ouvertes ».

Prouvé en réel (`apps/famille/scripts/tests/garde-connexion.mjs`) : adresse inconnue → zéro
code créé, réponse et latence identiques ; 10 demandes sur une adresse connue → 5 codes en
base, le reste s'arrête avant ; 30 essais de code → 20 lus puis 10 refusés d'office ;
25 demandes en rafale → **une** alerte.
