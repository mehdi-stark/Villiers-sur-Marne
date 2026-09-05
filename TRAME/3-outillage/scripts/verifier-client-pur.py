#!/usr/bin/env python3
"""Aucun composant CLIENT ne doit importer un module qui touche la base.

Deux fois en deux jours, un fichier partagé entre le rendu serveur et un
composant `"use client"` a tiré le pilote Postgres dans le paquet du
navigateur. Le build casse — bruyamment, donc bien — mais après coup, et il
faut retrouver la chaîne d'import à la main. Ce contrôle la trouve avant.

Usage : verifier-client-pur.py <racine de l'app>   → 0 si tout est pur
"""
import os
import re
import sys

RACINE = sys.argv[1] if len(sys.argv) > 1 else "."
IMPURS = ("./db", "postgres")


def sources():
    for base, dossiers, fichiers in os.walk(RACINE):
        dossiers[:] = [d for d in dossiers if d not in {"node_modules", ".next", ".git"}]
        for f in fichiers:
            if f.endswith((".ts", ".tsx")):
                yield os.path.join(base, f)


def imports(chemin, texte):
    """Les fichiers du projet importés par celui-ci (chemins relatifs résolus)."""
    for m in re.finditer(r'from\s+"(\.[^"]+)"', texte):
        cible = os.path.normpath(os.path.join(os.path.dirname(chemin), m.group(1)))
        for suffixe in (".ts", ".tsx", "/index.ts"):
            if os.path.exists(cible + suffixe):
                yield cible + suffixe
                break


def touche_base(chemin, vus):
    """Ce fichier, ou l'un de ceux qu'il importe, parle-t-il à la base ?

    Un fichier `"use server"` est une FRONTIÈRE : ses imports ne franchissent
    jamais le réseau (le navigateur n'en reçoit qu'un appel distant). S'arrêter
    là évite d'accuser des composants parfaitement sains — un contrôle qui crie
    sur du sain se fait désactiver, donc il ne protège plus rien."""
    if chemin in vus:
        return None
    vus.add(chemin)
    try:
        texte = open(chemin, encoding="utf-8").read()
    except OSError:
        return None
    if texte.lstrip().startswith(('"use server"', "'use server'")):
        return None
    if any(f'from "{i}"' in texte for i in IMPURS):
        return [chemin]
    for suivant in imports(chemin, texte):
        chaine = touche_base(suivant, vus)
        if chaine:
            return [chemin] + chaine
    return None


fautes = []
for f in sources():
    try:
        texte = open(f, encoding="utf-8").read()
    except OSError:
        continue
    if not texte.lstrip().startswith(('"use client"', "'use client'")):
        continue
    for cible in imports(f, texte):
        chaine = touche_base(cible, {f})
        if chaine:
            fautes.append(f"{os.path.relpath(f, RACINE)} → " + " → ".join(os.path.relpath(c, RACINE) for c in chaine))

for x in fautes:
    print(x)
sys.exit(1 if fautes else 0)
