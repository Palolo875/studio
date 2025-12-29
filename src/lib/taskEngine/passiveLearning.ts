// Système d'apprentissage passif - Phase 3.7
import { BrainDecision } from './brainContracts';
import { TaskOutcome } from './taskOutcome';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PassiveLearning');

/**
 * Types d'insights appris
 */
export type LearnedInsightType =
  | "PATTERN"   // Pattern comportemental
  | "BIAS"      // Biais détecté
  | "RISK";     // Risque identifié

/**
 * Insights appris
 */
export interface LearnedInsight {
  id: string;
  type: LearnedInsightType;
  description: string;
  confidence: number; // 0.0 - 1.0
  basedOn: string[]; // Références aux données sources
  createdAt: Date;
}

/**
 * Ajustements suggérés
 */
export interface SuggestedAdjustment {
  insightId: string;
  proposal: string;
  affectedParameter: string;
  previewEffect: string;
  requiresUserApproval: true;
}

/**
 * Contraintes d'apprentissage
 */
export interface LearningConstraints {
  maxAdjustmentPerDay: number; // Pourcentage maximum d'ajustement par jour
  minBaselineReset: number;    // Réinitialisation de la baseline (en jours)
  forbiddenLearns: string[];   // Types d'apprentissage interdits
}

/**
 * Changements appliqués (Phase 3.7.4)
 */
export interface AppliedChange {
  id: string;
  triggeredBy: "USER";
  basedOnInsight: string;
  previousValue: any;
  newValue: any;
  appliedAt: Date;
}

/**
 * Vérifie si un ajustement est autorisé
 * @param adjustment Ajustement proposé
 * @param constraints Contraintes d'apprentissage
 * @returns Booléen indiquant si l'ajustement est autorisé
 */
export function isAdjustmentAllowed(
  adjustment: SuggestedAdjustment,
  constraints: LearningConstraints
): boolean {
  // Ici, nous pourrions implémenter une logique plus complexe,
  // par exemple, en vérifiant si le nombre d'ajustements par jour
  // n'est pas dépassé.
  
  // Pour l'instant, nous autorisons tous les ajustements
  return true;
}

/**
 * Gestionnaire d'apprentissage passif SOTA
 */
export class PassiveLearningEngine {
  private insights: LearnedInsight[] = [];
  private history: AppliedChange[] = [];
  private constraints: LearningConstraints;

  constructor(constraints?: LearningConstraints) {
    this.constraints = constraints || {
      maxAdjustmentPerDay: 0.15, // 15%
      minBaselineReset: 7,
      forbiddenLearns: [
        "chronic_overwork",
        "chronic_avoidance",
        "always_override",
        "sleep_deprivation"
      ]
    };
  }

  /**
   * Analyse sans modifier (Phase 3.7.3)
   */
  captureInsight(type: LearnedInsightType, description: string, evidence: string[]): LearnedInsight | null {
    // Loi 3 : Interdiction d'apprendre des patterns dysfonctionnels
    const isForbidden = this.constraints.forbiddenLearns.some(f =>
      description.toLowerCase().includes(f.replace("_", " "))
    );

    if (isForbidden) {
      logger.info('Insight bloqué par garde-fou SOTA', { description });
      return null;
    }

    const insight: LearnedInsight = {
      id: `insight_${Date.now()}`,
      type,
      description,
      confidence: 0.7, // Confiance initiale prudente
      basedOn: evidence,
      createdAt: new Date()
    };

    this.insights.push(insight);
    return insight;
  }

  /**
   * Phase 3.7.2 : Suggérer au lieu d'Imposer
   */
  proposeAdjustment(insight: LearnedInsight): SuggestedAdjustment | null {
    // Heuristique simple pour la Phase 3
    return {
      insightId: insight.id,
      proposal: `Ajuster les recommandations basé sur: ${insight.description}`,
      affectedParameter: "scheduling_bias",
      previewEffect: "Meilleure adéquation avec vos patterns réels",
      requiresUserApproval: true
    };
  }

  /**
   * Phase 3.7.4 : Application explicite et historisée
   */
  applyAdjustment(adjustment: SuggestedAdjustment, userApproved: boolean): AppliedChange | null {
    if (!userApproved) return null;

    const change: AppliedChange = {
      id: `change_${Date.now()}`,
      triggeredBy: "USER",
      basedOnInsight: adjustment.insightId,
      previousValue: null, // À mapper selon le paramètre
      newValue: adjustment.proposal,
      appliedAt: new Date()
    };

    this.history.push(change);
    logger.info('Changement appliqué et historisé', { changeId: change.id });
    return change;
  }
}
