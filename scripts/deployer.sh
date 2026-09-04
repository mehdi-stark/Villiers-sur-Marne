#!/usr/bin/env bash
# Déploie UNE app du monorepo sur son projet Vercel (compte mehdi-stark), depuis la RACINE :
# avec un « Root Directory » configuré, la CLI doit tourner à la racine du dépôt.
#   scripts/deployer.sh cockpit|famille|agents
# Jeton : VERCEL_ACCESS_TOKEN dans apps/cockpit/.env.local — toujours cité (--token "$T").
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:?usage: deployer.sh cockpit|famille|agents}"
case "$APP" in cockpit) PROJET=villiers-sur-marne;; famille) PROJET=villiers-famille;; agents) PROJET=villiers-agents;; *) echo "app inconnue"; exit 1;; esac
T="$(grep '^VERCEL_ACCESS_TOKEN=' apps/cockpit/.env.local | cut -d= -f2- | tr -d '\r"'"'"' ')"; [ -n "$T" ] || { echo "VERCEL_ACCESS_TOKEN absent"; exit 1; }
rm -rf .vercel; vercel link --yes --project "$PROJET" --scope mehdi-starks-projects --token "$T" >/dev/null
vercel deploy --prod --yes --token "$T" > "/tmp/deploy-$APP.log" 2>&1 || true
sed "s/$T/***/g" "/tmp/deploy-$APP.log" | grep -E "Aliased|Error|error" | tail -2
URL="https://$PROJET.vercel.app"
code="$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: text/html' "$URL/connexion")"
[ "$code" = "200" ] && echo "✓ $APP en ligne : $URL/connexion → 200" || { echo "✗ $URL/connexion → $code"; exit 1; }
