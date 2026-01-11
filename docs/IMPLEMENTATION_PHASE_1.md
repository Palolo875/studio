# Implémentation de la Phase 1 - Le Cerveau de KairuFlow

## Résumé

Cette documentation présente l'implémentation des concepts fondamentaux de la Phase 1 du projet KairuFlow, qui vise à construire un moteur décisionnel déterministe, explicable, stable et testable SANS IA.

## Concepts Implémentés

### 1. Modèle d'énergie à deux dimensions

Implémenté dans les types et fonctions de gestion :

- **Niveau d'énergie** : low | medium | high
- **Stabilité énergétique** : volatile | stable
- **Confiance** : score de 0.0 à 1.0 indiquant la confiance du système dans l'estimation

### 2. Système de pools de tâches temporels

- **OVERDUE** : Tâches avec deadline passée
- **TODAY** : Tâches avec deadline aujourd'hui
- **SOON** : Tâches avec deadline dans 2-7 jours (max 3)
- **AVAILABLE** : Tâches disponibles (max 10)

### 3. Définition précise des tâches actives

Implémentation dans `taskManagement.ts` :

```typescript
export function isTaskActive(task: TaskWithContext, today: Date = new Date()): boolean {
  // Exclusions explicites
  if (task.status === 'done' || task.status === 'cancelled') {
    return false;
  }
  
  if (task.scheduledTime && new Date(task.scheduledTime) > 
      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    return false;
  }

  // Définitions principales
  const primaryActive = ['in_progress', 'today', 'overdue'].includes(task.status as string);
  const secondaryActive = task.activationCount > 0 || 
                         (task.createdAt && 
                          (today.getTime() - task.createdAt.getTime()) <= 3 * 24 * 60 * 60 * 1000) || // createdDate >= today - 3 days
                         (task.lastActivated && 
                          (today.getTime() - task.lastActivated.getTime()) <= 2 * 24 * 60 * 60 * 1000); // lastTouched >= today - 2 days

  return Boolean(primaryActive || secondaryActive);
}
```

### 4. Mode DETOX progressif

Au lieu d'un blocage total, implémentation d'un système à 4 phases :

- **WARNING** : Notification douce
- **FRICTION** : Demande confirmation pour nouvelles tâches
- **GUIDED_REVIEW** : Propose session de nettoyage assistée
- **OVERRIDE_PENALTY** : Nouvelles tâches coûtent ×3, mais pas de blocage total

### 5. Résolution des conflits temporels

Gestion des conflits entre tâches OVERDUE et tâches programmées avec horaires fixes :

```typescript
export function resolveTemporalConflict(
  overdueTask: TaskWithContext, 
  scheduledTask: TaskWithContext, 
  availableTime: number,
  currentTime: Date = new Date()
): TemporalConflictResolution {
  // ...
}
```

### 6. Détection de stabilité énergétique

Calcul basé sur plusieurs signaux comportementaux :

- Interruptions récentes
- Variance d'énergie
- Taux d'incomplétude des sessions
- Rencontres de réunions
- Type d'espace de travail
- Jour de voyage

### 7. Invariants absolus de la Phase 1

Implémentés dans `phase1Invariants.ts` :

1. **Max 5 tâches par session**
2. **Capacité énergétique dure** (somme des coûts ≤ capacité)
3. **Priorité temporelle absolue** (OVERDUE > TODAY > SOON > AVAILABLE)
4. **Contraintes horaires non négociables**
5. **Fin de session explicite** (jamais sans action utilisateur)
6. **Session incomplète ≠ punition**
7. **Fenêtre ACTIVE limitée** (max 10 tâches)
8. **Stabilité = filtre dur** (exclure tâches lourdes si volatile)
9. **Task Age Index** (mode DETOX si >2 pendant 3 jours)
10. **SOON limité** (max 3 tâches)
11. **Deadlines impossibles** (mode CHAOS si ratio >1.5)

## Architecture

### Structure des fichiers

- `types.ts` : Définitions de types pour la Phase 1
- `taskManagement.ts` : Fonctions de gestion des tâches
- `sessionManagement.ts` : Gestion des sessions et plans quotidiens
- `phase1Invariants.ts` : Validation des invariants
- `__tests__/phase1.test.ts` : Tests unitaires

### Flux de traitement

