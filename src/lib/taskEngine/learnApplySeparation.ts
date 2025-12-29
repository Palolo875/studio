// Séparation de l'apprentissage et de l'application - Phase 3.7
import { LearnedInsight, SuggestedAdjustment, isAdjustmentAllowed, LearningConstraints } from './passiveLearning';
import { BrainDecision } from './brainContracts';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LearnApplySeparation');

/**
 * État d'une proposition d'ajustement
 */
export type AdjustmentStatus = 
  | "PENDING"     // En attente d'approbation
  | "APPROVED"    // Approuvé par l'utilisateur
  | "REJECTED"    // Rejeté par l'utilisateur
  | "APPLIED";    // Appliqué au système

/**
 * Proposition d'ajustement avec suivi
 */
export interface TrackedAdjustment extends SuggestedAdjustment {
  status: AdjustmentStatus;
  approvedAt?: Date;
  appliedAt?: Date;
  userId?: string; // ID de l'utilisateur ayant approuvé
}

/**
 * Historique des ajustements appliqués
 */
export interface AppliedChange {
  id: string;
  triggeredBy: "USER";
  basedOnInsight: string; // ID de l'insight
  previousValue: any;
  newValue: any;
  appliedAt: Date;
}

/**
 * Gestionnaire de séparation apprentissage/application
 */
export class LearnApplySeparator {
  private trackedAdjustments: TrackedAdjustment[] = [];
  private appliedChanges: AppliedChange[] = [];
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
   * Propose un ajustement basé sur un insight
   */
  proposeAdjustment(insight: LearnedInsight, proposal: Omit<SuggestedAdjustment, 'insightId'>): TrackedAdjustment | null {
    // Créer l'ajustement proposé
    const adjustment: TrackedAdjustment = {
      ...proposal,
      insightId: insight.id,
      status: "PENDING",
      requiresUserApproval: true
    };
    
    // Vérifier si l'ajustement est autorisé
    if (!isAdjustmentAllowed(adjustment, this.constraints)) {
      logger.info('Ajustement non autorisé', { proposal: adjustment.proposal });
      return null;
    }
    
    // Ajouter à la liste des ajustements suivis
    this.trackedAdjustments.push(adjustment);
    logger.info('Nouvel ajustement proposé', { proposal: adjustment.proposal });
    
    return adjustment;
  }
  
  /**
   * Approuve un ajustement
   */
  approveAdjustment(adjustmentId: string, userId: string): boolean {
    const adjustment = this.trackedAdjustments.find(a => a.insightId === adjustmentId);
    
    if (!adjustment) {
      logger.warn('Ajustement non trouvé', { adjustmentId });
      return false;
    }
    
    // Mettre à jour le statut
    adjustment.status = "APPROVED";
    adjustment.approvedAt = new Date();
    adjustment.userId = userId;
    
    logger.info('Ajustement approuvé', { proposal: adjustment.proposal });
    return true;
  }
  
  /**
   * Rejette un ajustement
   */
  rejectAdjustment(adjustmentId: string): boolean {
    const adjustment = this.trackedAdjustments.find(a => a.insightId === adjustmentId);
    
    if (!adjustment) {
      logger.warn('Ajustement non trouvé', { adjustmentId });
      return false;
    }
    
    // Mettre à jour le statut
    adjustment.status = "REJECTED";
    
    logger.info('Ajustement rejeté', { proposal: adjustment.proposal });
    return true;
  }
  
  /**
   * Applique un ajustement approuvé
   */
  applyAdjustment(adjustmentId: string, previousValue: any, newValue: any): boolean {
    const adjustment = this.trackedAdjustments.find(a => a.insightId === adjustmentId);
    
    if (!adjustment) {
      logger.warn('Ajustement non trouvé', { adjustmentId });
      return false;
    }
    
    // Vérifier que l'ajustement est approuvé
    if (adjustment.status !== "APPROVED") {
      logger.warn('Ajustement non approuvé', { adjustmentId });
      return false;
    }
    
    // Mettre à jour le statut
    adjustment.status = "APPLIED";
    adjustment.appliedAt = new Date();
    
    // Enregistrer le changement appliqué
    const change: AppliedChange = {
      id: `change_${Date.now()}`,
      triggeredBy: "USER",
      basedOnInsight: adjustment.insightId,
      previousValue,
      newValue,
      appliedAt: new Date()
    };
    
    this.appliedChanges.push(change);
    
    logger.info('Ajustement appliqué', { proposal: adjustment.proposal });
    return true;
  }
  
  /**
   * Obtient les ajustements en attente
   */
  getPendingAdjustments(): TrackedAdjustment[] {
    return this.trackedAdjustments.filter(a => a.status === "PENDING");
  }
  
  /**
   * Obtient les ajustements approuvés mais non appliqués
   */
  getApprovedAdjustments(): TrackedAdjustment[] {
    return this.trackedAdjustments.filter(a => a.status === "APPROVED");
  }
  
  /**
   * Obtient l'historique des changements appliqués
   */
  getAppliedChanges(): AppliedChange[] {
    return [...this.appliedChanges];
  }
  
  /**
   * Réinitialise le suivi
   */
  reset(): void {
    this.trackedAdjustments = [];
    this.appliedChanges = [];
  }
}

// Instance singleton pour la séparation apprentissage/application
export const learnApplySeparator = new LearnApplySeparator();

/**
 * Pipeline d'apprentissage contrôlé
 */
export class ControlledLearningPipeline {
  private separator: LearnApplySeparator;
  
  constructor() {
    this.separator = learnApplySeparator;
  }
  
  /**
   * Processus complet d'apprentissage contrôlé
   */
  processLearningCycle(insights: LearnedInsight[]): TrackedAdjustment[] {
    const proposedAdjustments: TrackedAdjustment[] = [];
    
    // Pour chaque insight, proposer un ajustement
    for (const insight of insights) {
      let proposal: Omit<SuggestedAdjustment, 'insightId'> | null = null;
      
      // Générer une proposition basée sur le type d'insight
      switch (insight.type) {
        case "PATTERN":
          if (insight.description.includes("matin")) {
            proposal = {
              proposal: "Programmer plus de tâches importantes le matin",
              affectedParameter: "task_scheduling",
              previewEffect: "Augmentation potentielle de la complétion",
              requiresUserApproval: true
            };
          }
          break;
          
        case "RISK":
          if (insight.description.includes("échec")) {
            proposal = {
              proposal: "Proposer des tâches plus simples ou mieux décomposées",
              affectedParameter: "task_complexity",
              previewEffect: "Réduction potentielle du taux d'échec",
              requiresUserApproval: true
            };
          }
          break;
          
        case "BIAS":
          if (insight.description.includes("faible impact")) {
            proposal = {
              proposal: "Mettre en avant les tâches à fort impact",
              affectedParameter: "task_prioritization",
              previewEffect: "Meilleur ratio effort/impact",
              requiresUserApproval: true
            };
          }
          break;
      }
      
      // Si une proposition a été générée, la proposer
      if (proposal) {
        const adjustment = this.separator.proposeAdjustment(insight, proposal);
        if (adjustment) {
          proposedAdjustments.push(adjustment);
        }
      }
    }
    
    return proposedAdjustments;
  }
}