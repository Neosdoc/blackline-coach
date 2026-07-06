# Blackline Coach

Application de suivi d'entraînement (1500 m + force + Hyrox) : **un seul fichier HTML** (`blackline-coach.html`), CSS et JS inline, zéro dépendance, zéro serveur, utilisable hors-ligne. Utilisateur principal : un athlète hybride qui saisit en salle/piste sur mobile et fait son bilan le dimanche sur desktop.

## Contraintes non négociables

- Fichier HTML unique en sortie. Pas de framework, pas de build, pas de CDN, aucune requête réseau.
- Mobile-first 380 px ; zones tactiles ≥ 44 px ; focus clavier visible ; `prefers-reduced-motion` respecté.
- La saisie d'une séance ne doit jamais demander plus de taps qu'avant une modification.
- Direction artistique « poste de commandement » (document militaire FR sobre) : palette stricte dans les tokens `:root` (nuit opérationnelle, toile de tente, ranger green, sable délavé, gris treillis, orange marquage, vert validé). Interdits : dégradés décoratifs, glassmorphism, néons, bleu tech, style HUD jeu vidéo.
- Display condensé + monospace tabulaire pour TOUTES les valeurs numériques.

## Données

- Persistance : localStorage (clé unique `blc:data`) + fichier disque lié (File System Access API, handle en IndexedDB) + snapshots tournants (`blc:snaps`, 5) + export/import JSON.
- `SCHEMA_VERSION` courant : 4. **Toute évolution du format passe par `migrate()`** — normalisation sur place, jamais de champ jeté, jamais de perte. Les champs des entrées journal existants ne changent jamais de sens.
- Le programme d'entraînement est externalisable : champ `program` du JSON (`name/nWeeks/weeks/toppct/reps/bo/deload/meso`), fallback sur les tables intégrées.

## Confidentialité (important)

- Le brief personnel de l'athlète est délimité par les marqueurs `/*<PRIVATE-BRIEF>*/ … /*</PRIVATE-BRIEF>*/`. **Ne jamais mettre d'information personnelle (santé, dates, lieux, métier) hors de ce bloc.**
- `scripts/build_public.py` génère `public/index.html` (version expurgée) et **échoue si un terme sensible subsiste** — maintenir sa liste `BANNED` à jour si de nouvelles infos personnelles entrent dans le bloc.

## Tests et livraison

- Tests Playwright dans `tests/` (voir skill `verify`). Tout changement de code passe par les 4 suites avant commit.
- Déploiement : merge sur `main` → le workflow `pages.yml` construit la version publique et la déploie sur https://neosdoc.github.io/blackline-coach/ automatiquement.
- La version complète (avec brief personnel) est aussi publiée comme artifact Claude : https://claude.ai/code/artifact/ee6b5a1f-112f-4381-8175-e715c9cde87a — redéployer sur la même URL après chaque évolution (voir skill `release`).
- À chaque évolution : bump `BRIEF_VERSION` + ajouter une ligne de décision dans le bloc BRIEF (historique des versions, format existant).
