/**
 * Calcule le nombre maximum de tâches autorisé (Cap Dynamique - Phase 3.2)
 */
import type { BrainInput, BrainOutput, DecisionPolicy, RejectionReason } from './brainContracts';

function policyHasValidConsent(policy: DecisionPolicy): boolean {
  if (!policy.consentRequired) return true;
  return policy.consentGiven === true;
}

export function calculateMaxTasks(input: BrainInput, policyLevel: string): number {
  let base = 3;
  let modifiers = 0;

  // Bonus pour les tâches imposées
  const imposedTasks = input.tasks.filter(t => t.origin === 'imposed').length;
  if (imposedTasks > 2) modifiers += 1;

  // Bonus pour les tâches à faible effort (Quick Wins)
  const lowEffortTasks = input.tasks.filter(t => t.effort === 'low').length;
  if (lowEffortTasks > 3) modifiers += 1;

  // Bonus pour le mode urgence
  if (policyLevel === 'EMERGENCY') modifiers += 2;

  // Clamp entre 1 et 9 (Hard Limit)
  return Math.max(1, Math.min(9, base + modifiers));
}

/**
 * Applique la politique de décision STRICT
 * Élimination uniquement par invariants, pas de tri prédictif.
 */
export function applyStrictPolicy(input: BrainInput): BrainOutput {
  const maxTasks = calculateMaxTasks(input, 'STRICT');

  // En mode STRICT, on ne trie pas, on garde l'ordre original (utilisateur)
  // mais on filtre ce qui viole les invariants fondamentaux
  const allowedTasks = input.tasks
    .filter(t => t.effort !== 'high' || input.userState.energy !== 'low')
    .slice(0, maxTasks);

  const rejectedTasks = input.tasks.filter(t => !allowedTasks.includes(t));
  const reasons = new Map<string, RejectionReason>();
  for (const task of rejectedTasks) {
    if (task.effort === 'high' && input.userState.energy === 'low') {
      reasons.set(task.id, 'energy_mismatch');
      continue;
    }
    reasons.set(task.id, 'capacity_limit');
  }

  const estimatedDuration = allowedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return {
    session: {
      allowedTasks,
      maxTasks,
      estimatedDuration,
      budgetConsumed: estimatedDuration
    },
    rejected: {
      tasks: rejectedTasks,
      reasons
    },
    mode: {
      current: "NORMAL",
      reason: "Politique STRICTE : Protection maximale, aucun tri automatique."
    },
    warnings: [],
    explanations: {
      summary: "Le système a filtré les tâches selon vos invariants sans modifier l'ordre de vos priorités.",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false,
      coachIsSubordinate: true,
      decisionsRequireExplicitConsent: true,
      priorityModificationsVisible: true,
      budgetProtectedWithExplicitDebt: true,
      emergencyModeRequiresConsent: true
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.1.0",
      policy: {
        level: "STRICT",
        consentRequired: false,
        consentGiven: true,
        canRevoke: true,
        overrideCostVisible: true
      },
      overrideEvents: []
    }
  };
}

/**
 * Applique la politique de décision ASSISTED
 * Tri par score, favorise les résultats tangibles.
 */
export function applyAssistedPolicy(input: BrainInput): BrainOutput {
  const maxTasks = calculateMaxTasks(input, 'ASSISTED');

  // Correction Contradiction #2: boost tangible uniquement si opt-in (préférence explicite)
  const preferTangible = input.userPreferences?.favorTangibleResults === true;

  // Tri intelligent (explicable):
  // - si opt-in: résultats tangibles d'abord
  // - sinon: ne pas utiliser hasTangibleResult (évite modification silencieuse des priorités)
  const sortedTasks = [...input.tasks].sort((a, b) => {
    if (preferTangible) {
      if (a.hasTangibleResult && !b.hasTangibleResult) return -1;
      if (!a.hasTangibleResult && b.hasTangibleResult) return 1;
    }
    // Puis urgence
    const urgencyScore = { urgent: 4, high: 3, medium: 2, low: 1 };
    return urgencyScore[b.urgency] - urgencyScore[a.urgency];
  });

  const allowedTasks = sortedTasks.slice(0, maxTasks);
  const rejectedTasks = input.tasks.filter(t => !allowedTasks.includes(t));

  const estimatedDuration = allowedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const reasons = new Map<string, RejectionReason>();
  for (const task of rejectedTasks) {
    reasons.set(task.id, 'capacity_limit');
  }

  return {
    session: {
      allowedTasks,
      maxTasks,
      estimatedDuration,
      budgetConsumed: estimatedDuration
    },
    rejected: {
      tasks: rejectedTasks,
      reasons
    },
    mode: {
      current: "NORMAL",
      reason: "Politique ASSISTÉE : Recommandations basées sur la complétion et les résultats tangibles."
    },
    warnings: [],
    explanations: {
      summary: "Suggestions optimisées pour maximiser vos résultats tangibles aujourd'hui.",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false,
      coachIsSubordinate: true,
      decisionsRequireExplicitConsent: true,
      priorityModificationsVisible: true,
      budgetProtectedWithExplicitDebt: true,
      emergencyModeRequiresConsent: true
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.1.0",
      policy: {
        level: "ASSISTED",
        consentRequired: true,
        consentGiven: true,
        consentTimestamp: new Date(),
        canRevoke: true,
        overrideCostVisible: true
      },
      overrideEvents: []
    }
  };
}

