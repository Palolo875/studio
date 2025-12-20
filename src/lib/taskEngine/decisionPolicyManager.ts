// Gestionnaire de politique de décision - Phase 3.2
import { BrainInput, BrainOutput, DecisionPolicy, SystemMode } from './brainContracts';
import { Task } from './types';

/**
 * Détection du mode système basé sur les entrées
 */
export function detectSystemMode(input: BrainInput): SystemMode {
  // Mode silencieux si l'utilisateur l'a demandé
  if (input.history.some(h => h.overrideEvents.some(e => e.userReason === "silent_mode"))) {
    return "SILENT";
  }
  
  // Mode urgence si la journée est impossible
  if (detectImpossibleDay(input.tasks, input.temporal.availableTime)) {
    return "EMERGENCY";
  }
  
  // Mode detox si le TAI est trop élevé
  if (detectDetox(input.history)) {
    return "DETOX";
  }
  
  // Mode recovery si l'utilisateur a besoin de repos
  if (detectRecovery(input.history)) {
    return "RECOVERY";
  }
  
  return "NORMAL";
}

/**
 * Détection d'une journée impossible
 */
function detectImpossibleDay(tasks: Task[], availableTime: number): boolean {
  const fixedTasks = tasks.filter(t => t.scheduledTime);
  const totalTimeNeeded = fixedTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
  return totalTimeNeeded > availableTime;
}

/**
 * Détection du mode detox
 */
function detectDetox(history: any[]): boolean {
  // Logique de détection du detox basée sur l'historique
  // Cette fonction serait implémentée plus complètement avec le TAI
  return false;
}

/**
 * Détection du mode recovery
 */
function detectRecovery(history: any[]): boolean {
  // Logique de détection du recovery basée sur l'historique
  return false;
}

/**
 * Applique la politique de décision STRICT
 */
export function applyStrictPolicy(input: BrainInput): BrainOutput {
  // En mode strict, seulement l'élimination est autorisée
  // Pas de recommandation finale
  
  // Utiliser le sélecteur existant mais sans tri
  // (l'implémentation détaillée viendrait ici)
  
  return {
    session: {
      allowedTasks: [],
      maxTasks: 0,
      estimatedDuration: 0,
      budgetConsumed: 0
    },
    rejected: {
      tasks: input.tasks,
      reasons: new Map()
    },
    mode: {
      current: "NORMAL",
      reason: "Politique STRICTE appliquée"
    },
    warnings: [],
    explanations: {
      summary: "Mode STRICTE - Élimination uniquement",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.0.0",
      policy: { level: "STRICT", consentRequired: true, overrideCostVisible: true },
      overrideEvents: []
    }
  };
}

/**
 * Applique la politique de décision ASSISTED
 */
export function applyAssistedPolicy(input: BrainInput): BrainOutput {
  // En mode assisté, tri explicite mais non forcé
  // Ordre expliqué
  
  return {
    session: {
      allowedTasks: input.tasks.slice(0, 3),
      maxTasks: 3,
      estimatedDuration: input.tasks.slice(0, 3).reduce((sum, task) => sum + (task.duration || 0), 0),
      budgetConsumed: 0
    },
    rejected: {
      tasks: input.tasks.slice(3),
      reasons: new Map()
    },
    mode: {
      current: "NORMAL",
      reason: "Politique ASSISTÉE appliquée"
    },
    warnings: [],
    explanations: {
      summary: "Mode ASSISTÉ - Tri explicite mais non forcé",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.0.0",
      policy: { level: "ASSISTED", consentRequired: true, overrideCostVisible: true },
      overrideEvents: []
    }
  };
}

/**
 * Applique la politique de décision EMERGENCY
 */
export function applyEmergencyPolicy(input: BrainInput): BrainOutput {
  // En mode urgence, réalité brute
  // Exposition de l'impossible
  // Choix forcé par l'utilisateur
  // Aucune optimisation cachée
  
  return {
    session: {
      allowedTasks: input.tasks.slice(0, 5),
      maxTasks: 5,
      estimatedDuration: input.tasks.slice(0, 5).reduce((sum, task) => sum + (task.duration || 0), 0),
      budgetConsumed: 0
    },
    rejected: {
      tasks: input.tasks.slice(5),
      reasons: new Map()
    },
    mode: {
      current: "EMERGENCY",
      reason: "Politique D'URGENCE appliquée"
    },
    warnings: [{
      type: "overload_risk",
      message: "Mode urgence activé - charge cognitive élevée",
      severity: "high"
    }],
    explanations: {
      summary: "Mode URGENGE - Réalité brute exposée",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.0.0",
      policy: { level: "EMERGENCY", consentRequired: true, overrideCostVisible: true },
      overrideEvents: []
    }
  };
}

/**
 * Génère un ID de décision unique
 */
function generateDecisionId(): string {
  return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Applique la politique de décision appropriée
 */
export function applyDecisionPolicy(input: BrainInput, policy: DecisionPolicy): BrainOutput {
  switch (policy.level) {
    case "STRICT":
      return applyStrictPolicy(input);
    case "ASSISTED":
      return applyAssistedPolicy(input);
    case "EMERGENCY":
      return applyEmergencyPolicy(input);
    default:
      // Par défaut, appliquer la politique STRICTE
      return applyStrictPolicy(input);
  }
}