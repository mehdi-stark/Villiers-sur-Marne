#!/usr/bin/env bash
# Pré-remplit l'audit de mise à niveau d'un projet par des PREUVES mécaniques
# (greps), lecture seule. L'agent confirme ensuite sur captures (skill audit-trame).
#   auditer.sh <chemin-projet> [fichier-sortie]
set -u
P="$(cd "${1:?chemin du projet}" && pwd)"; OUT="${2:-$P/docs/planning/AUDIT_TRAME.md}"; NOM="$(basename "$P")"
cd "$P"
EX=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=TRAME --exclude-dir=.git --exclude-dir=coverage)
G() { grep -rlE "${EX[@]}" "$1" . --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.css' --include='*.sql' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.md' 2>/dev/null | wc -l | tr -d ' '; }
GN() { grep -rnE "${EX[@]}" "$1" . --include='*.ts' --include='*.tsx' --include='*.jsx' --include='*.css' 2>/dev/null | wc -l | tr -d ' '; }
hex=$(GN '#[0-9a-fA-F]{6}\b'); tokens=$(G 'var\(--'); confirm=$(GN '(window\.)?confirm\('); rls=$(G 'row level security|create policy|enable_rls|ENABLE ROW LEVEL'); webhook=$(G 'hmac|x-shopify-hmac|constructEvent|svix|verifyWebhook|timingSafeEqual'); heartbeat=$(G 'watchdog|heartbeat|workflow_runs'); sentry=$(G '@sentry'); analytics=$(G 'posthog|plausible|umami|gtag'); tests=$(find . -name '*.test.*' -not -path '*/node_modules/*' -not -path '*/.next/*' 2>/dev/null | wc -l | tr -d ' '); ci=$(ls .github/workflows 2>/dev/null | wc -l | tr -d ' '); verify=$([ -f scripts/verify.sh ] && echo oui || echo non); capture=$(G 'playwright|puppeteer'); pwa=$(G 'manifest\.webmanifest|MetadataRoute\.Manifest|serviceWorker\.register|showNotification'); otp=$(G 'otp|code à 6|one.?time'); maxdur=$(G 'maxDuration'); queue=$(G 'qstash|inngest|jobs_demandes|queue'); ia=$(G 'deepseek|gemini|openai|anthropic'); repli=$(G 'repli|fallback'); qa=$(G 'qa_review|verdict|judge'); minw=$(GN 'min-w-0|min-width: ?0|minWidth: ?0'); media=$(GN '@media'); lecons=$(ls docs/planning/LECONS*.md LECONS*.md 2>/dev/null | wc -l | tr -d ' '); marche=$(ls docs/planning/*[Mm][Aa][Rr][Cc][Hh]* docs/*[Mm][Aa][Rr][Cc][Hh]* 2>/dev/null | wc -l | tr -d ' '); pnl=$(G 'margeNette|pnl|profit'); stripe=$(G 'stripe|billing|paiement'); gate=$(G 'gate'); claude=$([ -f CLAUDE.md ] && wc -l < CLAUDE.md | tr -d ' ' || echo 0); regles=$(grep -ci 'proposition\|linear\|premium' CLAUDE.md 2>/dev/null || echo 0); revue=$(G 'revue|review-hebdo|revue-hebdo'); secretsclient=$(grep -rnE "${EX[@]}" 'NEXT_PUBLIC_[A-Z_]*(SECRET|TOKEN|PRIVATE)' . --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')
v() { # verdict par seuil : $1=valeur $2=seuil ok $3=seuil partiel
  if [ "$1" -ge "$2" ] 2>/dev/null; then echo "✅"; elif [ "$1" -ge "$3" ] 2>/dev/null; then echo "🟡"; else echo "🔴"; fi; }
vinv() { if [ "$1" -eq 0 ]; then echo "✅"; elif [ "$1" -le "$2" ]; then echo "🟡"; else echo "🔴"; fi; }
L=()
L+=("$(v "$gate" 3 1) Décisions avec avis/chiffres — preuve : $gate fichier(s) « gate », $qa fichier(s) verdict/QA")
L+=("$(v "$qa" 3 1) Socle/QA des sorties IA — preuve : $qa fichier(s) QA/verdict, $ia fichier(s) IA")
L+=("$(v "$marche" 1 0) Analyse de marché versionnée — preuve : $marche doc(s) marché dans docs/")
L+=("$(v "$pnl" 3 1) P&L / rentabilité par code — preuve : $pnl fichier(s) marge/pnl")
L+=("$(v "$stripe" 3 1) Argent gaté (billing/paiement) — preuve : $stripe fichier(s)")
L+=("$(vinv "$hex" 10) Charte en tokens — preuve : $hex couleur(s) hex en dur (tsx/css), $tokens fichier(s) var(--)")
L+=("$(vinv "$confirm" 2) Primitives accessibles — preuve : $confirm confirm() natif(s)")
L+=("$(v "$minw" 5 1) Responsive (min-width:0 / media) — preuve : $minw min-w-0, $media @media — À PROUVER par capture 390 px")
L+=("$(v "$capture" 1 0) Script de capture (audit visuel) — preuve : $capture fichier(s) playwright/puppeteer")
L+=("$(v "$pwa" 2 1) PWA (manifest, service worker push, notifications) — preuve : $pwa fichier(s)")
L+=("$(v "$otp" 1 0) Connexion par OTP (obligatoire en PWA) — preuve : $otp fichier(s) otp")
L+=("$(v "$queue" 1 0) Jobs longs hors serverless (file/queue) — preuve : $queue fichier(s) queue, $maxdur maxDuration")
L+=("$(v "$heartbeat" 2 1) Tâches planifiées surveillées (heartbeat/journal) — preuve : $heartbeat fichier(s)")
L+=("$(v "$repli" 3 1) Replis IA — preuve : $repli fichier(s) repli/fallback")
L+=("$(vinv "$secretsclient" 0) Aucun secret côté client — preuve : $secretsclient NEXT_PUBLIC_*SECRET/KEY/TOKEN")
L+=("$(v "$webhook" 1 0) Webhooks signés/idempotents — preuve : $webhook fichier(s) hmac/signature")
L+=("$(v "$rls" 1 0) Sécurité base par script (RLS/policies) — preuve : $rls fichier(s) SQL RLS")
L+=("$(v "$sentry" 1 0) Erreurs (Sentry) — preuve : $sentry fichier(s)")
L+=("$(v "$analytics" 1 0) Analytics produit — preuve : $analytics fichier(s)")
L+=("$(v "$tests" 5 1) Tests — preuve : $tests fichier(s) de test, verify.sh : $verify, CI : $ci workflow(s)")
L+=("$(v "$claude" 30 1) CLAUDE.md à jour — preuve : $claude lignes, règles permanentes : $regles mention(s)")
L+=("$(v "$lecons" 1 0) Registre des leçons — preuve : $lecons fichier(s) LECONS")
L+=("$(v "$revue" 1 0) Revue de pilotage sur chiffres — preuve : $revue fichier(s)")
ok=$(printf '%s\n' "${L[@]}" | grep -c '^✅' || true); part=$(printf '%s\n' "${L[@]}" | grep -c '^🟡' || true); ko=$(printf '%s\n' "${L[@]}" | grep -c '^🔴' || true); tot=${#L[@]}
mkdir -p "$(dirname "$OUT")"
{
echo "# Audit de mise à niveau — $NOM ($(date +%F)) — pré-rempli par auditer.sh"
echo; echo "> **Niveau atteint : $ok/$tot conforme · $part partiel · $ko absent** (preuves mécaniques = greps ; l'agent CONFIRME sur captures et runs réels — skill \`audit-trame\`). Un ⬜ (sans objet) se justifie ; un ✅ mécanique n'est pas une preuve visuelle."
echo; echo "## Preuves mécaniques"; for l in "${L[@]}"; do echo "- [ ] $l"; done
echo; echo "## À confirmer sur preuves réelles (l'agent)"
echo "- Capture desktop + 390 px de chaque écran principal (\`TRAME/3-outillage/scripts/capturer.mjs\`) : débordements ? vides expliqués ? actions longues visibles ?"
echo "- Une décision affichée avec avis + chiffres vs seuils ? Une auto-décision tracée ?"
echo "- Un repli IA exercé en réel ? Un job long lancé depuis un bouton et exécuté hors serverless ?"
echo "- Doctrine commerce : quelle vente est retardée ? quel profit laissé sur la table ? paiement immédiat par défaut ?"
echo; echo "## Plan de mise à niveau — par ce que chaque maillon DÉBLOQUE (à ordonner par l'agent)"
printf '%s\n' "${L[@]}" | grep -n '^🔴' | sed 's/^\([0-9]*\):🔴 \(.*\) — preuve.*/\1. \2/' | head -8
echo; echo "Règle : un maillon à la fois, non destructif, testé en réel, commité, coché ici. Leçon → \`trames.sh lecon\`."
} > "$OUT"
echo "✓ audit pré-rempli : $OUT — niveau $ok/$tot (🟡 $part · 🔴 $ko)"
