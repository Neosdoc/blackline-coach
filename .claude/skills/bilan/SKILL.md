---
name: bilan
description: Protocole du bilan hebdomadaire de l'athlète Blackline — quoi demander, quoi vérifier, quelles décisions prendre. À dérouler quand l'utilisateur colle son bilan 7 jours ou son brief complet.
---

# Bilan hebdomadaire Blackline

## Entrée

Demander à l'utilisateur de coller le contenu de **Journal → « Copier mon bilan 7 jours »** (rapide) ou **« Copier le brief complet »** (complet, à privilégier en début de conversation neuve). Ne jamais analyser de mémoire : seules ses données collées font foi.

## Checklist d'analyse (dans cet ordre)

1. **Sécurité d'abord** — Achille : tendance sur 7-10 notes (pas la valeur isolée). >3/10 ou 3 hausses consécutives → vérifier que les adaptations ont été appliquées ; sinon comprendre pourquoi.
2. **Charge** — Foster 7 j vs semaine précédente (couloir ±30 %), ACWR 0,8-1,3, monotonie <2. Un seul dépassement = stabiliser, pas paniquer.
3. **Qualité du sous-seuil** — RPE moyen ≤7. Trop haut = il court trop vite : rappeler la FC (150-160), pas le chrono.
4. **Force** — e1RM par barre depuis les `series[]` vs 1RM profil : proposer les mises à jour (l'app a le bouton). Vérifier que les top sets sortent à RPE ≤8.
5. **Adhérence** — séances faites vs prévues, HSR x/3, vélo Z1. Une adhérence <80 % se traite en simplifiant la semaine, jamais en la densifiant.
6. **Calendrier** — semaine suivante du bloc : décharge ? test ? course ? Anticiper les consignes spécifiques.

## Décisions possibles (du plus léger au plus lourd)

- Ajustement de consignes (allures, charges) → simple message, l'utilisateur applique via Profil/Outils.
- Mise à jour des 1RM/VMA → boutons in-app, guider l'utilisateur.
- Modification du programme lui-même → générer un bloc importable (skill `bloc`), jamais d'édition de code pour un changement de contenu d'entraînement.
- Évolution de l'app → skills `verify` + `release`.

## Règles de coaching non négociables (issues du brief de l'athlète)

- Jamais d'échec sur les barres ; stop à ~20 % de perte de vitesse ; RPE 8 plafond sur les principaux.
- Jamais +10 %/sem de charge ; les décharges se respectent même en forme.
- Achille pilote : >3/10 → rapide devient sous-seuil/vélo, squat devient tempo −20 %. HSR 3×/sem quoi qu'il arrive.
- Le volume Z1 est la marge n°1 (Casado) — c'est lui qu'on augmente en premier, jamais l'intensité.
- Sommeil et chaleur avant tout gadget : 7 h 30 minimum, hydratation systématique l'été.