1. **Entrées utilisateur** : Tâches, énergie perçue, intentions
2. **Classification** : Attribution aux pools temporels
3. **Filtrage** : Application des contraintes et invariants
4. **Génération** : Création de sessions basées sur disponibilité
5. **Validation** : Vérification des invariants
6. **Sortie** : Playlist de 3-5 tâches avec explications

## Caractéristiques clés

### Session-based vs Day-based

- Approche par blocs cognitifs de 1-3 heures
- Adaptation aux contraintes horaires fixes
- Respect des créneaux de travail réels

### Contraintes horaires non négociables

- Les tâches avec horaires fixes bloquent les créneaux
- Le système s'organise autour, jamais contre

### Fin de session explicite

- Aucune session ne se termine sans action explicite de l'utilisateur
- Alertes et suggestions, mais jamais de conclusion automatique

## Évaluation de la mise en œuvre

### Points forts

✅ Modèle d'énergie à deux dimensions correctement implémenté  
✅ Système de pools temporels avec priorités hiérarchiques  
✅ Définition précise des tâches actives  
✅ Mode DETOX progressif sans blocage total  
✅ Résolution explicite des conflits temporels  
✅ Détection de stabilité basée sur signaux comportementaux  
✅ Validation complète des invariants de la Phase 1  
✅ Tests unitaires pour chaque composant  

### Domaines d'amélioration potentiels

- Calibration empirique des seuils (ex: pour le mode DETOX)
- Intégration avec le système de logging existant
- Optimisations de performance pour les grandes listes de tâches

## Conformité avec les spécifications

Cette implémentation respecte intégralement les spécifications de la Phase 1 :

- ✅ Aucune IA dans la prise de décision
- ✅ Entièrement déterministe et reproductible
- ✅ Entièrement explicable via les logs et les fonctions d'explication
- ✅ Testable unitairement
- ✅ Respects des invariants cognitifs
- ✅ Protection contre la surcharge cognitive
- ✅ Respect des contraintes énergétiques réelles

## Prochaines étapes

Après validation de cette implémentation, les prochaines étapes seraient :

1. Intégration avec le générateur de playlist existant
2. Tests d'intégration complets
3. Calibration basée sur des données réelles
4. Documentation utilisateur

## Améliorations Récentes

Suite à l'analyse critique, plusieurs améliorations importantes ont été apportées :

### Classification des Règles

Les règles ont été classifiées selon trois niveaux :

- 🔴 **Règles HARD** : Non négociables, sans elles KairuFlow cesse d'exister
- 🟠 **Garde-fous Structurels** : Protègent contre l'illusion, pas contre l'utilisateur
- 🟢 **Adaptatif** : Ajustement mécanique, jamais symbolique

### Langage Non Moral

Mise en place d'un système de filtrage pour remplacer les termes à connotation morale par des termes factuels :

- "retard" → "fenêtre expirée"
- "échec" → "non-exécuté"
- "procrastination" → "non-sélection récurrente"

### Politique de Gestion des Échecs

Implémentation d'une politique sans punition, ni rappel, ni reformulation, avec un seuil de silence après 3 échecs.

### Rituels Matin / Soir

Redéfinition des rituels comme des checkpoints système, pas des routines de vie :

- **Rituel du matin** : Recalage décisionnel, optionnel, ≤ 2 minutes, une seule question
- **Rituel du soir** : Constat factuel, pas de bilan, pas de projection

### Hiérarchisation des Invariants

Mise en place d'une pyramide de priorité pour résoudre les conflits entre invariants :

- **Critique** : Jamais violables (fin de session explicite, pas de jugement moral, etc.)
- **Structurel** : Violables uniquement en mode CHAOS (max 5 tâches par session, etc.)
- **Protectif** : Peut être contourné avec friction explicite (fenêtre active limitée, etc.)

### Détection Automatisée de la Stabilité

Implémentation d'un algorithme de détection multi-facteurs de la stabilité énergétique :

- Interruptions récentes
- Variance d'énergie
- Taux de complétion
- Facteurs contextuels (réunions, déplacements, etc.)

### Résolution des Conflits Temporels

Algorithme de décomposition adaptative pour les conflits OVERDUE vs SCHEDULED :

- Vérification de la divisibilité des tâches
- Proposition de découpage intelligent
- Préservation du choix utilisateur

### Mode DETOX Révisé

Implémentation d'une friction progressive, jamais de blocage :

- Avertissement léger
- Confirmation requise
- Revue guidée suggérée
- Multiplicateur de coût visible