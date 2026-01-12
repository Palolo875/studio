/**
 * CONTRACTS FOR PHASE 3 - DECISIONAL BRAIN
 * Implementation of corrected contracts with explicit consent and debt-based budget protection
 */

import { TaskWithContext } from './types';
import { OptimizationScope, DEFAULT_OPTIMIZATION_SCOPE } from './phase3/OptimizationScope';
import { SecureDecisionPolicy } from './phase3/SecureDecisionPolicy';
import { OutcomeType, OutcomeBasedTaskResult } from './phase3/OutcomeTypeSystem';

// Decision Policy with explicit consent requirement
export type DecisionPolicyLevel = "STRICT" | "ASSISTED" | "EMERGENCY";
export interface DecisionPolicy {
  level: DecisionPolicyLevel;
  consentRequired: boolean;
  consentGiven: boolean;
  consentTimestamp?: Date;
  canRevoke: boolean;
  overrideCostVisible: boolean;
}

// Corrected invariant - now includes explicit consent
export interface InvariantI {
  id: 'user_autonomy';
  description: string;
  appliesTo: DecisionPolicyLevel[];
  consentRequired: boolean;
  enforces: boolean;
}

// Task Origin distinction (IMPOSED vs SELF_CHOSEN)
export type TaskOrigin = "IMPOSED" | "SELF_CHOSEN";

// Updated TaskWithContext with origin and consent tracking
export interface EnhancedTaskWithContext extends TaskWithContext {
  origin: TaskOrigin;
  outcomeType?: OutcomeType;  // NEW: Replaces tangibleResult with more nuanced outcome type
  outcomeConfidence?: number; // NEW: Confidence in outcome type classification
  tangibleResult?: boolean;   // DEPRECATED: Kept for backward compatibility
  tangibleResultConfidence?: number; // DEPRECATED: Kept for backward compatibility
  priorityBoosts?: Array<{
    source: string;
    value: number;
    explanation: string;
    visible: boolean;
  }>;
}

// Override Event with explicit cost
export interface OverrideEvent {
  invariantTouched: string;
  userReason: string;
  estimatedCognitiveDebt: number;
  acknowledged: boolean;
  timestamp: Date;
  reversible: boolean;
  undoWindowMs: number; // 1 hour default
}

// Budget Policy - corrected from "inviolable" to "protected with explicit debt"
export interface BudgetPolicy {
  recommended: number;           // e.g., 120 minutes
  used: number;                 // e.g., 180 minutes if over
  overrun: number;              // e.g., 60 minutes over
  debt: CognitiveDebt;
  requiresExplicitAck: boolean;
}

export interface CognitiveDebt {
  type: "cognitive";
  amount: number;               // in minutes
  impact: string;              // e.g., "tomorrow capacity reduced by 30%"
  acknowledged: boolean;
  timestamp: Date;
  estimatedRecoveryTime?: Date;
}

// Emergency Trigger definition
export interface EmergencyTrigger {
  deadlinesImpossible: boolean;  // 180 min work, 60 min available
  allTasksOverdue: boolean;
  userExplicitRequest: boolean;
  systemCannotSuggest: boolean;  // no valid config
  detectedAt: Date;
}

// Task Outcome Tracking
export interface TaskOutcome {
  taskId: string;
  completed: boolean;
  actualDuration: number;
  perceivedEffort: number;
  outcomeType: OutcomeType;  // NEW: Replaces tangibleResult
  outcomeDescription: string;  // NEW: Description of the outcome
  outcomeValue: number;     // NEW: Value of the outcome (0-1)
  outcomeConfidence: number; // NEW: Confidence in outcome classification (0-1)
  tangibleResult?: boolean;  // DEPRECATED: Kept for backward compatibility
  declaredByUser?: boolean;
  inferredBySystem?: boolean;
  confidence?: number;
}

