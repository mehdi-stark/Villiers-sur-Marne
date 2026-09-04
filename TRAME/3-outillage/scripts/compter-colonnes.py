#!/usr/bin/env python3
"""Compte les champs EMIS par preparer-demandes.py et ceux LUS par ecouter.sh.

Un champ ajoute d'un cote et pas de l'autre decale toute la ligne en silence :
le profil devient le mode, le mode devient un chemin. Ce controle a ete ecrit
apres l'incident des tabulations (03/09) pour que ca ne se rejoue jamais.
"""
import re
import sys

ici = sys.argv[1] if len(sys.argv) > 1 else "."
py = open(f"{ici}/app/preparer-demandes.py").read()
sh = open(f"{ici}/app/ecouter.sh").read()
m = re.search(r'"\\x1f"\.join\(\[([^\]]*)\]', py)
emis = len([x for x in m.group(1).split(",") if x.strip()]) if m else 0
m2 = re.search(r"IFS=\$'\\x1f' read -r ([a-z_ ]+);", sh)
lus = len(m2.group(1).split()) if m2 else 0
print(f"{emis} {lus}")
