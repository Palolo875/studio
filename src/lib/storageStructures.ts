/**
 * STORAGE STRUCTURES - PHASE 3.3
 * Structures de données complètes pour la table Tasks et les tables associées
 * 
 * Couvre les besoins identifiés dans la méta-analyse :
 * - Table Tasks incomplète
 * - BrainDecisions manque contexte
 * - Manque table Overrides
 * - Manque table ModeTransitions
 * - Pruning policy
 */

// Structure complète de la table Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  action: string;  // Verbe principal de l'action
  object: string;  // Objet de l'action
  effort: 'low' | 'medium' | 'high';
  deadline?: Date;
  activationCount: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;

  // ← AJOUTS CRITIQUES IDENTIFIÉS DANS LA MÉTA-ANALYSE
  origin: 'IMPOSED' | 'SELF_CHOSEN' | 'UNKNOWN'; // Phase 3.2
  outcomeType?: 'DELIVERABLE' | 'PROGRESS' | 'PREPARATION' | 'LEARNING' | 'REFLECTION' | 'DESIGN' | 'RESEARCH' | 'CREATION' | 'MAINTENANCE' | 'BREAK'; // Remplace tangibleResult
  outcomeConfidence?: number; // Confiance dans le type de résultat
  scheduledTime?: Date; // Phase 1
  nlpHints?: {
    verbAnalysis?: string;
    objectClassification?: string;
    extractedEntities?: string[];
    confidence?: number;
  }; // Phase 2
  cohesionGroup?: string; // Phase 2 - Groupe de tâches cohérentes
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number; // En minutes
  perceivedEffort?: number; // 1-5
  
  // Tracking des overrides
  forcedInSession?: string; // ID de session si forcé
  overrideCost?: number; // Coût cognitif de l'override
  overrideEvents?: OverrideEvent[]; // Historique des overrides
  
  // Métadonnées de suivi
  visibleToUser: boolean; // Si la tâche est visible dans l'UI
  userArchived?: boolean; // Si archivée par l'utilisateur
  systemManaged: boolean; // Si gérée par le système
}

// Structure pour les décisions du cerveau avec contexte complet
export interface BrainDecision {
  id: string;
  taskId: string;
  sessionId: string;
  timestamp: Date;
  
  // Contexte d'entrée complet (inputs)
  inputs: {
    energyState: 'low' | 'medium' | 'high';
    stability: 'volatile' | 'stable';
    linguisticFatigue: boolean;
    linguisticFatigueSignals?: string[];
    dailyBudget: {
      maxLoad: number;
      usedLoad: number;
      remaining: number;
      lockThreshold: number;
    };
    availableTime: number; // minutes
    currentTime: string; // ISO string
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    taskCount: number;
    imposedCount: number;
    selfChosenCount: number;
    sessionBudget: {
      remaining: number;
      total: number;
    };
    temporalConstraints: any[]; // Contraintes temporelles
    behaviorHistory: any; // Historique de comportement
    decisionPolicy: any; // Politique de décision
    optimizationScope: any; // Scope d'optimisation
  };
  
  // Résultats de sortie (outputs)
  outputs: {
    allowed: boolean;
    allowedTasks: string[]; // IDs des tâches autorisées
    rejectedTasks: string[]; // IDs des tâches rejetées
    maxTasksCalculated: number;
    budgetConsumed: number;
    decisionMode: 'STRICT' | 'ASSISTED' | 'EMERGENCY';
  };
  
  // Explications détaillées
  explanations: {
    summary: string;
    perTask: Map<string, string>;
    reason: string; // Raison principale de la décision
    contextFactors: string[]; // Facteurs contextuels pris en compte
  };
  
  // Métriques de performance
  computeTimeMs: number; // Temps de calcul
  decisionType: 'ELIMINATION' | 'PRIORITY' | 'ALLOWANCE' | 'BLOCKAGE';
  
  // Traçabilité
  createdBy: 'SYSTEM' | 'USER_OVERRIDE';
  sourceModule: string; // Module qui a généré la décision
}

// Structure pour la table des overrides
export interface OverrideEvent {
  id: string;
  taskId: string;
  sessionId: string;
  timestamp: Date;
  
  // Informations sur l'invariant touché
  invariantTouched: string; // ID de l'invariant touché
  userReason?: string; // Raison fournie par l'utilisateur
  estimatedCognitiveDebt: number; // Dette cognitive estimée
  acknowledged: boolean; // Si l'utilisateur a reconnu le coût
  
  // Informations de réussite
  succeeded: boolean; // Si l'override a réussi
  actualCost?: number; // Coût réel (peut différer de l'estimation)
  userRegretted?: boolean; // Si l'utilisateur a regretté l'override
  
  // Informations de traçabilité
  createdBy: 'USER' | 'SYSTEM';
  source: 'COACH' | 'BRAIN' | 'MANUAL' | 'EMERGENCY_MODE';
  revertible: boolean; // Si l'override peut être annulé
  undoWindowMs: number; // Fenêtre de temps pour annuler
  undoAvailableUntil?: Date; // Date limite pour annuler
}

