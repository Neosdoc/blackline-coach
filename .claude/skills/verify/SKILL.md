---
name: verify
description: Vérifie l'application Blackline Coach de bout en bout (4 suites Playwright) après toute modification du fichier HTML. À lancer avant chaque commit.
---

# Vérifier Blackline Coach

1. Installer la dépendance une fois : `cd tests && npm install`
   (Chromium est préinstallé : `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, exécutable `/opt/pw-browsers/chromium` — ne jamais lancer `playwright install`.)
2. Générer la build publique (requise par test-public) : `python3 scripts/build_public.py`
3. Lancer les 4 suites depuis `tests/` :
   - `node test.js` — régression v3.0 : boot, saisie séance complète, persistance, migration héritage, import fusion/remplacement, snapshots, viewports 380/1280
   - `node test-v31.js` — adaptation auto, saisie par série, chrono, terrain, e1RM, forme du jour, HSR, vélo Z1, graphiques, programme externalisé
   - `node test-brief.js` — mode briefing : 6 scènes, fermeture, son, reduced-motion
   - `node test-public.js` — build publique : boot, brief neutre, persistance
4. Exigence : **100 % PASS sur les 4 suites**. Un FAIL = corriger l'app ou le test (si le comportement attendu a légitimement changé), jamais ignorer.
5. Pour toute nouvelle fonctionnalité, ajouter des assertions dans la suite correspondante (ou une nouvelle suite) dans le même commit.

Piège connu : les lignes `.set` contiennent un input `.vin` à droite — dans les tests, cliquer `.set .sl` (le libellé), pas le centre de la ligne.