// Corrected Brain Input/Output contracts
export interface BrainInput {
  tasks: EnhancedTaskWithContext[];
  userState: {
    energy: "low" | "medium" | "high";
    stability: "volatile" | "stable";
    linguisticFatigue: boolean;
    linguisticFatigueSignals?: string[]; // Specific signals that triggered fatigue detection
  };
  temporal: {
    currentTime: string; // ISO string
    availableTime: number; // in minutes
    timeOfDay: "morning" | "afternoon" | "evening";
  };
  budget: {
    daily: DailyCognitiveBudget;
    session: SessionBudget;
  };
  constraints: TemporalConstraint[];
  history: BehaviorHistory;
  decisionPolicy: SecureDecisionPolicy; // UPDATED: Using secure decision policy
  optimizationScope: OptimizationScope; // NEW: Defines what the brain can optimize
}

export interface DailyCognitiveBudget {
  maxLoad: number;        // Maximum cognitive load allowed
  usedLoad: number;       // Current cognitive load used
  remaining: number;      // Remaining cognitive load
  lockThreshold: number;  // Threshold below which to lock (e.g., 20%)
}

export interface SessionBudget {
  remaining: number;
  total: number;
}

export interface TemporalConstraint {
  // Define temporal constraint structure
  type: string;
  start: Date;
  end: Date;
  priority: number;
}

export interface BehaviorHistory {
  silentTrigger?: boolean;
  detox?: boolean;
  recovery?: boolean;
  // Add other history fields as needed
}

export interface BrainOutput {
  session: {
    allowedTasks: EnhancedTaskWithContext[];
    maxTasks: number;
    estimatedDuration: number;
    budgetConsumed: number;
  };
  rejected: {
    tasks: EnhancedTaskWithContext[];
    reasons: Map<string, string>; // taskID -> rejection reason
  };
  mode: {
    current: SystemMode;
    reason: string;
    changedFrom?: SystemMode;
  };
  warnings: string[];
  explanations: {
    summary: string;
    perTask: Map<string, string>;
  };
  // CORRECTED guarantees - now properly reflects reality
  guarantees: {
    usedAIdecision: false;
    inferredUserIntent: false;
    optimizedForPerformance: false; // NEW: Explicitly states we don't optimize for performance
    overrodeUserChoice: false;
    forcedEngagement: false;
    // NEW: Explicitly states that decisions require consent
    decisionsRequireExplicitConsent: true;
    // NEW: Explicitly states optimization scope
    optimizationScope: {
      forbidden: ["performance", "importance", "valeur"],
      allowed: ["faisabilité", "charge", "continuité"]
    };
  };
}

export type SystemMode = "NORMAL" | "EMERGENCY" | "SILENT" | "DETOX" | "RECOVERY" | "LOCK" | "CHAOS";

// Core contracts and invariants
export const PHASE_3_INVARIANTS = {
  // CORRECTED Invariant I - now includes explicit consent
  USER_AUTONOMY: {
    id: 'user_autonomy',
    description: 'The brain makes NO final decisions without EXPLICIT USER CONSENT and REVOCABLE permission',
    appliesTo: [] as DecisionPolicyLevel[], // Applied dynamically based on policy
    consentRequired: true,
    enforces: true
  } as InvariantI,

  // Other invariants remain but are properly contextualized
  NO_HIDDEN_MODIFICATIONS: {
    id: 'no_hidden_modifications',
    description: 'The brain does NOT modify priorities WITHOUT explicit visibility to user',
    appliesTo: [] as DecisionPolicyLevel[],
    consentRequired: false, // This invariant is always active
    enforces: true
  },

  BUDGET_PROTECTED_WITH_DEBT: {
    id: 'budget_protected_with_debt',
    description: 'Daily cognitive budget is PROTECTED but OVERRIDABLE with EXPLICIT DEBT acknowledgment',
    appliesTo: [] as DecisionPolicyLevel[],
    consentRequired: true,
    enforces: true
  }
};

