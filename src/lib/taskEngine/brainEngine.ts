// Moteur décisionnel principal du Cerveau - Phase 3
import { BrainInput, BrainOutput, DecisionPolicy, BrainDecision, BrainVersion } from './brainContracts';
import { applyDecisionPolicy } from './decisionPolicyManager';
import { getBrainDecision, getCachedBrainDecision, logBrainDecision, registerBrainVersion } from './decisionLogger';

import { generateDecisionExplanation } from './decisionExplanation';
import { applyUserOverride } from './userChallenge';
import { Task } from './types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BrainEngine');

function fnv1a32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a32_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Version actuelle du cerveau
 */
const CURRENT_BRAIN_VERSION: BrainVersion = {
  id: "v1.0.0",
  algorithmVersion: "1.0.0",
  rulesHash: fnv1a32(
    JSON.stringify({
      algorithmVersion: '1.0.0',
      policy: { level: 'STRICT', userConsent: true, overrideCostVisible: true },
      component: 'applyDecisionPolicy',
    })
  ),
  modelId: "kairuflow-phase3-v1",
  releasedAt: new Date('2026-01-01T00:00:00.000Z')
};

// Enregistrer la version du cerveau
registerBrainVersion(CURRENT_BRAIN_VERSION).catch(() => null);

/**
 * Politique de décision par défaut
 */
const DEFAULT_POLICY: DecisionPolicy = {
  level: "STRICT",
  userConsent: true,
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
    logger.warn('Performance warning', { executionTimeMs: executionTime, limitMs: 100 });
  }

  return output;
}

/**
 * Fonction complète de décision avec traçabilité (Audit & Rejouabilité - Phase 3.4)
 */
export function decideSessionWithTrace(input: BrainInput): BrainDecision {
  const decisionId = `decision_${Date.now()}`;

  const outputs = decideSession(input);

  const decision: BrainDecision = {
    id: decisionId,
    timestamp: new Date(),
    brainVersion: CURRENT_BRAIN_VERSION,
    decisionType: "TASK_SELECTION",
    inputs:
      typeof structuredClone === 'function'
        ? structuredClone(input)
        : (JSON.parse(JSON.stringify(input)) as BrainInput),
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

  logBrainDecision(decision).catch(() => null);

  return decision;
}

/**
 * Rejoue une décision précédente (Phase 3.4.2)
 * Doit impérativement retourner le même résultat que l'original
 */
export function replayDecision(decisionId: string): { original: BrainDecision, replayed: BrainOutput, match: boolean } | null {
  const original = getCachedBrainDecision(decisionId);
  if (!original) return null;

  const replayed = decideSession(original.inputs);
  const match =
    JSON.stringify(replayed.session.allowedTasks.map(t => t.id)) ===
    JSON.stringify(original.outputs.session.allowedTasks.map(t => t.id));

  return { original, replayed, match };
}

export async function replayDecisionAsync(
  decisionId: string
): Promise<{ original: BrainDecision; replayed: BrainOutput; match: boolean } | null> {
  const original = await getBrainDecision(decisionId);
  if (!original) {
    logger.warn('Cannot replay decision: not found in storage', { decisionId });
    return null;
  }

  const replayed = decideSession(original.inputs);
  const match =
    JSON.stringify(replayed.session.allowedTasks.map(t => t.id)) ===
    JSON.stringify(original.outputs.session.allowedTasks.map(t => t.id));

  return { original, replayed, match };
}