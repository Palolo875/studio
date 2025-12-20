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
 */
export function decideSession(input: BrainInput): BrainOutput {
  // Démarrer le chronomètre pour respecter la contrainte de performance
  const startTime = Date.now();
  
  // Détection du mode système
  // const mode = detectSystemMode(input);
  
  // Pour l'instant, utiliser la politique par défaut
  const policy = DEFAULT_POLICY;
  
  // Appliquer la politique de décision
  const output = applyDecisionPolicy(input, policy);
  
  // Vérifier la contrainte de performance (100ms max)
  const executionTime = Date.now() - startTime;
  if (executionTime > 100) {
    console.warn(`[BrainEngine] Temps d'exécution élevé: ${executionTime}ms`);
  }
  
  return output;
}

/**
 * Fonction complète de décision avec traçabilité
 */
export function decideSessionWithTrace(input: BrainInput): BrainDecision {
  // Générer un ID de décision unique
  const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Exécuter la décision
  const outputs = decideSession(input);
  
  // Créer l'objet de décision complet
  const decision: BrainDecision = {
    id: decisionId,
    timestamp: new Date(),
    brainVersion: CURRENT_BRAIN_VERSION,
    decisionType: "TASK_SELECTION",
    inputs: input,
    outputs,
    invariantsChecked: [
      "maxTasks=5",
      "totalLoad≤capacity",
      "energyMismatch=false",
      "diversity=true"
    ],
    explanationId: ""
  };
  
  // Générer l'explication
  const explanation = generateDecisionExplanation(decision);
  decision.explanationId = explanation.id;
  
  // Logger la décision
  logBrainDecision(decision);
  
  return decision;
}

/**
 * Applique un override utilisateur avec traçabilité
 */
export function applyUserOverrideWithTrace(
  decisionId: string,
  invariantTouched: string,
  userReason: string,
  estimatedCognitiveDebt: number
): BrainDecision {
  // Appliquer l'override
  const overrideEvent = applyUserOverride(invariantTouched, userReason, estimatedCognitiveDebt);
  
  // Récupérer la décision originale
  // Dans une vraie implémentation, cela viendrait de la base de données
  const originalDecision: BrainDecision = {
    id: decisionId,
    timestamp: new Date(),
    brainVersion: CURRENT_BRAIN_VERSION,
    decisionType: "TASK_SELECTION",
    inputs: {
      tasks: [],
      userState: {
        energy: "medium",
        stability: "stable",
        linguisticFatigue: false
      },
      temporal: {
        currentTime: new Date(),
        availableTime: 120,
        timeOfDay: "morning"
      },
      budget: {
        daily: {
          maxLoad: 100,
          usedLoad: 50,
          remaining: 50,
          lockThreshold: 20
        },
        session: {
          maxDuration: 120,
          maxTasks: 5,
          maxComplexity: 10
        }
      },
      constraints: [],
      history: []
    },
    outputs: {
      session: {
        allowedTasks: [],
        maxTasks: 0,
        estimatedDuration: 0,
        budgetConsumed: 0
      },
      rejected: {
        tasks: [],
        reasons: new Map()
      },
      mode: {
        current: "NORMAL",
        reason: "Initial"
      },
      warnings: [],
      explanations: {
        summary: "",
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
        decisionId,
        timestamp: new Date(),
        brainVersion: "1.0.0",
        policy: DEFAULT_POLICY,
        overrideEvents: [overrideEvent]
      }
    },
    invariantsChecked: [],
    explanationId: ""
  };
  
  // Ajouter l'override à la décision
  originalDecision.outputs.metadata.overrideEvents.push(overrideEvent);
  
  // Logger la décision mise à jour
  logBrainDecision(originalDecision);
  
  return originalDecision;
}

/**
 * Rejoue une décision précédente
 */
export function replayDecision(decisionId: string): BrainDecision | null {
  // Dans une vraie implémentation, cela rechargerait le cerveau 
  // avec la version exacte utilisée à l'origine
  console.log(`[BrainEngine] Rejeu de la décision: ${decisionId}`);
  return null;
}