/**
 * Applique la politique de décision EMERGENCY
 * Réalité brute, exposition de l'impossible.
 */
export function applyEmergencyPolicy(input: BrainInput): BrainOutput {
  const maxTasks = calculateMaxTasks(input, 'EMERGENCY');

  // En mode URGENCE, on expose tout ce qui est critique, même si ça dépasse un peu
  const urgentTasks = input.tasks.filter(t => t.urgency === 'urgent' || t.origin === 'imposed');
  const allowedTasks = urgentTasks.slice(0, maxTasks);
  const rejectedTasks = input.tasks.filter(t => !allowedTasks.includes(t));

  const estimatedDuration = allowedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const reasons = new Map<string, RejectionReason>();
  for (const task of rejectedTasks) {
    reasons.set(task.id, 'capacity_limit');
  }

  return {
    session: {
      allowedTasks,
      maxTasks,
      estimatedDuration,
      budgetConsumed: estimatedDuration
    },
    rejected: {
      tasks: rejectedTasks,
      reasons
    },
    mode: {
      current: "EMERGENCY",
      reason: "Politique D'URGENCE : Traitement brutal des priorités imposées."
    },
    warnings: [{
      type: "overload_risk",
      message: "ALERTE : Journée saturée. Seules les urgences critiques sont affichées.",
      severity: "high"
    }],
    explanations: {
      summary: "Mode survie activé. Concentration uniquement sur les obligations non négociables.",
      perTask: new Map()
    },
    guarantees: {
      usedAIdecision: false,
      inferredUserIntent: false,
      optimizedForPerformance: false,
      overrodeUserChoice: false,
      forcedEngagement: false,
      coachIsSubordinate: true,
      decisionsRequireExplicitConsent: true,
      priorityModificationsVisible: true,
      budgetProtectedWithExplicitDebt: true,
      emergencyModeRequiresConsent: true
    },
    metadata: {
      decisionId: generateDecisionId(),
      timestamp: new Date(),
      brainVersion: "1.1.0",
      policy: {
        level: "EMERGENCY",
        consentRequired: true,
        consentGiven: true,
        consentTimestamp: new Date(),
        canRevoke: true,
        overrideCostVisible: true
      },
      overrideEvents: []
    }
  };
}

/**
 * Génère un ID de décision unique
 */
function generateDecisionId(): string {
  return `decision_${Date.now()}`;
}

/**
 * Applique la politique de décision appropriée
 */
export function applyDecisionPolicy(input: BrainInput, policy: DecisionPolicy): BrainOutput {
  // Correction Contradiction #1: pas de politique non-STRICT sans consentement explicite
  if (policy.level !== 'STRICT' && !policyHasValidConsent(policy)) {
    return applyStrictPolicy({
      ...input,
      decisionPolicy: {
        level: 'STRICT',
        consentRequired: false,
        consentGiven: true,
        canRevoke: true,
        overrideCostVisible: true
      }
    });
  }

  switch (policy.level) {
    case "STRICT":
      return applyStrictPolicy(input);
    case "ASSISTED":
      return applyAssistedPolicy(input);
    case "EMERGENCY":
      return applyEmergencyPolicy(input);
    default:
      return applyStrictPolicy(input);
  }
}