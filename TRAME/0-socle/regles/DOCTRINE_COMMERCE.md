# Doctrine commerce — 3 règles à suivre dans l'absolu (bloc pour CLAUDE.md)

> Règles d'Abdurrahman Ibn Awf, compagnon du Prophète ﷺ et commerçant béni.
> À copier dans le CLAUDE.md de tout projet commercial, dès le jour 1, et à
> injecter aux agents IA (socle) + coder dans les verdicts.

```markdown
## Doctrine commerce — 3 règles à suivre dans l'absolu
1. **Ne jamais refuser un profit, aussi petit soit-il.** Profit = gain NET
   après tous les coûts réels et probables (COGS, port, taxes, paiement,
   retours, SAV). Les seuils de viabilité choisissent OÙ investir l'effort ;
   ils ne refusent jamais une vente rentable existante. Rien sur la table :
   bundle, cross-sell, gamme, marchés de même langue.
2. **Ne jamais retarder une vente.** Le paiement actif est LE chemin
   critique ; une vente payée s'honore le jour même ; aucun gate de contenu
   ne bloque une vente possible ; une offre se valide quand elle peut vendre.
3. **Ne pas vendre à crédit, dans la mesure du possible.** Paiement immédiat
   par défaut ; le différé sans frais est licite mais la baraka vient du
   cashflow direct ; pas de contre-remboursement comme mode principal
   (15-30 % de refus = crédit), pas de crédit B2B.
```

## Comment l'usine ecom l'a codée (à reproduire)
- Socle injecté aux agents (`SOCLE_COMMERCE`) : les 3 règles avec leur lecture.
- Verdicts de gates : commande fournisseur d'une vente payée → « valider »
  net + validable en un tap ; offre à profit net positif → acceptable
  (seuils = confort) ; marché COD pénalisé dans le P&L.
- Skill `doctrine-commerce` chargé pour toute décision de prix/offre/
  commande/paiement/marché.
