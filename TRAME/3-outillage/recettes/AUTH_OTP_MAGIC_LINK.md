# Recette — connexion : OTP obligatoire, magic link optionnel, passkeys en V2

**Pourquoi** (règle Mehdi 30/08) : en PWA installée, un magic link ouvre le navigateur
hors de l'app ; le code OTP se tape DANS l'app. Le magic link reste pratique sur desktop.

## Le flux (code de référence : usine ecom `apps/admin/lib/auth.ts`, `app/connexion/`)
1. L'utilisateur saisit son e-mail (whitelist ou compte existant) → **un seul e-mail**
   contenant un **code à 6 chiffres** (10 min, usage unique) ET un lien (15 min).
   Réponse identique que l'e-mail existe ou non (pas d'oracle).
2. Écran de connexion : en mode installé (`display-mode: standalone`) ou sur mobile, le
   champ **code en premier** ; le lien est mentionné en second. Sur desktop, l'inverse.
3. OTP : **hash HMAC stocké, jamais le code** ; 5 essais max ; comparaison à temps
   constant ; consommé à la première réussite ; trace d'audit.
4. Session signée (HMAC, 30 j), cookie httpOnly/secure/sameSite ; renouvellement
   silencieux avant expiration pour ne pas retaper le code à chaque ouverture.
5. **Tout échec d'envoi pose une alerte** (un `catch` silencieux fait passer le
   système pour mort — piège payé).
6. Secours : Basic Auth d'urgence (scripts, e-mail indisponible), jamais côté produit.

## Passkeys (code de référence : usine ecom — `@simplewebauthn`, table `passkeys`)
Après un premier OTP, « Activer Face ID / Touch ID sur cet appareil » enregistre une passkey
(WebAuthn, RP ID = domaine) ; l'écran de connexion propose « Se connecter avec Face ID »
en premier quand une passkey existe ; l'OTP reste le repli universel. Test automatisé possible
avec l'authenticator virtuel de Playwright (CDP `WebAuthn.addVirtualAuthenticator`).

## V2 (à proposer dès que le produit a des utilisateurs réguliers)
- **Passkeys / WebAuthn** (Face ID, Touch ID) : après le premier OTP, « se souvenir de
  cet appareil » → plus aucun code ; fonctionne dans la PWA installée (iOS ≥ 16).
- Connexion sociale seulement si le marché l'exige (elle sort aussi de la PWA).

## Preuves attendues (audit)
Connexion par OTP réussie depuis la PWA installée ; hash en base (jamais le code) ;
6e essai refusé ; alerte posée sur un envoi en échec simulé.

## Compléments (usine ecom, 30/08/2026 — prouvés E2E)

- Lanceur mobile → recette `LANCEUR_MOBILE.md`.
- **Session glissante** : cookie de session signé (30 j) RÉÉMIS par le middleware
  quand il expire sous 7 j. Résultat : une PWA utilisée reste ouverte ; l'inactivité
  déconnecte toujours. Test : forger un jeton « expire dans 2 j » → `Set-Cookie`
  présent ; « dans 20 j » → absent.
- **E-mail « nouvel appareil »** à chaque enregistrement de passkey (appareil déduit
  du user-agent, heure locale, lien direct vers la page de révocation). Échec
  d'envoi = alerte en base, jamais avalé. C'est la protection standard des produits
  qui offrent la biométrie — obligatoire dès que les passkeys existent.
- **Page « Appareils de confiance »** : liste des passkeys de l'utilisateur, dernier
  usage, révocation tracée en audit ; proposée juste après un OTP réussi (le moment
  où l'intention est là), refusable par appareil (localStorage).
- **Verrou biométrique au retour** (PWA) : sur les appareils où une passkey est
  active, > 1 h hors de l'app → overlay flou « Cockpit verrouillé », déverrouillage
  par passkey (qui réémet le cookie), repli « code par e-mail ». `pagehide` note
  l'heure de départ ; test E2E : injecter l'heure via `addInitScript` (un `evaluate`
  avant navigation est écrasé par `pagehide`).
- **Journal de connexions** sur la page Appareils : 20 derniers événements d'accès
  depuis l'audit_log (lien, code, passkey, activation, révocation) — zéro collecte
  supplémentaire.
- **Identité e-mail système centralisée** (`MARQUE_USINE` : nom, couleur accent du
  cockpit, siteUrl = l'admin) — sinon les couleurs divergent fichier par fichier.
