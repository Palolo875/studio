// Système d'apprentissage passif - Phase 3.7
import { BrainDecision } from './brainContracts';
import { TaskOutcome } from './taskOutcome';

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
 * Détection de patterns comportementaux
 */
export class BehavioralPatternDetector {
  private insights: LearnedInsight[] = [];
  private constraints: LearningConstraints;
  
  constructor(constraints?: LearningConstraints) {
    this.constraints = constraints || {
      maxAdjustmentPerDay: 15,
      minBaselineReset: 7,
      forbiddenLearns: [
        "chronic_overwork",
        "chronic_avoidance",
        "always_override"
      ]
    };
  }
  
  /**
   * Analyse les décisions passées pour détecter des patterns
   */
  analyzeDecisionPatterns(decisions: BrainDecision[]): void {
    // Compter les overrides
    const overrideCount = decisions.filter(d => 
      d.outputs.metadata.overrideEvents.length > 0
    ).length;
    
    // Si plus de 30% des décisions ont des overrides, c'est un pattern
    if (decisions.length > 0 && (overrideCount / decisions.length) > 0.3) {
      this.addInsight({
        id: `pattern_${Date.now()}`,
        type: "PATTERN",
        description: "Tendance à outrepasser les décisions du système",
        confidence: 0.8,
        basedOn: [`override_rate:${(overrideCount / decisions.length).toFixed(2)}`],
        createdAt: new Date()
      });
    }
    
    // Analyser les horaires des décisions
    const morningDecisions = decisions.filter(d => 
      d.timestamp.getHours() >= 6 && d.timestamp.getHours() < 12
    ).length;
    
    const eveningDecisions = decisions.filter(d => 
      d.timestamp.getHours() >= 18 && d.timestamp.getHours() < 24
    ).length;
    
    // Si 70% des décisions sont le matin, c'est un pattern
    if (decisions.length > 0 && (morningDecisions / decisions.length) > 0.7) {
      this.addInsight({
        id: `pattern_${Date.now()}_morning`,
        type: "PATTERN",
        description: "Productivité plus élevée le matin",
        confidence: 0.9,
        basedOn: [`morning_rate:${(morningDecisions / decisions.length).toFixed(2)}`],
        createdAt: new Date()
      });
    }
  }
  
  /**
   * Analyse les résultats des tâches pour détecter des biais
   */
  analyzeTaskOutcomes(outcomes: TaskOutcome[]): void {
    // Calculer le taux d'échec
    const failedTasks = outcomes.filter(o => !o.completedAt).length;
    
    // Si plus de 50% des tâches échouent, c'est un risque
    if (outcomes.length > 0 && (failedTasks / outcomes.length) > 0.5) {
      this.addInsight({
        id: `risk_${Date.now()}`,
        type: "RISK",
        description: "Taux d'échec élevé des tâches",
        confidence: 0.7,
        basedOn: [`failure_rate:${(failedTasks / outcomes.length).toFixed(2)}`],
        createdAt: new Date()
      });
    }
    
    // Analyser le ratio effort/impact
    const avgEffortPerImpact = outcomes.reduce((sum, outcome) => {
      return sum + (outcome.effortCost / Math.max(0.1, outcome.impactScore));
    }, 0) / outcomes.length;
    
    // Si le ratio est très élevé, c'est un problème
    if (avgEffortPerImpact > 10) {
      this.addInsight({
        id: `bias_${Date.now()}`,
        type: "BIAS",
        description: "Tendance à choisir des tâches à faible impact relatif",
        confidence: 0.85,
        basedOn: [`avg_effort_impact:${avgEffortPerImpact.toFixed(2)}`],
        createdAt: new Date()
      });
    }
  }
  
  /**
   * Ajoute un insight appris
   */
  private addInsight(insight: LearnedInsight): void {
    // Vérifier si ce type d'apprentissage est autorisé
    if (this.constraints.forbiddenLearns.includes(insight.description.toLowerCase().replace(/\s+/g, '_'))) {
      console.log(`[PassiveLearning] Apprentissage interdit ignoré: ${insight.description}`);
      return;
    }
    
    this.insights.push(insight);
    console.log(`[PassiveLearning] Nouvel insight appris: ${insight.description}`);
  }
  
  /**
   * Obtient tous les insights
   */
  getInsights(): LearnedInsight[] {
    return [...this.insights];
  }
  
  /**
   * Génère des ajustements suggérés basés sur les insights
   */
  generateSuggestedAdjustments(): SuggestedAdjustment[] {
    const adjustments: SuggestedAdjustment[] = [];
    
    // Pour chaque insight, générer une suggestion appropriée
    for (const insight of this.insights) {
      switch (insight.type) {
        case "PATTERN":
          if (insight.description.includes("matin")) {
            adjustments.push({
              insightId: insight.id,
              proposal: "Programmer plus de tâches importantes le matin",
              affectedParameter: "task_scheduling",
              previewEffect: "Augmentation potentielle de la complétion",
              requiresUserApproval: true
            });
          }
          break;
          
        case "RISK":
          if (insight.description.includes("échec")) {
            adjustments.push({
              insightId: insight.id,
              proposal: "Proposer des tâches plus simples ou mieux décomposées",
              affectedParameter: "task_complexity",
              previewEffect: "Réduction potentielle du taux d'échec",
              requiresUserApproval: true
            });
          }
          break;
          
        case "BIAS":
          if (insight.description.includes("faible impact")) {
            adjustments.push({
              insightId: insight.id,
              proposal: "Mettre en avant les tâches à fort impact",
              affectedParameter: "task_prioritization",
              previewEffect: "Meilleur ratio effort/impact",
              requiresUserApproval: true
            });
          }
          break;
      }
    }
    
    return adjustments;
  }
  
  /**
   * Réinitialise les insights
   */
  reset(): void {
    this.insights = [];
  }
}

// Instance singleton pour la détection de patterns
export const patternDetector = new BehavioralPatternDetector();

/**
 * Vérifie si un ajustement est autorisé selon les contraintes
 */
export function isAdjustmentAllowed(adjustment: SuggestedAdjustment, constraints: LearningConstraints): boolean {
  // Vérifier si l'ajustement nécessite une approbation utilisateur
  if (!adjustment.requiresUserApproval) {
    console.warn(`[PassiveLearning] Ajustement sans approbation utilisateur détecté: ${adjustment.proposal}`);
    return false;
  }
  
  // Vérifier si le paramètre affecté est dans la liste des interdits
  if (constraints.forbiddenLearns.includes(adjustment.affectedParameter)) {
    console.log(`[PassiveLearning] Ajustement interdit ignoré: ${adjustment.proposal}`);
    return false;
  }
  
  // L'ajustement est autorisé
  return true;
}