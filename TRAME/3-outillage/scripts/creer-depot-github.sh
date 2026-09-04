#!/usr/bin/env bash
# Crée (idempotent) le dépôt GitHub d'un projet et pousse la branche courante.
#   creer-depot-github.sh <proprietaire> [nom=dossier courant] [--public]
# Jeton : ~/.config/trames/github.env (GITHUB_TOKEN=ghp_… ou github_pat_…, scope
# « repo » / « Administration: write »), chmod 600 — jamais dans un repo. Sans
# jeton, le script s'arrête et dit quoi poser : créer un dépôt exige l'API,
# SSH ne sait que pousser. Remote « origin » en SSH (clé du Mac).
set -euo pipefail
PROPRIO="${1:?usage: creer-depot-github.sh <proprietaire> [nom] [--public]}"
NOM="${2:-$(basename "$PWD")}"; [ "$NOM" = "--public" ] && NOM="$(basename "$PWD")"
VISIBILITE="private"; for a in "$@"; do [ "$a" = "--public" ] && VISIBILITE="public"; done
CONF="$HOME/.config/trames/github.env"
[ -f "$CONF" ] || { echo "jeton absent : $CONF (GITHUB_TOKEN=…) — à poser par l'opérateur (Settings → Developer settings → Fine-grained token, dépôts : all, permission Administration + Contents : write)"; exit 2; }
# shellcheck disable=SC1090
. "$CONF"; : "${GITHUB_TOKEN:?}"
api() { curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "$@"; }
MOI="$(api https://api.github.com/user | python3 -c 'import json,sys; print(json.load(sys.stdin).get("login",""))')"
[ -n "$MOI" ] || { echo "jeton refusé par GitHub"; exit 1; }
if api -o /dev/null -w '%{http_code}' "https://api.github.com/repos/$PROPRIO/$NOM" | grep -q '^200$'; then
  echo "• dépôt $PROPRIO/$NOM existe déjà — rien créé" >&2
else
  if [ "$PROPRIO" = "$MOI" ]; then URL="https://api.github.com/user/repos"; else URL="https://api.github.com/orgs/$PROPRIO/repos"; fi
  api -X POST "$URL" -d "{\"name\":\"$NOM\",\"private\":$([ "$VISIBILITE" = private ] && echo true || echo false),\"has_wiki\":false,\"has_projects\":false}" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print("✓ dépôt créé :", d.get("html_url") or d, file=sys.stderr)'
fi
git remote get-url origin >/dev/null 2>&1 || git remote add origin "git@github.com:$PROPRIO/$NOM.git"
git push -u origin "$(git branch --show-current)"
echo "✓ poussé sur git@github.com:$PROPRIO/$NOM.git"
