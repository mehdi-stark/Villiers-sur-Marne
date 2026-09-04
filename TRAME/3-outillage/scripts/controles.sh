#!/usr/bin/env bash
# LES GARDE-FOUS DE LA CHAÎNE — un point d'entrée unique : `trames.sh controles`.
#
# Chaque contrôle dit CE QU'IL PROTÈGE. Un contrôle qui ne peut pas s'exécuter
# s'ANNONCE (sauté en silence, il se confond avec un contrôle réussi) et un
# contrôle qui échoue pour une raison sans rapport avec son sujet est pire
# qu'un contrôle absent — c'est pourquoi chacun vérifie d'abord ses conditions.
#
# Né de deux pannes silencieuses : un type de demande accepté par l'app et
# ignoré par le Mac, et un alias Vercel figé qui faisait travailler dans le vide.
set -u
ICI="$(cd "$(dirname "$0")/../.." && pwd)"
OK=0; KO=0; SAUTES=0
vert() { printf '  \033[32m✓\033[0m %s\n' "$1"; OK=$((OK+1)); }
rouge() { printf '  \033[31m✗\033[0m %s\n' "$1"; KO=$((KO+1)); }
saute() { printf '  \033[33m⏭\033[0m %s\n' "$1"; SAUTES=$((SAUTES+1)); }

echo "① Types de demande — protège : une demande acceptée par le téléphone puis jetée en silence par le Mac"
if [ -f "$ICI/lanceur/lib/file.ts" ] && [ -f "$ICI/app/preparer-demandes.py" ]; then
  ecart="$(python3 - "$ICI" <<'PY'
import re, sys
ici = sys.argv[1]
ts = open(f"{ici}/lanceur/lib/file.ts").read()
py = open(f"{ici}/app/preparer-demandes.py").read()
projets = set(re.findall(r'"([a-z]+)"', re.search(r"TYPES_PROJET = \[(.*?)\]", ts, re.S).group(1)))
extra = set(re.findall(r'"([a-z]+)"', re.search(r"export type TypeDemande =(.*?);", ts, re.S).group(1)))
app = projets | extra
mac = set(re.findall(r'"([a-z]+)"', re.search(r"^TYPES = \{(.*?)\}", py, re.S | re.M).group(1)))
manque_mac, manque_app = sorted(app - mac), sorted(mac - app)
print(("app→mac: " + ",".join(manque_mac) if manque_mac else "") +
      ("  mac→app: " + ",".join(manque_app) if manque_app else ""))
PY
)"
  [ -z "$ecart" ] && vert "les deux listes blanches concordent" || rouge "listes divergentes — $ecart"
else saute "sources introuvables (dépôt incomplet ?)"; fi

echo "② Colonnes de la file — protège : un champ vide qui décale toute la ligne (incident des tabulations, 03/09)"
compte="$(python3 "$ICI/3-outillage/scripts/compter-colonnes.py" "$ICI" 2>/dev/null || echo "0 0")"
emis="${compte% *}"; lues="${compte#* }"
if [ "${emis:-0}" -gt 0 ] && [ "${lues:-0}" -gt 0 ]; then
  [ "$emis" = "$lues" ] && vert "$emis champs emis, $lues lus" || rouge "$emis champs emis mais $lues lus - decalage garanti"
else saute "comptage impossible (motif non trouve)"; fi

echo "③ Trousseau — protège : une clé qui s'échapperait vers la base du Lanceur"
if [ -f "$HOME/.config/trames/trousseau.json" ]; then
  idx="$(python3 "$ICI/app/trousseau.py" index 2>/dev/null)"
  if [ -z "$idx" ]; then saute "l'index n'a pas pu être produit"
  # MOTIF CORRIGE (04/09) : la premiere version exigeait 12 caracteres
  # ALPHANUMERIQUES juste apres le prefixe — or une vraie cle porte un « _ »
  # tot (sk_live_51Q…, sk_test_****). Elle ne matchait donc aucune cle reelle
  # et rendait « aucun secret » a tous les coups. Un instrument qui ne peut pas
  # echouer ne prouve rien : chaque garde-fou se verifie en lui donnant une
  # vraie panne a attraper.
  elif printf '%s' "$idx" | grep -qE '(sk|rk|re|phx|phc|sntrys|sntryu|shpat|whsec|vca|napi)[-_][A-Za-z0-9_-]{12,}'; then
    rouge "UNE VALEUR DE CLÉ EST PRÉSENTE DANS L'INDEX PUBLIÉ"
  else vert "l'index ne contient aucune valeur de clé"; fi
  droits="$(stat -f '%Sp' "$HOME/.config/trames/trousseau.json")"
  [ "$droits" = "-rw-------" ] && vert "trousseau en $droits" || rouge "trousseau en $droits (attendu -rw-------)"
else saute "aucun trousseau sur cette machine (trames.sh lanceur pour l'installer)"; fi

echo "④ Même application des deux côtés — protège : un alias figé qui fait travailler dans le vide"
if [ -f "$HOME/.config/trames/lanceur.env" ]; then
  # shellcheck disable=SC1090
  . "$HOME/.config/trames/lanceur.env"
  code="$(curl -sS --max-time 12 -o /dev/null -w '%{http_code}' -X POST \
    -H "x-lanceur-secret: ${LANCEUR_SECRET:-}" "${LANCEUR_URL:-}/api/ecouteur?action=trousseau" -d '{"comptes":[]}' || echo 0)"
  case "$code" in
    200) vert "$LANCEUR_URL sert bien l'application courante" ;;
    404) rouge "$LANCEUR_URL sert une version ANCIENNE (elle ignore l'action « trousseau ») — réaliaser ou corriger LANCEUR_URL" ;;
    *) saute "API injoignable (HTTP $code) — Mac hors ligne ou secret invalide" ;;
  esac
else saute "écouteur non configuré sur cette machine"; fi

echo
printf '%s réussis · %s échoués · %s sautés (un contrôle sauté n’est PAS un contrôle réussi)\n' "$OK" "$KO" "$SAUTES"
[ "$KO" -eq 0 ]
