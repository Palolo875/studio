// Types pour la mémoire d'adaptation - Phase 6

// Types énumérés pour les niveaux d'énergie
export type EnergyLevel = "HIGH" | "MEDIUM" | "LOW";

// Types énumérés pour les types de tâches
export type TaskType = "ROUTINE" | "CREATIVE" | "ANALYTICAL" | "COMMUNICATION" | "LEARNING";

// Modes du système
export type SystemMode = "STRICT" | "ASSISTED" | "FLEXIBLE" | "COACH" | "RESTRICTED";

export interface AdaptationSignal {
  userId: string;
  type: "FORCED_TASK" | "REJECTED_SUGGESTION" | "SESSION_OVERRUN" | "MODE_OVERRIDE" | "ENERGY_MISMATCH";
  context: {
    energy: EnergyLevel;
    taskType: TaskType;
    mode: SystemMode;
    fromMode?: SystemMode | 'CURRENT';
    sessionId?: string;
    taskId?: string;
    // Données supplémentaires contextuelles
    timeOfDay?: "MORNING" | "AFTERNOON" | "EVENING";
    dayOfWeek?: number; // 0-6
    duration?: number; // en minutes
  };
  timestamp: number;
}

// Interface pour les paramètres du système
export interface Parameters {
  maxTasks: number;
  strictness: number;
  coachFrequency: number;
  coachEnabled: boolean;
  energyForecastMode: "ACCURATE" | "CONSERVATIVE";
  defaultMode: SystemMode;
  sessionBuffer: number; // en minutes
  estimationFactor: number;
}

export type ParameterName = keyof Parameters;

// Interface pour les deltas de paramètres
export type ParameterDelta = {
  [K in ParameterName]: {
    parameterName: K;
    oldValue: Parameters[K];
    newValue: Parameters[K];
  }
}[ParameterName];

// Interface pour l'historique des adaptations
export interface AdaptationHistory {
  id: string;
  timestamp: number;
  parameterChanges: ParameterDelta[];
  qualityBefore: number;
  qualityAfter: number;
  userConsent: "ACCEPTED" | "REJECTED" | "POSTPONED";
}

export type PersistedAdaptationChange = {
  id: string;
  timestamp: number;
  parameterChanges: ParameterDelta[];
  qualityBefore?: number;
  qualityAfter?: number;
  progress?: unknown;
  userConsent: AdaptationHistory['userConsent'];
};

// Interface pour les ajustements
export interface Adjustment {
  maxTasks?: Parameters['maxTasks'];
  strictness?: Parameters['strictness'];
  coachFrequency?: Parameters['coachFrequency'];
}

// Interface pour les agrégats d'adaptation
export interface AdaptationAggregate {
  week: number; // ISO week number
  patterns: {
    forced_tasks: {
      count: number;
      ratio: number; // vs total tasks
      by_energy: Map<EnergyLevel, number>;
      by_mode: Map<SystemMode, number>;
    };
    rejected_suggestions: {
      count: number;
      ratio: number;
      common_reasons: string[];
    };
    overrun_sessions: {
      count: number;
      avg_overrun_minutes: number;
      typical_time_of_day: "morning" | "afternoon" | "evening";
    };
    mode_overrides: {
      count: number;
      from_to: Map<string, number>; // "STRICT→ASSISTED": 5
    };
  };
  // Signaux dérivés
  signals: {
    needs_more_flexibility: boolean;
    needs_more_structure: boolean;
    energy_estimates_off: boolean;
    mode_mismatch: boolean;
  };
}

// Constantes pour les invariants
export const ADAPTATION_CONSTRAINTS = {
  // INVARIANT XLII
  maxTasks: { min: 3, max: 7 },
  
  // INVARIANT XLIII
  strictness: { min: 0.3, max: 0.8 },
  
  // INVARIANT XLIV
  coachFrequency: { max: 1/15 }, // Maximum 1 fois toutes les 15 minutes
  
  // INVARIANT XLV (NOUVEAU)
  ADAPTATION_VALIDATION: {
    // Toute adaptation doit être **validée par un humain** si :
    threshold: {
      maxTasks: 5,              // Si on dépasse 5, c'est suspect
      strictness: 0.4,          // Si on devient trop laxiste
      overrideRate: 0.7,        // Si l'utilisateur force tout
    },
    
    // Mode conservateur forcé si qualité < 0.5
    forceConservativeMode: true,
    
    // Une adaptation reste **en attente** pendant 7 jours avant application
    validationWindow: 7 * 24 * 60 * 60 * 1000,
    
    // L'utilisateur doit **acquiescer** (ou juste être notifié ?)
    userConsentRequired: true,
  },
  
  // INVARIANT XLVII (NOUVEAU)
  OVERFITTING_PROTECTION: {
    // Une adaptation ne peut être basée que sur **30 jours minimum** de données
    minObservationWindow: 30 * 24 * 60 * 60 * 1000,
    
    // Si l'écart-type des métriques est trop élevé → ne pas adapter
    maxStdDev: 0.3,
    
    // Une adaptation **expire** après 60 jours si non révalidée
    adaptationTTL: 60 * 24 * 60 * 60 * 1000,
    
    // Le système **oublie** les vieux patterns (fading memory)
    forgettingFactor: 0.95,  // Chaque jour, les poids passés ×0.95
  },
  
  // INVARIANT XLVIII (NOUVEAU)
  ADAPTATION_MEMORY: {
    maxAge: 90 * 24 * 60 * 60 * 1000,  // 90 jours
    maxSize: 500,                       // 500 signaux max
    
    // Pruning automatique (déterministe)
    pruneStrategy: "FIFO",  // First In, First Out
    
    // Export avant suppression
    exportBeforePrune: true,
  },
  
  // INVARIANT XLIX (NOUVEAU)
  TRANSPARENCY_BUDGET: {
    maxPerWeek: 3,  // Max 3 ajustements visibles
    summaryOnly: true,  // Afficher seulement un résumé
    detailsOnDemand: true,  // Détails si l'utilisateur clique
  },
  
  // INVARIANT L (NOUVEAU)
  ABUSE_PROTECTION: {
    // Si overrideRate > 80% pendant 14 jours → alerte humaine
    maxOverrideRate: 0.8,
    maxConsecutiveDays: 14,
    
    // Le système **refuse de s'adapter** si c'est de l'abus
    adaptationFreeze: true,
    
    // Proposer de **désactiver le cerveau** (mode manuel pur)
    suggestManualMode: true,
  }
};

// Fonction de clamp pour s'assurer que les paramètres restent dans les bornes
export function clampParameters(params: Parameters): Parameters {
  return {
    ...params,
    maxTasks: Math.max(
      ADAPTATION_CONSTRAINTS.maxTasks.min, 
      Math.min(ADAPTATION_CONSTRAINTS.maxTasks.max, params.maxTasks)
    ),
    strictness: Math.max(
      ADAPTATION_CONSTRAINTS.strictness.min, 
      Math.min(ADAPTATION_CONSTRAINTS.strictness.max, params.strictness)
    ),
    coachFrequency: Math.min(
      ADAPTATION_CONSTRAINTS.coachFrequency.max, 
      params.coachFrequency
    ),
  };
}