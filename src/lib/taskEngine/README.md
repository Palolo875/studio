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
├── sessionManager.ts     # Gestionnaire de sessions
├── taskPoolManager.ts    # Gestionnaire de pools de tâches
├── taskAgeIndex.ts       # Calculateur du Task Age Index
├── timeConstraintManager.ts # Gestionnaire de contraintes horaires
├── energyStabilityDetector.ts # Détecteur de stabilité énergétique
├── deadlineManager.ts    # Gestionnaire de deadlines impossibles
├── activeWindowManager.ts # Gestionnaire de fenêtre active
├── index.ts              # Point d'entrée
└── __tests__/            # Tests unitaires
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

## 🧠 Concepts Clés

### Modèle d'Énergie
L'énergie est représentée par un état bivarié :
```typescript
interface EnergyState {
  level: 'low' | 'medium' | 'high';
  stability: 'volatile' | 'stable';
  confidence?: number; // Confiance dans l'état (0.0-1.0)
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

### Architecture Session-Based
Au lieu d'une planification journalière, le système repose sur une planification par session :
- Sessions de 2h chacune
- Maximum 5 tâches par session
- Énergie prévue par créneau
- Contraintes horaires fixes respectées

### Pools de Tâches
Les tâches sont organisées en pools hiérarchisés :
1. **OVERDUE** - Tâches en retard
2. **TODAY** - Tâches du jour
3. **SOON** - Tâches dans 2-7 jours (max 3)
4. **AVAILABLE** - Tâches disponibles (max 10)

Règle d'or : Si OVERDUE ou TODAY non vide, SOON & AVAILABLE invisibles.

### Task Age Index (TAI) et Mode DETOX
- **TAI** : Âge moyen du backlog
- **Mode DETOX** : Activé si TAI > 2 pendant 3 jours consécutifs
  - Gèle les tâches SOON
  - Limite TODAY à 2 tâches
  - Permet 1 tâche manuelle (coût triplé)

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

### sessionManager.ts
Gère l'architecture session-based avec les créneaux horaires.

### taskPoolManager.ts
Organise les tâches dans les différents pools hiérarchisés.

### taskAgeIndex.ts
Calcule le Task Age Index et gère le mode DETOX.

### timeConstraintManager.ts
Gère les contraintes horaires fixes et la planification autour de celles-ci.

### energyStabilityDetector.ts
Détecte la stabilité énergétique à partir de l'historique et du contexte.

### deadlineManager.ts
Gère les situations de deadlines impossibles avec le mode TRIAGE.

### activeWindowManager.ts
Gère la fenêtre active avec plafond de 10 tâches actives.
