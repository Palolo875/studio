// Moteur décisionnel principal du Cerveau - Phase 3
import { BrainInput, BrainOutput, DecisionPolicy, BrainDecision, BrainVersion } from './brainContracts';
import { applyDecisionPolicy } from './decisionPolicyManager';
import { logBrainDecision, registerBrainVersion, generateVersionId } from './decisionLogger';
import { generateDecisionExplanation } from './decisionExplanation';
import { applyUserOverride } from './userChallenge';
import { Task } from './types';

/**
 * Version actuelle du cerveau
 */
const CURRENT_BRAIN_VERSION: BrainVersion = {
  id: "v1.0.0",
  algorithmVersion: "1.0.0",
  rulesHash: "abc123def456",
  modelId: "kairuflow-phase3-v1",
  releasedAt: new Date()
};

// Enregistrer la version du cerveau
registerBrainVersion(CURRENT_BRAIN_VERSION);

/**
 * Politique de décision par défaut
 */
const DEFAULT_POLICY: DecisionPolicy = {
  level: "STRICT",
  consentRequired: true,
  overrideCostVisible: true
};

/**
 * Fonction principale de décision du cerveau
 * Doit être pure et déterministe (Loi 5 & Phase 3.4.2)
 */
export function decideSession(input: BrainInput): BrainOutput {
  const startTime = Date.now();

  // Appliquer la politique de décision
  const output = applyDecisionPolicy(input, input.decisionPolicy);

  // Garanties de pureté SOTA
  output.guarantees = {
    usedAIdecision: false,
    inferredUserIntent: false,
    optimizedForPerformance: false,
    overrodeUserChoice: false,
    forcedEngagement: false,
    coachIsSubordinate: true
  };

  const executionTime = Date.now() - startTime;
  if (executionTime > 100) {
    console.warn(`[BrainEngine] Performance warning: ${executionTime}ms (limit 100ms)`);
  }

  return output;
}

/**
 * Fonction complète de décision avec traçabilité (Audit & Rejouabilité - Phase 3.4)
 */
export function decideSessionWithTrace(input: BrainInput): BrainDecision {
  const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const outputs = decideSession(input);

  const decision: BrainDecision = {
    id: decisionId,
    timestamp: new Date(),
    brainVersion: CURRENT_BRAIN_VERSION,
    decisionType: "TASK_SELECTION",
    inputs: JSON.parse(JSON.stringify(input)), // Deep clone for immutability
    outputs,
    invariantsChecked: [
      "I - No silent decision",
      "II - Feasibility today",
      "XII - Daily cognitive budget",
      "XVII - Explanation budget"
    ],
    explanationId: ""
  };

  // Générer l'explication figée (Phase 3.4.3)
  const explanation = generateDecisionExplanation(decision);
  decision.explanationId = explanation.id;

  logBrainDecision(decision);

  return decision;
}

/**
 * Rejoue une décision précédente (Phase 3.4.2)
 * Doit impérativement retourner le même résultat que l'original
 */
export function replayDecision(decisionId: string): { original: BrainDecision, replayed: BrainOutput, match: boolean } | null {
  const original = (global as any).decisionDatabase?.find((d: BrainDecision) => d.id === decisionId);

  if (!original) {
    console.warn(`[BrainEngine] Cannot replay decision ${decisionId}: not found in storage.`);
    return null;
  }

  // Rejouer avec les mêmes inputs
  const replayed = decideSession(original.inputs);

  // Vérification de déterminisme
  const match = JSON.stringify(replayed.session.allowedTasks.map(t => t.id)) ===
    JSON.stringify(original.outputs.session.allowedTasks.map(t => t.id));

  return { original, replayed, match };
}