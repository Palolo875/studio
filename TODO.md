# 📋 PLAN D'IMPLÉMENTATION PHASE 1 - CERVEAU DE KAIRUFLOW

## 🎯 OBJECTIF GLOBAL
Implémenter une architecture clean, irréprochable et exceptionnelle pour le Cerveau de KairuFlow, en suivant les meilleures pratiques possibles.

## 🧠 PHASE 1 - FONDATIONS ABSOLUES

### 1. DÉFINITION DU RÔLE DU CERVEAU
- [ ] Clarifier radicalement que KairuFlow protège l'utilisateur de la surcharge et du chaos
- [ ] Documenter que l'utilisateur reste souverain dans ses choix
- [ ] Formaliser les missions du cerveau : filtrer, contraindre, équilibrer, rendre explicite, empêcher l'auto-sabotage

### 2. ENTRÉES / SORTIES - CONTRAT FORMEL
- [ ] Définir strictement les entrées autorisées :
  - [ ] Énergie perçue (self-report)
  - [ ] Intention (optionnelle)
  - [ ] Tâches existantes (structurées)
  - [ ] Historique comportemental (faits, pas interprétations)
  - [ ] Contexte temporel (jour, heure, deadlines)
- [ ] Spécifier les sorties autorisées :
  - [ ] Playlist 3-5 tâches MAX
  - [ ] Ordre implicite (pas impératif)
  - [ ] Explication courte (optionnelle)
  - [ ] Avertissements silencieux (overload, pattern)

### 3. INVARIANTS ABSOLUS
- [ ] Codifier les invariants cognitifs :
  - [ ] Jamais plus de 5 tâches
  - [ ] Toujours au moins 1 tâche faisable <15 min
  - [ ] Charge totale ≤ capacité énergétique du jour
  - [ ] Pas de tâche "haute énergie" si énergie basse
  - [ ] Une playlist doit être terminable à 70% minimum

### 4. MODÈLE D'ÉNERGIE
- [ ] Implémenter le modèle bivarié :
  ```typescript
  EnergyState = {
    level: low | medium | high
    stability: volatile | stable
  }
  ```
- [ ] Documenter pourquoi une énergie "haute mais volatile" ≠ "haute stable"

### 5. CAPACITÉ JOURNALIÈRE
- [ ] Implémenter l'Anti-Hustle System :
  ```typescript
  DailyCapacity = sum(task.cost)
  task.cost = effort * energyMismatchFactor
  ```
- [ ] Implémenter le calcul du coût variable selon le contexte

### 6. SCORE - MAIS PAS N'IMPORTE COMMENT
- [ ] Implémenter la formule canonique verrouillée :
  ```typescript
  score =
    0.40 * energyAlignment
  + 0.20 * urgency
  + 0.15 * impact
  + 0.10 * effortBalance
  + 0.10 * behavioralPattern
  + 0.05 * diversity
  ```
- [ ] Versionner, tester et documenter ces poids

### 7. SÉLECTION - ALGORITHME, PAS IA
- [ ] Implémenter les étapes strictes :
  1. Trier par score
  2. Injecter 1 quick win
  3. Vérifier charge totale
  4. Vérifier diversité
  5. Vérifier invariants
  6. Si échec → fallback
- [ ] Implémenter les fallbacks prévus

### 8. CAS SOMBRES / INVISIBLES
- [ ] Anticiper et gérer :
  - [ ] Utilisateur ment sur son énergie
  - [ ] Utilisateur n'accomplit jamais rien
  - [ ] Utilisateur surcharge volontairement
  - [ ] Utilisateur anxieux (paralysie)
  - [ ] Utilisateur perfectionniste
  - [ ] Journées impossibles (10 urgences réelles)

### 9. CE QUE L'IA N'A PAS LE DROIT DE FAIRE
- [ ] Documenter et implémenter les restrictions :
  - [ ] Proposer ✅
  - [ ] Expliquer ✅
  - [ ] Décomposer ✅
  - [ ] Décider ❌
  - [ ] Forcer ❌
  - [ ] Modifier l'historique ❌
  - [ ] Changer les règles ❌

### 10. TESTS OBLIGATOIRES
- [ ] Implémenter les tests non négociables :
  - [ ] Tests unitaires sur scoring
  - [ ] Tests de journées extrêmes
  - [ ] Tests énergie incohérente
  - [ ] Tests surcharge massive
  - [ ] Tests utilisateur hostile

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
│   │   └── fallbackHandler.ts
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
        └── edgeCases.test.ts
```

### Technologies recommandées
- [ ] TypeScript (typage fort)
- [ ] Jest (tests unitaires)
- [ ] ESLint + Prettier (qualité de code)
- [ ] Documentation JSDoc

## 📋 DÉPENDANCES À INSTALLER

```bash
npm install typescript jest @types/jest ts-jest
npm install eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D husky lint-staged
```

## ✅ CRITÈRES D'ACCEPTATION

### Performance
- [ ] Temps de génération d'une playlist < 100ms
- [ ] Couverture de test > 95%
- [ ] Aucune violation des invariants en production

### Qualité
- [ ] Code revu par au moins 2 personnes
- [ ] Documentation complète de chaque module
- [ ] Exemples d'utilisation fournis

### Sécurité
- [ ] Aucune dépendance vulnérable
- [ ] Validation stricte des entrées
- [ ] Gestion appropriée des erreurs

## 🚀 PROCHAINE PHASE

Une fois la Phase 1 complétée et validée, passer à la Phase 2 - NLP comme capteur structurant.