// Functions to work with the corrected contracts

/**
 * Checks if a decision policy requires explicit consent
 */
export function policyRequiresConsent(policy: DecisionPolicy): boolean {
  return policy.consentRequired && !policy.consentGiven;
}

/**
 * Validates that a decision policy has proper consent for its level
 */
export function validatePolicyConsent(policy: DecisionPolicy): boolean {
  if (!policy.consentRequired) {
    return true; // No consent needed for this policy
  }
  
  return policy.consentGiven === true;
}

/**
 * Creates a corrected decision policy with explicit consent
 */
export function createDecisionPolicy(level: DecisionPolicyLevel, userHasConsented: boolean): DecisionPolicy {
  return {
    level,
    consentRequired: level !== "STRICT", // ASSISTED and EMERGENCY require consent
    consentGiven: userHasConsented,
    canRevoke: true,
    overrideCostVisible: true
  };
}

/**
 * Calculates dynamic max tasks based on modifiers
 */
export function calculateMaxTasks(input: BrainInput): number {
  const base = 3;
  let modifierTotal = 0;

  // Apply modifiers based on context
  if (input.tasks.some(task => task.origin === "IMPOSED")) {
    modifierTotal += 1; // Bonus for imposed tasks
  }

  if (input.tasks.some(task => task.effort === 'low')) {
    modifierTotal += 0.5; // Small bonus for low-effort tasks
  }

  if (input.decisionPolicy.level === "EMERGENCY") {
    modifierTotal += 1; // Emergency mode gets higher cap
  }

  // Clamp between base and hard limit
  return Math.min(Math.max(base + modifierTotal, 1), 9);
}

/**
 * Updates task with visible priority boosts
 */
export function applyPriorityBoosts(task: EnhancedTaskWithContext, userPreferences: UserPreferences): EnhancedTaskWithContext {
  const boosts = [];
  
  // Boost for outcome types if user prefers certain outcomes
  if (userPreferences.favorTangibleResults && task.outcomeType) {
    // Give higher boost to DELIVERABLE outcomes
    if (task.outcomeType === 'DELIVERABLE') {
      boosts.push({
        source: "user preference: favor deliverable outcomes",
        value: 0.3,
        explanation: "Boosted because task produces deliverable result (user preference)",
        visible: true
      });
    } else if (task.outcomeType === 'PROGRESS') {
      boosts.push({
        source: "user preference: favor progress outcomes",
        value: 0.2,
        explanation: "Boosted because task produces progress result (user preference)",
        visible: true
      });
    }
  }
  
  // Boost for already started tasks
  if (userPreferences.favorStartedTasks && task.activationCount > 0) {
    boosts.push({
      source: "user preference: favor started tasks",
      value: 0.3,
      explanation: "Boosted because task has already been started (user preference)",
      visible: true
    });
  }
  
  // Boost for deadline proximity
  if (task.deadline) {
    const daysUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline <= 2) { // Due in 2 days or less
      boosts.push({
        source: "deadline proximity",
        value: 0.5,
        explanation: "Boosted because deadline is approaching",
        visible: true
      });
    }
  }

  return {
    ...task,
    priorityBoosts: boosts
  };
}

// User preferences that affect task scoring
export interface UserPreferences {
  favorTangibleResults: boolean;  // DEPRECATED: Will be replaced by outcome preferences
  favorStartedTasks: boolean;
  favorLowEffort: boolean;
  favoredOutcomeTypes?: OutcomeType[];  // NEW: Preferred outcome types
  prioritizeFinitude: boolean;        // NEW: Whether to prioritize task completion/finitude
}

// Default preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favorTangibleResults: false,
  favorStartedTasks: false,
  favorLowEffort: false,
  favoredOutcomeTypes: ['DELIVERABLE', 'PROGRESS'],
  prioritizeFinitude: true
};