// Structure pour la table des transitions de mode
export interface ModeTransition {
  id: string;
  fromMode: 'NORMAL' | 'EMERGENCY' | 'SILENT' | 'DETOX' | 'RECOVERY' | 'LOCK' | 'CHAOS';
  toMode: 'NORMAL' | 'EMERGENCY' | 'SILENT' | 'DETOX' | 'RECOVERY' | 'LOCK' | 'CHAOS';
  timestamp: Date;
  reason: string;
  triggeredBy: 'SYSTEM' | 'USER';
  systemSuggested?: boolean; // Si le système a suggéré le changement
  userConfirmed: boolean; // Si l'utilisateur a confirmé
  decisionPolicyBefore?: any; // Politique de décision avant
  decisionPolicyAfter?: any; // Politique de décision après
  context: {
    energyState: string;
    taskLoad: number;
    constraintConflicts: number;
    userStressIndicators: string[];
  };
}

// Politique de pruning pour gérer la croissance de la base de données
export interface PruningPolicy {
  // Conditions de déclenchement
  trigger: {
    ageInDays: number; // Ex: 90 jours
    maxEventCount: number; // Ex: 50000 événements
    storageUsageThreshold: string; // Ex: "80% de quota"
  };
  
  // Données pouvant être purgées
  prunableData: {
    snapshots: {
      keep: 'one_per_day_after' | 'none';
      retentionPeriod: number; // jours
    };
    completedSessions: {
      retentionPeriod: number; // jours
    };
    resolvedOverrides: {
      retentionPeriod: number; // jours
    };
    coachInteractions: {
      retentionPeriod: number; // jours
      keepIfUserRegret: boolean; // Garder si l'utilisateur regrette
    };
  };
  
  // Données jamais purgées
  neverPrune: string[]; // Liste des types de données à ne jamais purger
  
  // Contrôle utilisateur
  userControl: {
    canDisable: boolean;
    canExport: boolean;
    canRestore: boolean;
    canDeleteArchive: boolean;
    canViewPruningLog: boolean;
  };
}

// Politique de pruning par défaut
export const DEFAULT_PRUNING_POLICY: PruningPolicy = {
  trigger: {
    ageInDays: 90,
    maxEventCount: 50000,
    storageUsageThreshold: "80% de quota"
  },
  prunableData: {
    snapshots: {
      keep: 'one_per_day_after',
      retentionPeriod: 30
    },
    completedSessions: {
      retentionPeriod: 90
    },
    resolvedOverrides: {
      retentionPeriod: 60
    },
    coachInteractions: {
      retentionPeriod: 90,
      keepIfUserRegret: true
    }
  },
  neverPrune: [
    'active_tasks',
    'current_session',
    'brain_guarantees', // Audit permanent
    'mode_transitions', // Analyse long terme
    'user_settings',
    'core_invariants'
  ],
  userControl: {
    canDisable: true,
    canExport: true,
    canRestore: true,
    canDeleteArchive: true,
    canViewPruningLog: true
  }
};

// Interface pour le gestionnaire de pruning
export interface PruningManager {
  policy: PruningPolicy;
  lastRun: Date;
  statistics: {
    totalRecords: number;
    recordsPruned: number;
    storageSaved: number; // En octets
  };
  
  shouldRunPruning(): boolean;
  executePruning(): Promise<PruningResult>;
  getPruningSchedule(): PruningSchedule;
  updateUserPreferences(preferences: Partial<PruningPolicy>): void;
}

// Résultat du processus de pruning
export interface PruningResult {
  success: boolean;
  recordsAffected: number;
  storageFreed: number; // En octets
  errors: string[];
  log: PruningLogEntry[];
}

// Entrée de log pour le pruning
export interface PruningLogEntry {
  timestamp: Date;
  action: 'START' | 'END' | 'ERROR' | 'INFO';
  entity: string; // Type d'entité traitée
  recordsProcessed: number;
  recordsRemoved: number;
  message: string;
}

// Planning de pruning
export interface PruningSchedule {
  enabled: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRun: Date;
  lastSuccessfulRun?: Date;
}

// Gestionnaire de pruning
export class StoragePruningManager implements PruningManager {
  policy: PruningPolicy;
  lastRun: Date = new Date(0);
  statistics = {
    totalRecords: 0,
    recordsPruned: 0,
    storageSaved: 0
  };
  
  constructor(policy: PruningPolicy = DEFAULT_PRUNING_POLICY) {
    this.policy = policy;
  }
  
  shouldRunPruning(): boolean {
    // Vérifier si une des conditions de déclenchement est remplie
    return this.isAgeTriggered() || this.isEventCountTriggered() || this.isStorageTriggered();
  }
  
  private isAgeTriggered(): boolean {
    // Vérifier si des enregistrements sont plus vieux que le seuil
    // Implémentation dépendante de la base de données
    return false; // Placeholder
  }
  
  private isEventCountTriggered(): boolean {
    // Vérifier si le nombre d'événements dépasse le seuil
    // Implémentation dépendante de la base de données
    return false; // Placeholder
  }
  
