# 📋 PLAN D'IMPLÉMENTATION PHASE 1 - CERVEAU DE KAIRUFLOW

## 🎯 OBJECTIF GLOBAL
Implémenter une architecture clean, irréprochable et exceptionnelle pour le Cerveau de KairuFlow, en suivant les meilleures pratiques possibles.

## 🧠 PHASE 1 - FONDATIONS ABSOLUES

### 1. DÉFINITION DU RÔLE DU CERVEAU
- [x] Clarifier radicalement que KairuFlow protège l'utilisateur de la surcharge et du chaos
- [x] Documenter que l'utilisateur reste souverain dans ses choix
- [x] Formaliser les missions du cerveau : filtrer, contraindre, équilibrer, rendre explicite, empêcher l'auto-sabotage

### 2. ENTRÉES / SORTIES - CONTRAT FORMEL
- [x] Définir strictement les entrées autorisées :
  - [x] Énergie perçue (self-report)
  - [x] Intention (optionnelle)
  - [x] Tâches existantes (structurées)
  - [x] Historique comportemental (faits, pas interprétations)
  - [x] Contexte temporel (jour, heure, deadlines)
- [x] Spécifier les sorties autorisées :
  - [x] Playlist 3-5 tâches MAX
  - [x] Ordre implicite (pas impératif)
  - [x] Explication courte (optionnelle)
  - [x] Avertissements silencieux (overload, pattern)

### 3. INVARIANTS ABSOLUS
- [x] Codifier les invariants cognitifs :
  - [x] Jamais plus de 5 tâches
  - [x] Toujours au moins 1 tâche faisable <15 min
  - [x] Charge totale ≤ capacité énergétique du jour
  - [x] Pas de tâche "haute énergie" si énergie basse
  - [x] Une playlist doit être terminable à 70% minimum

### 4. MODÈLE D'ÉNERGIE
- [x] Implémenter le modèle bivarié :
  ```typescript
  EnergyState = {
    level: low | medium | high
    stability: volatile | stable
  }
  ```
- [x] Documenter pourquoi une énergie "haute mais volatile" ≠ "haute stable"

### 5. CAPACITÉ JOURNALIÈRE
- [x] Implémenter l'Anti-Hustle System :
  ```typescript
  DailyCapacity = sum(task.cost)
  task.cost = effort * energyMismatchFactor
  ```
- [x] Implémenter le calcul du coût variable selon le contexte

### 6. SCORE - MAIS PAS N'IMPORTE COMMENT
- [x] Implémenter la formule canonique verrouillée :
  ```typescript
  score =
    0.40 * energyAlignment
  + 0.20 * urgency
  + 0.15 * impact
  + 0.10 * effortBalance
  + 0.10 * behavioralPattern
  + 0.05 * diversity
  ```
- [x] Versionner, tester et documenter ces poids

### 7. SÉLECTION - ALGORITHME, PAS IA
- [x] Implémenter les étapes strictes :
  1. Trier par score
  2. Injecter 1 quick win
  3. Vérifier charge totale
  4. Vérifier diversité
  5. Vérifier invariants
  6. Si échec → fallback
- [x] Implémenter les fallbacks prévus

### 8. CAS SOMBRES / INVISIBLES
- [x] Anticiper et gérer :
  - [x] Utilisateur ment sur son énergie
  - [x] Utilisateur n'accomplit jamais rien
  - [x] Utilisateur surcharge volontairement
  - [x] Utilisateur anxieux (paralysie)
  - [x] Utilisateur perfectionniste
  - [x] Journées impossibles (10 urgences réelles)

### 9. CE QUE L'IA N'A PAS LE DROIT DE FAIRE
- [x] Documenter et implémenter les restrictions :
  - [x] Proposer ✅
  - [x] Expliquer ✅
  - [x] Décomposer ✅
  - [x] Décider ❌
  - [x] Forcer ❌
  - [x] Modifier l'historique ❌
  - [x] Changer les règles ❌

### 10. TESTS OBLIGATOIRES
- [x] Implémenter les tests non négociables :
  - [x] Tests unitaires sur scoring
  - [x] Tests de journées extrêmes
  - [x] Tests énergie incohérente
  - [x] Tests surcharge massive
  - [x] Tests utilisateur hostile

## 🛠️ ARCHITECTURE SESSION-BASED (CORRECTION MAJEURE)

