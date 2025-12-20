// Système d'explication des décisions du cerveau - Phase 3.4
import { BrainDecision } from './brainContracts';

/**
 * Explication d'une décision
 */
export interface DecisionExplanation {
  id: string;
  decisionId: string;
  summary: string;        // phrase simple utilisateur
  factors: string[];      // règles déclenchées
  rejectedWhy: Map<string, string>;  // raisons par tâche (taskId -> reason)
  confidence: number;     // score de robustesse (0.0-1.0)
}

/**
 * Base de données simulée pour le stockage des explications
 */
let explanationDatabase: DecisionExplanation[] = [];

/**
 * Génère une explication pour une décision
 */
export function generateDecisionExplanation(decision: BrainDecision): DecisionExplanation {
  // Extraire les facteurs clés de la décision
  const factors: string[] = [];
  
  // Ajouter les règles d'invariants vérifiées
  if (decision.invariantsChecked) {
    factors.push(...decision.invariantsChecked);
  }
  
  // Ajouter le mode système
  factors.push(`Mode: ${decision.outputs.mode.current}`);
  
  // Ajouter la politique de décision
  factors.push(`Politique: ${decision.outputs.metadata.policy.level}`);
  
  // Générer le résumé
  const summary = generateSummary(decision);
  
  // Générer les raisons de rejet
  const rejectedWhy = new Map<string, string>();
  if (decision.outputs.rejected.reasons) {
    for (const [taskId, reason] of decision.outputs.rejected.reasons.entries()) {
      rejectedWhy.set(taskId, reason);
    }
  }
  
  const explanation: DecisionExplanation = {
    id: `explanation_${decision.id}`,
    decisionId: decision.id,
    summary,
    factors,
    rejectedWhy,
    confidence: 0.95 // Confiance élevée car basé sur des règles explicites
  };
  
  // Stocker l'explication
  explanationDatabase.push(explanation);
  
  return explanation;
}

/**
 * Génère un résumé simple de la décision
 */
function generateSummary(decision: BrainDecision): string {
  const taskCount = decision.outputs.session.allowedTasks.length;
  const mode = decision.outputs.mode.current;
  const policy = decision.outputs.metadata.policy.level;
  
  if (taskCount === 0) {
    return `Aucune tâche sélectionnée en mode ${mode} avec politique ${policy}`;
  }
  
  return `${taskCount} tâche(s) sélectionnée(s) en mode ${mode} avec politique ${policy}`;
}

/**
 * Récupère une explication par son ID
 */
export function getDecisionExplanation(explanationId: string): DecisionExplanation | undefined {
  return explanationDatabase.find(e => e.id === explanationId);
}

/**
 * Récupère l'explication d'une décision
 */
export function getExplanationForDecision(decisionId: string): DecisionExplanation | undefined {
  return explanationDatabase.find(e => e.decisionId === decisionId);
}

/**
 * Formate l'explication pour l'utilisateur
 */
export function formatExplanationForUser(explanation: DecisionExplanation): string {
  let result = `${explanation.summary}\n\nFacteurs pris en compte:\n`;
  
  for (const factor of explanation.factors) {
    result += `- ${factor}\n`;
  }
  
  if (explanation.rejectedWhy.size > 0) {
    result += "\nTâches rejetées:\n";
    for (const [taskId, reason] of explanation.rejectedWhy.entries()) {
      result += `- ${taskId}: ${reason}\n`;
    }
  }
  
  result += `\nConfiance: ${(explanation.confidence * 100).toFixed(1)}%`;
  
  return result;
}