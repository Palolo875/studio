// Adaptation Validation - Validation des adaptations et gouvernance
// Implémentation de l'étape 3 : Validation des Adaptations et Gouvernance

import { ParameterDelta } from './adaptationMemory';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptationValidation');

// Interface pour l'impact d'une adaptation
export interface AdaptationImpact {
  currentBehavior: string;
  proposedBehavior: string;
  estimatedEffect: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  confidence: number;
}

// Interface pour une proposition d'adaptation
export interface AdaptationProposal {
  id: string;
  proposedChanges: ParameterDelta[];
  reason: string;
  userConsentRequired: boolean;
  consentGiven: boolean | null;  // Null signifie en attente
  timestamp: number;
  impact?: AdaptationImpact;  // Ajout de l'impact
}

// Interface pour le résultat d'une validation
export interface ValidationResult {
  approved: boolean;
  reason: string;
  needsHumanReview: boolean;
}

// Types d'actions possibles
export type UserAction = "ACCEPT" | "REJECT" | "POSTPONE";

// Classe pour gérer la validation des adaptations
export class AdaptationValidationManager {
  private proposals: AdaptationProposal[] = [];
  private validationThresholds = {
    maxTasks: 5,
    strictness: 0.4,
    overrideRate: 0.7
  };
  
  constructor() {}
  
  // Proposer une adaptation
  proposeAdaptationChange(change: Omit<AdaptationProposal, 'id' | 'timestamp' | 'consentGiven'>): AdaptationProposal {
    // Estimer l'impact si ce n'est pas déjà fourni
    const impact = 'impact' in change && change.impact ? change.impact : this.estimateImpact(change.proposedChanges);
    
    const proposal: AdaptationProposal = {
      id: this.generateId(),
      ...change,
      impact,  // Ajout de l'impact
      consentGiven: null,
      timestamp: Date.now()
    };
    
    this.proposals.push(proposal);
    
    // Si le consentement utilisateur est requis, afficher le modal
    if (proposal.userConsentRequired) {
      this.showAdaptationProposalModal(proposal);
    } else {
      // Appliquer directement les changements
      this.applyChanges(proposal.proposedChanges);
    }
    
    return proposal;
  }
  
  // Générer un ID unique
  private generateId(): string {
    return 'adapt_' + Date.now();
  }
  
  // Afficher le modal de proposition d'adaptation
  showAdaptationProposalModal(change: AdaptationProposal): void {
    // Estimer l'impact si ce n'est pas déjà fourni
    const impact = change.impact || this.estimateImpact(change.proposedChanges);
    
    logger.info('Showing adaptation proposal modal', {
      title: "Adaptation proposée",
      reason: change.reason,
      currentBehavior: impact.currentBehavior,
      proposedBehavior: impact.proposedBehavior,
      estimatedEffect: impact.estimatedEffect,
      confidence: impact.confidence,
      actions: [
        { label: "Accepter", value: "ACCEPT" },
        { label: "Refuser", value: "REJECT" },
        { label: "Reporter", value: "POSTPONE" }
      ]
    });
    
    // Dans une implémentation réelle, cela afficherait un modal dans l'UI
    // Pour l'instant, nous simulons une acceptation automatique
    this.handleUserAction(change.id, "ACCEPT");
  }
  
  // Gérer l'action de l'utilisateur
  handleUserAction(proposalId: string, action: UserAction): void {
    const proposal = this.proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      logger.error('Proposal not found', undefined, { proposalId });
      return;
    }
    
