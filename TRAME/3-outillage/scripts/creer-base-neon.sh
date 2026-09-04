#!/usr/bin/env bash
# UNE BASE PAR PROJET (règle 01/09/2026) — crée un projet Neon et renvoie son
# URI de connexion, prête pour `vercel env add DATABASE_URL production`.
#
#   creer-base-neon.sh <nom-du-projet> [region_id]
#
# Clé API : ~/.config/trames/neon.env (NEON_API_KEY, chmod 600) — jamais dans
# un repo. Régions : aws-eu-central-1 (défaut), aws-us-east-1, aws-ap-southeast-1…
# IDEMPOTENT (04/09/2026) : si un projet porte déjà ce nom, le script renvoie
# son URI au lieu d'en créer un second — un script qui crée puis plante à
# l'affichage laissait une base orpheline à chaque relance (payé sur `ville`).
# Ne jamais écrire l'URI (mot de passe) dans un fichier suivi par git.
set -euo pipefail
NOM="${1:?usage: creer-base-neon.sh <nom> [region_id]}"
REGION="${2:-aws-eu-central-1}"
CONF="$HOME/.config/trames/neon.env"
[ -f "$CONF" ] || { echo "clé absente : $CONF (NEON_API_KEY=…)"; exit 1; }
# shellcheck disable=SC1090
. "$CONF"; : "${NEON_API_KEY:?}"
API="https://console.neon.tech/api/v2"
neon() { curl -sS -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" "$@"; }

ORG="$(neon "$API/users/me/organizations" | python3 -c 'import json,sys; print(json.load(sys.stdin)["organizations"][0]["id"])')"

# Déjà là ? (la liste exige org_id)
EXISTANT="$(neon "$API/projects?org_id=$ORG&limit=100" | python3 -c '
import json, sys
nom = sys.argv[1]
for p in json.load(sys.stdin).get("projects", []):
    if p["name"] == nom: print(p["id"]); break' "$NOM")"

if [ -n "$EXISTANT" ]; then
  echo "• base « $NOM » existe déjà (id $EXISTANT) — URI renvoyée, rien créé" >&2
  neon "$API/projects/$EXISTANT/connection_uri?role_name=neondb_owner&database_name=neondb" \
    | python3 -c 'import json,sys; u=json.load(sys.stdin)["uri"]; print(u if "?" in u else u+"?sslmode=require")'
  exit 0
fi

REPONSE="$(neon -X POST "$API/projects" \
  -d "{\"project\":{\"name\":\"$NOM\",\"org_id\":\"$ORG\",\"region_id\":\"$REGION\",\"pg_version\":17}}")"

# Pas de \" dans une f-string : SyntaxError sous Python 3.14 (payé le 04/09/2026).
printf '%s' "$REPONSE" | python3 -c '
import json, sys
d = json.load(sys.stdin)
if "project" not in d:
    print("échec :", json.dumps(d)[:300], file=sys.stderr); sys.exit(1)
uri = d["connection_uris"][0]["connection_uri"]
if "?" not in uri: uri += "?sslmode=require"
p = d["project"]
print("✓ base « {} » créée ({}, PG {}) — id {}".format(p["name"], p["region_id"], p["pg_version"], p["id"]), file=sys.stderr)
print(uri)'