### 11. ARCHITECTURE SESSION-BASED
- [x] Implémenter l'architecture session-based avec créneaux horaires fixes
- [x] Définir les créneaux horaires et leur énergie associée
- [x] Adapter l'algorithme de sélection pour travailler par session

### 12. SYSTÈME DE POOLS
- [x] Implémenter le système de pools TODAY/OVERDUE/SOON/AVALIABLE
- [x] Implémenter les règles de promotion/dégradation entre pools
- [x] Ajouter les limitations de taille (3 pour SOON, 10 pour AVAILABLE)

### 13. GESTION DE LA STABILITÉ ÉNERGÉTIQUE
- [x] Implémenter la gestion de la stabilité énergétique par créneau
- [x] Implémenter la détection de stabilité énergétique

### 14. TASK AGE INDEX ET MODE DETOX
- [x] Implémenter le Task Age Index (TAI)
- [x] Implémenter le mode DETOX avec ses différentes phases

### 15. GESTION EXPLICITE DE FIN DE SESSION
- [x] Implémenter la gestion explicite de fin de session
- [x] Implémenter les transitions selon les règles définies

### 16. GESTION DES CONTRAINTES HORAIRE FIXES
- [x] Implémenter la gestion des contraintes horaires fixes
- [x] Implémenter l'algorithme de génération de session autour des contraintes

### 17. DÉTECTION DE STABILITÉ ÉNERGÉTIQUE
- [x] Implémenter la détection de stabilité énergétique basée sur l'historique
- [x] Implémenter l'utilisation du contexte pour évaluer la stabilité

### 18. GESTION DES DEADLINES IMPOSSIBLES
- [x] Implémenter l'Invariant XI sur la détection des deadlines impossibles
- [x] Implémenter le mode TRIAGE pour gérer les situations de surcharge extrême

### 19. ACTIVE WINDOW ET GEL DES TÂCHES
- [x] Implémenter l'active window avec plafond de 10 tâches actives
- [x] Implémenter le mécanisme de gel des tâches les plus anciennes

## 🛠️ ARCHITECTURE TECHNIQUE

### Structure des dossiers
```
src/
├── lib/
│   ├── taskEngine/
│   │   ├── energyModel.ts
│   │   ├── capacityCalculator.ts
│   │   ├── scorer.ts
│   │   ├── selector.ts
│   │   ├── invariantChecker.ts
│   │   ├── fallbackHandler.ts
│   │   ├── edgeCaseHandler.ts
│   │   ├── sessionManager.ts
│   │   ├── taskPoolManager.ts
│   │   ├── taskAgeIndex.ts
│   │   ├── timeConstraintManager.ts
│   │   ├── energyStabilityDetector.ts
│   │   ├── deadlineManager.ts
│   │   ├── activeWindowManager.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── task.ts
│   │   ├── energy.ts
│   │   └── playlist.ts
│   └── utils/
│       └── validators.ts
└── tests/
    └── brainPhase1/
        ├── energyModel.test.ts
        ├── capacityCalculator.test.ts
        ├── scorer.test.ts
        ├── selector.test.ts
        ├── invariantChecker.test.ts
        ├── fallbackHandler.test.ts
        ├── edgeCaseHandler.test.ts
        ├── sessionManager.test.ts
        ├── taskPoolManager.test.ts
        ├── taskAgeIndex.test.ts
        ├── timeConstraintManager.test.ts
        ├── energyStabilityDetector.test.ts
        ├── deadlineManager.test.ts
        └── activeWindowManager.test.ts
```

### Technologies recommandées
- [x] TypeScript (typage fort)
- [x] Jest (tests unitaires)
- [x] ESLint + Prettier (qualité de code)
- [x] Documentation JSDoc

## 📋 DÉPENDANCES À INSTALLER

```bash
npm install typescript jest @types/jest ts-jest
npm install eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D husky lint-staged
```

## ✅ CRITÈRES D'ACCEPTATION

### Performance
- [x] Temps de génération d'une playlist < 100ms
- [x] Couverture de test > 95%
- [x] Aucune violation des invariants en production

### Qualité
- [x] Code revu par au moins 2 personnes
- [x] Documentation complète de chaque module
- [x] Exemples d'utilisation fournis

### Sécurité
- [x] Aucune dépendance vulnérable
- [x] Validation stricte des entrées
- [x] Gestion appropriée des erreurs

## 🚀 PROCHAINE PHASE

Une fois la Phase 1 complétée et validée, passer à la Phase 2 - NLP comme capteur structurant.