    switch (action) {
      case "ACCEPT":
        proposal.consentGiven = true;
        this.applyChanges(proposal.proposedChanges);
        logger.info('Adaptation proposal accepted and applied', { proposalId });
        break;
        
      case "REJECT":
        proposal.consentGiven = false;
        logger.info('Adaptation proposal rejected', { proposalId });
        break;
        
      case "POSTPONE":
        proposal.consentGiven = null;
        logger.info('Adaptation proposal postponed', { proposalId });
        break;
    }
  }
  
  private applyChanges(_changes: ParameterDelta[]): void {
    // TODO: connecter ce module au vrai store de paramètres.
    // Ici on garde un no-op pour préserver le flow sans console/alert.
  }
  
  // Estimer l'impact d'une adaptation
  private estimateImpact(changes: ParameterDelta[]): AdaptationImpact {
    // Implémentation simplifiée - dans une vraie application, cela serait plus complexe
    
    // Exemple de logique d'estimation
    let positiveFactors = 0;
    let negativeFactors = 0;
    
    for (const change of changes) {
      // Exemple de règles simples
      if (change.parameterName === 'maxTasks') {
        if (typeof change.newValue === 'number' && typeof change.oldValue === 'number') {
          if (change.newValue > change.oldValue) {
            positiveFactors += 1; // Plus de tâches peut augmenter la productivité
          } else {
            negativeFactors += 1; // Moins de tâches peut réduire le stress
          }
        }
      } else if (change.parameterName === 'strictness') {
        if (typeof change.newValue === 'number' && typeof change.oldValue === 'number') {
          if (change.newValue > change.oldValue) {
            negativeFactors += 1; // Plus de stricte peut augmenter le stress
          } else {
            positiveFactors += 1; // Moins de stricte peut réduire le stress
          }
        }
      }
    }
    
    // Déterminer l'effet estimé
    let estimatedEffect: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "NEUTRAL";
    if (positiveFactors > negativeFactors) {
      estimatedEffect = "POSITIVE";
    } else if (negativeFactors > positiveFactors) {
      estimatedEffect = "NEGATIVE";
    }
    
    // Calculer la confiance (simplifié)
    const confidence = Math.min(0.8, 0.5 + (Math.abs(positiveFactors - negativeFactors) * 0.1));
    
    return {
      currentBehavior: "Comportement actuel",
      proposedBehavior: "Comportement proposé",
      estimatedEffect,
      confidence
    };
  }
  
  // Valider une adaptation automatique
  validateAutomaticAdaptation(changes: ParameterDelta[]): ValidationResult {
    // Vérifier si l'adaptation dépasse les seuils critiques
    const needsUserConsent = this.requiresUserConsent(changes);
    
    // Vérifier s'il y a des incohérences ou des dérives
    const needsHumanReview = this.detectAnomalies(changes);
    
    return {
      approved: !needsHumanReview,
      reason: needsHumanReview 
        ? "Anomalies detected, requires human review" 
        : "No critical issues detected",
      needsHumanReview
    };
  }
  
  // Vérifier si le consentement utilisateur est requis
  private requiresUserConsent(changes: ParameterDelta[]): boolean {
    for (const change of changes) {
      if (change.parameterName === 'maxTasks' && 
          typeof change.newValue === 'number' && 
          change.newValue > this.validationThresholds.maxTasks) {
        return true;
      }
      
      if (change.parameterName === 'strictness' && 
          typeof change.newValue === 'number' && 
          change.newValue < this.validationThresholds.strictness) {
        return true;
      }
    }
    
    return false;
  }
  
  // Détecter les anomalies dans les changements
  private detectAnomalies(changes: ParameterDelta[]): boolean {
    // Implémentation simplifiée - dans une vraie application, cela serait plus complexe
    for (const change of changes) {
      // Vérifier si le changement est trop radical
      if (typeof change.oldValue === 'number' && typeof change.newValue === 'number') {
        const diff = Math.abs(change.newValue - change.oldValue);
        const relativeDiff = diff / Math.max(Math.abs(change.oldValue), 0.001);
        
        // Si le changement relatif est supérieur à 50%, cela nécessite une revue
        if (relativeDiff > 0.5) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Obtenir toutes les propositions
  getProposals(): AdaptationProposal[] {
    return [...this.proposals];
  }
  
  // Obtenir une proposition par ID
  getProposalById(id: string): AdaptationProposal | undefined {
    return this.proposals.find(p => p.id === id);
  }
  
  // Nettoyer les propositions anciennes
  cleanupOldProposals(maxAgeDays: number = 30): void {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;
    
    this.proposals = this.proposals.filter(
      proposal => proposal.timestamp > cutoffTime
    );
  }
}