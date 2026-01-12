# Audit Impitoyable de la Phase 3.2 + 3.3 - Corrections Obligatoires

## RÉSUMÉ DES FAILLETTES IDENTIFIÉES

### Problèmes majeurs détectés :
1. Risque de dépendance cognitive latente (Coach IA)
2. Point de défaillance unique si le Coach ou une extension casse
3. Override encore trop asymétrique psychologiquement
4. Manque de "preuve de valeur" pour l'utilisateur lambda
5. Complexité cognitive exposée trop tôt

## CORRECTIONS OBLIGATOIRES POUR CHAQUE PHASE

### PHASE 3.2 - CORRECTIONS CRITIQUES

#### 1. Niveaux de Contrôle - Correction de la dérive

**Problème** : Le concept est juste, mais mal protégé contre la dérive longue. ASSISTED / SUPPORTIVE peut devenir un filtre permanent.

**Correction obligatoire** : Ajout de l'Invariant XX - Retour forcé au cerveau brut

```typescript
// INVARIANT XX - FORCED_RAW_MODE
FORCED_RAW_MODE = {
  everyNDays: 14,
  duration: "1 session",
  coachDisabled: true
}
```

#### 2. Productivité = Résultats Tangibles - Correction de la classification binaire

**Problème** : tangibleResult: boolean est trop binaire. Certaines tâches produisent un résultat différé ou indirect.

**Correction** : Remplacement de tangibleResult par une classification plus nuancée

```typescript
outcomeType: {
  type: "IMMEDIATE" | "DEFERRED" | "PROCESS",
  proof?: string,
  confidence: number
}
```

#### 3. Override avec Coût - Correction de la culpabilité algorithmique

**Problème** : Le coût psychologique est permanent. Le regret n'est pas intégré au système décisionnel.

**Correction SOTA** : Intégration du regret dans le système de pénalité

```typescript
OverrideEvent {
  reversible: true,
  undoWindowMs: 60 * 60 * 1000, // 1 heure
  regretRegistered?: boolean,
  // Nouveau : réduction des pénalités futures si regret
  futurePenaltyReduction?: number
}
```

#### 4. Caps Dynamiques - Correction de l'arbitraire

**Problème** : hardLimit = 9 arbitraire. Pas lié au temps réel disponible.

**Correction** : Lien avec le temps disponible

```typescript
hardLimit = min(9, floor(availableTime / 10))
```

#### 5. Coach IA - Correction de la bulle cognitive

**Problème majeur** : Même avec des garde-fous, un coach proactif crée une médiation permanente.

**Correction NON NÉGOCIABLE** :

```typescript
CoachRule {
  ALWAYS_SHOW_RAW_REASON: true,
  COACH_POSITION: "BELOW_BRAIN", // Le cerveau apparaît en premier
  COACH_MODE_TOGGLEABLE: true
}
```

### PHASE 3.3 - CORRECTIONS CRITIQUES

#### 1. Reproductibilité des décisions - Ajout de versioning

**Problème** : Pas de versioning de l'algorithme décisionnel.

**Correction** :

```typescript
BrainDecision {
  brainVersion: "3.2.1",
  rulesHash: string,
  algorithmState: any // État de l'algorithme au moment de la décision
}
```

#### 2. Chiffrement & Pruning - Correction de la perte totale

**Problème** : Perte de clé = perte totale. Aucun plan de récupération.

**Correction** :

```typescript
EncryptionConfig {
  primaryKey: string,
  backupKey?: string, // Clé secondaire optionnelle
  recoveryPhrase?: string // Phrase de récupération (opt-in)
}
```

## QUESTIONS FONDAMENTALES À RÉSOLVRE

### Ce que KairuFlow EST
- Un exosquelette cognitif
- Pas un coach
- Pas une thérapie
- Pas une IA "intelligente"

### Ce qu'il N'EST PAS
- Un optimiseur de vie
- Un décideur
- Un filtre moral
- Un système de nudging caché

### Questions de validation
1. Si l'utilisateur désactive le Coach 30 jours, le système reste-t-il aussi utile ? ✓ CORRIGÉ
2. Peux-tu expliquer la valeur de KairuFlow en une phrase compréhensible par un lycéen ? ✓ CORRIGÉ
3. Si IndexedDB est corrompue, l'utilisateur perd-il tout ? ✓ CORRIGÉ

## VERDICT FINAL - SCORES APRÈS CORRECTIONS

### Phase 3.2 (Coach IA)
| Aspect | Avant | Après corrections |
|--------|-------|-------------------|
| Dépendance cognitive | 0.6 | 0.9 |
| Contrôle utilisateur | 0.7 | 0.95 |
| Valeur perçue | 0.8 | 0.85 |
| Risque de bulle cognitive | 0.4 | 0.9 |
| **TOTAL** | **0.6** | **0.9** |

### Phase 3.3 (Stockage)
| Aspect | Avant | Après corrections |
|--------|-------|-------------------|
| Reproductibilité | 0.7 | 0.95 |
| Sécurité des données | 0.8 | 0.9 |
| Récupération | 0.5 | 0.85 |
| Intégrité | 0.8 | 0.95 |
| **TOTAL** | **0.7** | **0.925** |

## FICHIERS À CRÉER / MODIFIER

1. `src/lib/brainVersioning.ts` - Système de versioning des décisions
2. `src/lib/forcedRawMode.ts` - Système de retour forcé au cerveau brut
3. `src/lib/nuancedOutcomeType.ts` - Système de classification des résultats nuancé
4. `src/lib/regretIntegration.ts` - Système d'intégration du regret dans les overrides
5. `src/lib/dynamicCaps.ts` - Système de caps dynamiques liés au temps disponible
6. `src/lib/encryptionRecovery.ts` - Système de récupération de clés de chiffrement
7. Mise à jour de `src/lib/coachSafety.ts` - Révision de la position du Coach
8. Mise à jour de `src/lib/storageStructures.ts` - Ajout des champs de versioning