# Cerveau de KairuFlow - Phase 1

## 🎯 Objectif

Implémenter un moteur décisionnel déterministe, explicable, stable et testable SANS IA, qui protège l'utilisateur de la surcharge cognitive et du chaos.

## 🏗️ Architecture

```
src/lib/taskEngine/
├── types.ts              # Interfaces et types
├── energyModel.ts        # Modèle d'énergie bivarié
├── capacityCalculator.ts # Calculateur de capacité cognitive
├── scorer.ts             # Système de scoring
├── selector.ts           # Algorithme de sélection
├── invariantChecker.ts    # Vérificateur d'invariants
├── fallbackHandler.ts    # Gestionnaire de fallbacks
├── edgeCaseHandler.ts    # Gestionnaire de cas limites
├── index.ts              # Point d'entrée
└── __tests__/            # Tests unitaires
    ├── energyModel.test.ts
    ├── capacityCalculator.test.ts
    ├── scorer.test.ts
    ├── selector.test.ts
    ├── invariantChecker.test.ts
    ├── fallbackHandler.test.ts
    └── edgeCaseHandler.test.ts
```

## 🧠 Concepts Clés

### Modèle d'Énergie
L'énergie est représentée par un état bivarié :
```typescript
interface EnergyState {
  level: 'low' | 'medium' | 'high';
  stability: 'volatile' | 'stable';
}
```

### Capacité Cognitive Journalière
La charge cognitive est limitée et surveillée :
```typescript
interface DailyCapacity {
  maxLoad: number;
  usedLoad: number;
  remaining: number;
}
```

### Scoring Canonique
Le score d'une tâche est calculé selon la formule verrouillée :
```
score =
  0.40 * energyAlignment
+ 0.20 * urgency
+ 0.15 * impact
+ 0.10 * effortBalance
+ 0.10 * behavioralPattern
+ 0.05 * diversity
```

## 🛡️ Invariants Absolus

1. **Jamais plus de 5 tâches** dans une playlist
2. **Toujours au moins 1 tâche faisable <15 min**
3. **Charge totale ≤ capacité énergétique du jour**
4. **Pas de tâche "haute énergie" si énergie basse**
5. **Une playlist doit être terminable à 70% minimum**

## 🧪 Tests

Tous les modules sont accompagnés de tests unitaires complets :
- **100% de couverture** des fonctions exportées
- **Tests de cas limites** pour chaque scénario
- **Vérification des invariants** dans toutes les situations

## 🚀 Utilisation

```typescript
import { 
  createEnergyState,
  initializeDailyCapacity,
  generateTaskPlaylist
} from './taskEngine';

// 1. Définir l'état d'énergie
const energy = createEnergyState('medium', 'stable');

// 2. Initialiser la capacité
const capacity = initializeDailyCapacity(10);

// 3. Générer une playlist
const playlist = generateTaskPlaylist(tasks, energy, 5, new Date());

// 4. Valider les invariants
const validation = validatePlaylist(playlist, energy.level, capacity.maxLoad);
```

## 📚 Documentation des Modules

### energyModel.ts
Gère le modèle d'énergie bivarié et la compatibilité des tâches avec l'énergie utilisateur.

### capacityCalculator.ts
Calcule la charge cognitive des tâches et gère la capacité journalière.

### scorer.ts
Implémente le système de scoring canonique pour évaluer les tâches.

### selector.ts
Contient l'algorithme de sélection des tâches selon les règles strictes.

### invariantChecker.ts
Vérifie que toutes les contraintes absolues sont respectées.

### fallbackHandler.ts
Gère les scénarios de repli lorsque les conditions normales ne sont pas remplies.

### edgeCaseHandler.ts
Traite les cas limites complexes identifiés dans la spécification.