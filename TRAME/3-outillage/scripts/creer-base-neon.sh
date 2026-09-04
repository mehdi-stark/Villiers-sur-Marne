#!/usr/bin/env bash
# UNE BASE PAR PROJET (règle 01/09/2026) — crée un projet Neon et renvoie son
# URI de connexion, prête pour `vercel env add DATABASE_URL production`.
#
#   creer-base-neon.sh <nom-du-projet> [region_id]
#
# Clé API : ~/.config/trames/neon.env (NEON_API_KEY, chmod 600) — jamais dans
# un repo. Régions : aws-eu-central-1 (défaut), aws-us-east-1, aws-ap-southeast-1…
# L'URI (avec mot de passe) n'est renvoyée QU'À LA CRÉATION : la poser
# immédiatement dans l'hébergeur, ne jamais l'écrire dans un fichier suivi.
set -euo pipefail
NOM="${1:?usage: creer-base-neon.sh <nom> [region_id]}"
REGION="${2:-aws-eu-central-1}"
CONF="$HOME/.config/trames/neon.env"
[ -f "$CONF" ] || { echo "clé absente : $CONF (NEON_API_KEY=…)"; exit 1; }
# shellcheck disable=SC1090
. "$CONF"; : "${NEON_API_KEY:?}"

ORG="$(curl -sS -H "Authorization: Bearer $NEON_API_KEY" \
  https://console.neon.tech/api/v2/users/me/organizations \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["organizations"][0]["id"])')"

REPONSE="$(curl -sS -X POST -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  https://console.neon.tech/api/v2/projects \
  -d "{\"project\":{\"name\":\"$NOM\",\"org_id\":\"$ORG\",\"region_id\":\"$REGION\",\"pg_version\":17}}")"

printf '%s' "$REPONSE" | python3 -c '
import json, sys
d = json.load(sys.stdin)
if "project" not in d:
    print("échec :", json.dumps(d)[:300], file=sys.stderr); sys.exit(1)
uri = d["connection_uris"][0]["connection_uri"]
if "?" not in uri: uri += "?sslmode=require"
print(f"✓ base « {d[\"project\"][\"name\"]} » créée ({d[\"project\"][\"region_id\"]}, PG {d[\"project\"][\"pg_version\"]})", file=sys.stderr)
print(uri)'