  private isStorageTriggered(): boolean {
    // Vérifier si l'utilisation de stockage dépasse le seuil
    // Implémentation dépendante de la base de données
    return false; // Placeholder
  }
  
  async executePruning(): Promise<PruningResult> {
    const startTime = Date.now();
    const log: PruningLogEntry[] = [];
    
    log.push({
      timestamp: new Date(),
      action: 'START',
      entity: 'PRUNING_EXECUTION',
      recordsProcessed: 0,
      recordsRemoved: 0,
      message: 'Début de l\'opération de pruning'
    });
    
    try {
      // Implémentation du pruning selon la politique
      // Cette méthode dépendra de la base de données utilisée (Dexie, etc.)
      
      // Placeholder pour le processus de pruning
      const result: PruningResult = {
        success: true,
        recordsAffected: 0,
        storageFreed: 0,
        errors: [],
        log
      };
      
      this.lastRun = new Date();
      return result;
    } catch (error) {
      log.push({
        timestamp: new Date(),
        action: 'ERROR',
        entity: 'PRUNING_EXECUTION',
        recordsProcessed: 0,
        recordsRemoved: 0,
        message: `Erreur lors du pruning: ${error}`
      });
      
      return {
        success: false,
        recordsAffected: 0,
        storageFreed: 0,
        errors: [String(error)],
        log
      };
    }
  }
  
  getPruningSchedule(): PruningSchedule {
    // Calculer la prochaine exécution basée sur la fréquence
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1); // Exemple: quotidien
    
    return {
      enabled: true,
      frequency: 'DAILY',
      nextRun,
      lastSuccessfulRun: this.lastRun
    };
  }
  
  updateUserPreferences(preferences: Partial<PruningPolicy>): void {
    this.policy = { ...this.policy, ...preferences };
  }
}

// Interface pour la validation d'intégrité référentielle
export interface ReferentialIntegrityValidator {
  validateBeforeWrite(entity: any, entityType: string): ValidationResult;
  validateTask(task: Task): ValidationResult;
  validateBrainDecision(decision: BrainDecision): ValidationResult;
  validateOverride(override: OverrideEvent): ValidationResult;
  validateModeTransition(transition: ModeTransition): ValidationResult;
}

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validateur d'intégrité référentielle
export class IntegrityValidator implements ReferentialIntegrityValidator {
  validateBeforeWrite(entity: any, entityType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier que l'entité a un ID
    if (!entity.id) {
      errors.push(`${entityType} manque d'identifiant unique`);
    }
    
    // Vérifier les timestamps
    if (entity.timestamp && !(entity.timestamp instanceof Date)) {
      errors.push(`${entityType} a un timestamp invalide`);
    }
    
    // Vérifier les relations
    if (entity.sessionId && typeof entity.sessionId !== 'string') {
      errors.push(`${entityType} a un sessionId invalide`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateTask(task: Task): ValidationResult {
    const baseValidation = this.validateBeforeWrite(task, 'Task');
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];
    
    // Validation spécifique à Task
    if (!task.title || task.title.trim().length === 0) {
      errors.push('Task manque de titre');
    }
    
    if (!['IMPOSED', 'SELF_CHOSEN', 'UNKNOWN'].includes(task.origin)) {
      errors.push('Task a une origine invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateBrainDecision(decision: BrainDecision): ValidationResult {
    const baseValidation = this.validateBeforeWrite(decision, 'BrainDecision');
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];
    
    // Validation spécifique à BrainDecision
    if (!decision.inputs || !decision.outputs) {
      errors.push('BrainDecision manque de contexte d\'entrée ou de sortie');
    }
    
    if (!decision.explanations || !decision.explanations.reason) {
      errors.push('BrainDecision manque d\'explication');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateOverride(override: OverrideEvent): ValidationResult {
    const baseValidation = this.validateBeforeWrite(override, 'OverrideEvent');
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];
    
    // Validation spécifique à OverrideEvent
    if (override.estimatedCognitiveDebt < 0) {
      errors.push('OverrideEvent a une dette cognitive estimée négative');
    }
    
    if (!override.invariantTouched) {
      errors.push('OverrideEvent manque d\'identification de l\'invariant touché');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateModeTransition(transition: ModeTransition): ValidationResult {
    const baseValidation = this.validateBeforeWrite(transition, 'ModeTransition');
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];
    
    // Validation spécifique à ModeTransition
    if (!transition.fromMode || !transition.toMode) {
      errors.push('ModeTransition manque de modes de transition');
    }
    
    if (transition.fromMode === transition.toMode) {
      warnings.push('ModeTransition identique (mode inchangé)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Constantes pour les messages d'intégrité
export const INTEGRITY_MESSAGES = {
  INVALID_ENTITY: (type: string, errors: string[]) => 
    `Entité ${type} invalide: ${errors.join(', ')}`,
  REFERENTIAL_INTEGRITY_ERROR: (from: string, to: string, id: string) => 
    `Violation d'intégrité référentielle: ${from} référence ${to} inexistant ${id}`,
  TIMESTAMP_ERROR: (entity: string, field: string) => 
    `Erreur de timestamp dans ${entity}.${field}: doit être une date valide`
};