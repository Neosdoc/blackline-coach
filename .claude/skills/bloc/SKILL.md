---
name: bloc
description: Générer un bloc d'entraînement importable dans Blackline Coach (fichier JSON avec champ program) — pour un nouveau cycle de l'athlète ou pour un élève.
---

# Générer un bloc d'entraînement importable

L'app utilise ses tables intégrées (bloc 1500 m, 12 semaines) sauf si les données contiennent un champ `program`. Un bloc s'importe comme un backup : Journal → Importer → Fusionner (le programme remplace alors le bloc par défaut sans toucher au journal).

## Format du fichier

```json
{
  "app": "blackline-coach",
  "profile": {},
  "journal": [],
  "achilles": [],
  "program": {
    "name": "NOM DU BLOC",
    "nWeeks": 10,
    "meso": {"1": "M1 · Adaptation"},
    "weeks": {
      "1": {
        "vma":  {"sets": [[6, 400, 105]], "rec": 90, "note": "…"},
        "ss":   {"sets": [[5, 1000, 87]], "rec": 60, "note": "…"},
        "sp":   {"txt": "séance en texte libre", "note": "…"},
        "long": {"min": 60, "note": "…"}
      }
    },
    "toppct": {"1": 75},
    "reps":   {"1": 5},
    "bo":     {"1": 3},
    "deload": {"4": 1}
  }
}
```

## Règles

- `weeks[w]` : 4 clés obligatoires (`vma`, `ss`, `sp`, `long`). Une séance course est soit `{sets:[[n, distance_m, pctVMA]], rec: secondes}` soit `{txt: "libre"}`. `long` prend `{min, note}`.
- `toppct/reps/bo/deload` pilotent les 3 séances de force (top set + back-offs calculés depuis les 1RM du profil). Valeurs manquantes → défauts sûrs (80 % / 3 reps / 2 back-offs).
- Les garde-fous (Foster, ACWR, Achille, adaptation automatique) s'appliquent à tout bloc sans rien coder.
- Toute semaine au-delà de `nWeeks` n'existe pas : borner `profile.week` en conséquence.
- Vérifier le bloc en l'important dans l'app (test rapide : `App._staged = migrate(bloc); App.applyImport('merge')` puis parcourir les semaines) avant de le livrer.
- Pour un élève : livrer aussi un `profile` pré-rempli avec ses tests d'entrée (VMA, 1RM) et `week: 1`.
