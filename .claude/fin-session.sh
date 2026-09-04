#!/bin/bash
# Écrit un résumé mécanique de fin de session (lu par l'écouteur du Lanceur).
cd "$(dirname "$0")/.." || exit 0
{
  date '+%F %T'
  git log -1 --format='dernier commit : %s' 2>/dev/null || echo "pas de commit"
  n="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  echo "fichiers non commités : ${n:-0}"
  if [ -f .claude-consignes.md ]; then
    t="$(grep -ci 'trait' .claude-consignes.md 2>/dev/null || echo 0)"
    r="$(grep -c '^## Consigne re' .claude-consignes.md 2>/dev/null || echo 0)"
    echo "consignes traitées : ${t:-0} / ${r:-0}"
  fi
  # LE MOT DE LA SESSION : .claude-resume.txt, écrit par Claude (verdict d'un
  # cadrage, état d'un maillon). C'est ce texte qu'on lit sur le téléphone.
  # Il ne peut appartenir qu'à la session en cours : LANCER_CLAUDE.command
  # l'efface au démarrage.
  if [ -s .claude-resume.txt ]; then echo; cat .claude-resume.txt; fi
} > .claude-fin.txt
