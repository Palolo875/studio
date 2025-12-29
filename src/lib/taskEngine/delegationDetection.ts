// Système de détection de délégation totale - Phase 3.9
import { Task } from './types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DelegationDetection');

/**
 * Signaux de délégation totale
 */
export interface DelegationSignals {
  signals: string[]; // Mots-clés ou phrases indiquant une demande de délégation
  response: "REFRAME" | "REDIRECT" | "ASK_CLARIFY";
}

/**
 * Détecteur de délégation
 */
export class DelegationDetector {
  private delegationSignals: DelegationSignals;
  
  constructor(signals?: DelegationSignals) {
    this.delegationSignals = signals || {
      signals: ["tell_me_what_to_do", "decide_for_me", "choose_for_me", "what_should_i_do", "help_me_decide"],
      response: "REFRAME"
    };
  }
  
  /**
   * Détecte si une requête utilisateur indique une délégation totale
   */
  detectDelegation(userRequest: string): boolean {
    const lowerRequest = userRequest.toLowerCase();
    
    // Vérifier si la requête contient des mots-clés de délégation
    return this.delegationSignals.signals.some(signal => 
      lowerRequest.includes(signal.toLowerCase())
    );
  }
  
  /**
   * Génère une réponse appropriée à une demande de délégation
   */
  generateResponse(userRequest: string): string {
    // Si ce n'est pas une demande de délégation, retourner une réponse neutre
    if (!this.detectDelegation(userRequest)) {
      return "Je peux t'aider à organiser tes tâches. Qu'est-ce que tu aimerais faire maintenant ?";
    }
    
    // Générer une réponse selon le type configuré
    switch (this.delegationSignals.response) {
      case "REFRAME":
        return "Je peux t'aider à clarifier.\nMais le choix final t'appartient.";
        
      case "REDIRECT":
        return "Plutôt que de décider pour toi, je peux te montrer les options disponibles.\nQuel aspect de ton travail est le plus urgent ?";
        
      case "ASK_CLARIFY":
        return "Pour t'aider au mieux, peux-tu me dire :\n- Quel est ton objectif principal ?\n- Quelles contraintes as-tu ?";
        
      default:
        return "Je peux t'aider à clarifier.\nMais le choix final t'appartient.";
    }
  }
  
  /**
   * Ajoute un nouveau signal de délégation
   */
  addDelegationSignal(signal: string): void {
    if (!this.delegationSignals.signals.includes(signal)) {
      this.delegationSignals.signals.push(signal);
      logger.info('Nouveau signal ajouté', { signal });
    }
  }
  
  /**
   * Retire un signal de délégation
   */
  removeDelegationSignal(signal: string): void {
    const index = this.delegationSignals.signals.indexOf(signal);
    if (index > -1) {
      this.delegationSignals.signals.splice(index, 1);
      logger.info('Signal retiré', { signal });
    }
  }
}

// Instance singleton pour la détection de délégation
export const delegationDetector = new DelegationDetector();

/**
 * Middleware pour intercepter les demandes de délégation
 */
export function handleDelegationRequest(userRequest: string): { isDelegation: boolean; response: string } {
  const isDelegation = delegationDetector.detectDelegation(userRequest);
  const response = delegationDetector.generateResponse(userRequest);
  
  if (isDelegation) {
    logger.info('Demande de délégation détectée', { userRequest });
  }
  
  return {
    isDelegation,
    response
  };
}

/**
 * Analyse les tendances de délégation dans l'historique des requêtes
 */
export function analyzeDelegationTrends(requestHistory: string[]): { 
  delegationCount: number; 
  delegationRate: number; 
  trend: "increasing" | "decreasing" | "stable" 
} {
  const delegationRequests = requestHistory.filter(request => 
    delegationDetector.detectDelegation(request)
  );
  
  const delegationCount = delegationRequests.length;
  const delegationRate = requestHistory.length > 0 ? 
    delegationCount / requestHistory.length : 0;
  
  // Analyser la tendance (simplifiée pour cet exemple)
  let trend: "increasing" | "decreasing" | "stable" = "stable";
  
  if (requestHistory.length >= 10) {
    const recentRequests = requestHistory.slice(-5);
    const olderRequests = requestHistory.slice(-10, -5);
    
    const recentDelegationCount = recentRequests.filter(request => 
      delegationDetector.detectDelegation(request)
    ).length;
    
    const olderDelegationCount = olderRequests.filter(request => 
      delegationDetector.detectDelegation(request)
    ).length;
    
    if (recentDelegationCount > olderDelegationCount) {
      trend = "increasing";
    } else if (recentDelegationCount < olderDelegationCount) {
      trend = "decreasing";
    }
  }
  
  return {
    delegationCount,
    delegationRate,
    trend
  };
}