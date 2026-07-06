#!/usr/bin/env python3
"""Génère public/index.html : la version publiable de Blackline Coach.

Identique à l'app privée, sauf :
- le brief de reprise personnel (bloc <PRIVATE-BRIEF>) est remplacé par
  une version neutre — l'historique médical, le calendrier personnel et
  les décisions individuelles ne sont pas publiés ;
- deux passages personnels du modal Projet sont neutralisés.

Les données de saisie de chaque utilisateur restent de toute façon
locales à son navigateur : ce script ne concerne que le texte embarqué
dans le code.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "blackline-coach.html"
OUT = ROOT / "public" / "index.html"

M0 = "/*<PRIVATE-BRIEF>"
M1 = "/*</PRIVATE-BRIEF>*/"

PUBLIC_BRIEF = (
    M0 + " (version publiée : brief personnel retiré) */\n"
    'var BRIEF=[\n'
    '"=== BLACKLINE COACH — BRIEF DE REPRISE (version publiée) ===",\n'
    '"",\n'
    '"Cette version publique n\'embarque pas le brief personnel de l\'athlète d\'origine.",\n'
    '"Le bouton \'Copier le brief complet\' reste fonctionnel : il copie l\'état actuel",\n'
    '"de TES données locales (profil, journal, charge, tendon) pour reprendre le suivi",\n'
    '"avec Claude. La méthodologie complète est dans le modal Projet (Accueil).",\n'
    '""].join("\\n");\n'
    + M1
)

REPLACEMENTS = [
    ("post-Nyons", "post-course"),
    ("PB 1h10 → sub-1h passe par", "le sub-1 h passe par"),
]

BANNED = ["Nyons", "EPMS", "tendinopathie", "poussette", "PB 1h10", "PB actuel"]


def main():
    src = SRC.read_text(encoding="utf-8")
    i0 = src.find(M0)
    i1 = src.find(M1)
    if i0 < 0 or i1 <= i0:
        sys.exit("marqueurs PRIVATE-BRIEF introuvables")
    out = src[:i0] + PUBLIC_BRIEF + src[i1 + len(M1):]
    for a, b in REPLACEMENTS:
        out = out.replace(a, b)
    leftovers = [w for w in BANNED if w in out]
    if leftovers:
        sys.exit("informations personnelles restantes dans la build : %s" % leftovers)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(out, encoding="utf-8")
    print("OK: %s (%d Ko)" % (OUT, len(out) // 1024))


if __name__ == "__main__":
    main()
