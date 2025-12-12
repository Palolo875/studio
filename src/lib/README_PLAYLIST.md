# Algorithme de Génération de Playlist - KairuFlow

## Objectif
L'algorithme de génération de playlist est le cœur décisionnel de KairuFlow. Il sélectionne dynamiquement 3-5 tâches impactantes basées sur l'état énergétique de l'utilisateur et plusieurs facteurs pondérés.

## Fonctionnalités Clés

### Scoring Dynamique Pondéré (100%)
- **Énergie/État (40%)** : Adaptation aux niveaux d'énergie matinaux
- **Impact Inféré (15%)** : Détection automatique de l'importance des tâches
- **Deadline/Priorité (20%)** : Prise en compte des échéances et priorités
- **Effort/Temps (15%)** : Évaluation de la charge de travail
- **Patterns Historiques (10%)** : Apprentissage automatique des habitudes

### Optimisations de Performance
- **Bulk Operations** : Récupération rapide des tâches avec bulkGet
- **Memoization** : Mise en cache intelligente pour <200ms
- **Équilibre** : Sélection équilibrée des tâches (max 1 L en énergie faible)
- **Fallbacks** : Gestion robuste des erreurs et cas limites

## Architecture

### Fichiers Principaux
1. `playlistGenerator.ts` - Cœur de l'algorithme
2. `scoringRules.ts` - Règles de scoring individuelles
3. `taskDatabase.ts` - Interface avec la base de données Dexie
4. `types.ts` - Types TypeScript partagés

### Intégration
L'algorithme s'intègre avec le store de tâches existant et utilise les données utilisateur pour personnaliser les recommandations.

## Utilisation

### Génération de Playlist
```typescript
import { generatePlaylist } from "./playlistGenerator";

const playlist = await generatePlaylist(tasks, {
  energyLevel: "high",
  currentTime: new Date(),
  userPatterns: currentUserPatterns,
  maxTasks: 5,
  workdayHours: 8
});
```

### Mise à Jour des Patterns
```typescript
import { updateUserPatterns } from "./playlistGenerator";

const updatedPatterns = updateUserPatterns(
  currentUserPatterns,
  selectedTasks,
  completedTasks,
  skippedTasks
);
```

## Spécifications Techniques

### Pondération du Scoring
| Facteur | Poids | Description |
|---------|-------|-------------|
| Énergie | 40% | Adaptation à l'état énergétique |
| Impact | 15% | Importance inférée des tâches |
| Deadline/Prio | 20% | Urgence et priorité |
| Effort | 15% | Charge de travail estimée |
| Historique | 10% | Apprentissage des patterns |

### Règles d'Équilibre
- Maximum 1 tâche "L" (longue) si énergie faible
- Sélection de 3-5 tâches maximum
- Mélange de quick wins et tâches substantielles
- Fallback vers quick wins en cas d'erreur

### Gestion des Erreurs
- Validation des paramètres d'entrée
- Fallback vers tâches de bien-être si DB vide
- Mécanismes de retry en cas d'échec
- Logging détaillé pour le debug

## Exemples d'Utilisation

### Cas 1: Énergie Élevée
L'algorithme privilégie les tâches complexes et créatives.

### Cas 2: Énergie Faible
L'algorithme sélectionne des quick wins et évite les tâches longues.

### Cas 3: Apprentissage Automatique
Après plusieurs shuffles (>2), l'algorithme ajuste les poids pour éviter les types de tâches ignorées.

## Performances
- Temps de génération : <200ms
- Mémoire : Utilisation optimisée avec memoization
- Scalabilité : Bulk operations pour grandes bases de données

## Maintenance
Le code est organisé en modules indépendants pour faciliter la maintenance et les évolutions futures.