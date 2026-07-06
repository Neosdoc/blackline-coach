---
name: release
description: Livrer une nouvelle version de Blackline Coach — checklist complète de la modification jusqu'aux deux déploiements (GitHub Pages + artifact Claude).
---

# Livrer une version de Blackline Coach

1. **Coder** dans `blackline-coach.html` en respectant CLAUDE.md (fichier unique, palette, migration de schéma, aucun ajout de tap à la saisie, infos personnelles uniquement dans le bloc PRIVATE-BRIEF).
2. **Versionner** : bump `BRIEF_VERSION` (format `vX.Y · maj JJ/MM/AAAA`) + ajouter une ligne `- vX.Y : …` dans l'historique des décisions du bloc BRIEF.
3. **Vérifier** : dérouler le skill `verify` (4 suites Playwright, 100 % PASS) + captures d'écran des écrans touchés en 380 px.
4. **Schéma** : si le format des données évolue → incrémenter `SCHEMA_VERSION`, compléter `migrate()` (normalisation sur place, aucun champ jeté), tester la migration depuis un backup de la version précédente.
5. **Git** : la branche de travail est `claude/blackline-coach-resume-esh9jz`. Si sa PR précédente est fusionnée, la recréer depuis `origin/main` (`git checkout -B <branche> origin/main`). Commit descriptif, push, PR vers `main`, merge.
6. **Déploiements** :
   - GitHub Pages : automatique au merge (workflow `pages.yml` → https://neosdoc.github.io/blackline-coach/). Vérifier que le run est vert.
   - Artifact Claude (version complète, privée au compte) : régénérer la copie sans wrapper de document (retirer les lignes `<!DOCTYPE html>`, `<html>`, `<head>`, `</head>`, `<body>`, `</body>`, `</html>`) et redéployer sur la **même URL** : https://claude.ai/code/artifact/ee6b5a1f-112f-4381-8175-e715c9cde87a
7. **Annoncer** à l'utilisateur : ce qui change pour lui à l'usage (pas la mécanique), et si une action de sa part est requise (jamais pour les données : la migration est automatique).
