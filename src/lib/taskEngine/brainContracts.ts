// Contrats formels du Cerveau Décisionnel - Phase 3
import { Task, EnergyState } from './types';

/**
 * Contrainte temporelle
 */
export interface TemporalConstraint {
  taskId: string;
  startTime: Date;
  endTime: Date;
  type: 'fixed' | 'preferred' | 'deadline';
}

/**
 * Historique comportemental
 */
export interface BehaviorHistory {
  taskId: string;
  completionRate: number;
  avgDuration: number;
  lastCompleted: Date | null;
  overrideEvents: OverrideEvent[];
}

/**
 * Budget cognitif quotidien
 */
export interface DailyCognitiveBudget {
  maxLoad: number;
  usedLoad: number;
  remaining: number;
  lockThreshold: number;

  recommended?: number;
  overrun?: number;
  debt?: {
    type: 'cognitive';
    amount: number;
    impact: string;
    acknowledged: boolean;
    timestamp: Date;
  };
}

/**
 * Budget de session
 */
export interface SessionBudget {
  maxDuration: number;
  maxTasks: number;
  maxComplexity: number;
}

/**
 * Entrées du cerveau décisionnel (BrainInput) - Phase 3.2
 */
export interface BrainInput {
  tasks: Task[];

  userState: {
    energy: "low" | "medium" | "high";
    stability: "volatile" | "stable";
    linguisticFatigue: boolean;
    linguisticFatigueSignals?: string[];
  };

  temporal: {
    currentTime: Date;
    availableTime: number; // minutes
    timeOfDay: "morning" | "afternoon" | "evening";
  };

  budget: {
    daily: DailyCognitiveBudget;
    session: SessionBudget;
  };

  constraints: TemporalConstraint[];
  history: BehaviorHistory[];

  decisionPolicy: DecisionPolicy;

  userPreferences?: UserPreferences;
}

/**
 * Préférences utilisateur (opt-in) qui autorisent certains boosts visibles
 */
export interface UserPreferences {
  favorTangibleResults: boolean;
  favorStartedTasks: boolean;
}

/**
 * Raison de rejet d'une tâche
 */
export type RejectionReason =
  | "energy_mismatch"
  | "time_constraint"
  | "budget_exceeded"
  | "complexity_too_high"
  | "deadline_conflict"
  | "stability_violation"
  | "diversity_violation"
  | "user_override"
  | "capacity_limit";

/**
 * Mode système
 */
export type SystemMode =
  | "NORMAL"
  | "SILENT"
  | "EMERGENCY"
  | "DETOX"
  | "RECOVERY"
  | "LOCK";

/**
 * Avertissement
 */
export interface Warning {
  type: "budget_low" | "overload_risk" | "stability_issue" | "diversity_issue";
  message: string;
  severity: "low" | "medium" | "high";
}

/**
 * Politique de décision
 */
export interface DecisionPolicy {
  level: "STRICT" | "ASSISTED" | "EMERGENCY";
  consentRequired: boolean;
  consentGiven: boolean;
  consentTimestamp?: Date;
  canRevoke: true;
  overrideCostVisible: true;
}

/**
 * Événement d'override
 */
export interface OverrideEvent {
  invariantTouched: string;
  userReason: string;
  estimatedCognitiveDebt: number;
  acknowledged: boolean;
  timestamp: Date;
  reversible: boolean; 
  undoWindowExpired?: boolean;
}

/**
 * Sorties du cerveau décisionnel (BrainOutput)
 */
export interface BrainOutput {
  session: {
    allowedTasks: Task[];
    maxTasks: number;
    estimatedDuration: number; // minutes
    budgetConsumed: number;
  };

  rejected: {
    tasks: Task[];
    reasons: Map<string, RejectionReason>; // taskId -> reason
  };

  mode: {
    current: SystemMode;
    reason: string;
    changedFrom?: SystemMode;
  };

  warnings: Warning[];

  explanations: {
    summary: string;
    perTask: Map<string, string>; // taskId -> explanation
  };

  guarantees: {
    usedAIdecision: false;
    inferredUserIntent: false;
    optimizedForPerformance: false;
    overrodeUserChoice: false;
    forcedEngagement: false;
    coachIsSubordinate: boolean; 
    decisionsRequireExplicitConsent: true;
    priorityModificationsVisible: true;
    budgetProtectedWithExplicitDebt: true;
    emergencyModeRequiresConsent: true;
  };

  metadata: {
    decisionId: string;
    timestamp: Date;
    brainVersion: string;
    policy: DecisionPolicy;
    overrideEvents: OverrideEvent[];
  };
}

/**
 * Version du cerveau
 */
export interface BrainVersion {
  id: string;
  algorithmVersion: string;
  rulesHash: string;
  modelId: string;
  releasedAt: Date;
}

/**
 * Décision du cerveau pour traçabilité (Audit & Rejouabilité - Phase 3.4)
 */
export interface BrainDecision {
  id: string;
  timestamp: Date;
  brainVersion: BrainVersion;
  decisionType: "TASK_SELECTION" | "MODE_CHANGE" | "BUDGET_LOCK";
  inputs: BrainInput;
  outputs: BrainOutput;
  invariantsChecked: string[]; // règles respectées (Loi 2)
  explanationId: string; // référence explicite figée (Phase 3.4.3)
}

/**
 * Explication figée (Anti-mensonge - Phase 3.4.3)
 */
export interface DecisionExplanation {
  id: string;
  decisionId: string;
  summary: string;        // phrase simple utilisateur
  factors: string[];      // règles déclenchées
  rejectedWhy: Map<string, string>; // raison par taskId
  confidence: number;     // score de robustesse
}