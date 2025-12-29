// Système de coût cognitif explicite - Phase 3.9
import { Task } from './types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CognitiveCost');

/**
 * Actions à coût cognitif
 */
export type CostlyAction = 
  | "OVERRIDE" 
  | "FORCE_MODE" 
  | "EXTRA_TASK";

/**
 * Coût cognitif d'une action
 */
export interface CognitiveCost {
  action: CostlyAction;
  estimatedCost: number; // Pourcentage de la capacité cognitive restante
  acknowledged: boolean;
  taskId?: string; // ID de la tâche concernée, si applicable
}

/**
 * Gestionnaire de coûts cognitifs
 */
export class CognitiveCostManager {
  private userCapacity: number; // Capacité cognitive totale (100%)
  private consumedCapacity: number; // Capacité déjà consommée
  
  constructor(initialCapacity: number = 100) {
    this.userCapacity = initialCapacity;
    this.consumedCapacity = 0;
  }
  
  /**
   * Calcule le coût estimé d'une action
   */
  estimateCost(action: CostlyAction, context?: any): CognitiveCost {
    let cost = 0;
    
    switch (action) {
      case "OVERRIDE":
        // Le coût d'un override dépend du nombre d'overrides récents
        cost = 15 + (context?.recentOverrideCount || 0) * 5;
        break;
        
      case "FORCE_MODE":
        // Forcer un mode coûte plus cher
        cost = 25;
        break;
        
      case "EXTRA_TASK":
        // Le coût d'une tâche supplémentaire dépend de sa complexité
        const taskEffort = context?.taskEffort || "M";
        const effortCosts: Record<string, number> = { "S": 10, "M": 20, "L": 35 };
        cost = effortCosts[taskEffort] || 20;
        break;
    }
    
    // Limiter le coût à 50% maximum
    cost = Math.min(50, cost);
    
    return {
      action,
      estimatedCost: cost,
      acknowledged: false
    };
  }
  
  /**
   * Consomme de la capacité cognitive
   */
  consumeCapacity(cost: CognitiveCost): void {
    this.consumedCapacity += cost.estimatedCost;
    cost.acknowledged = true;
    
    logger.info('Capacité consommée', { consumedPercent: cost.estimatedCost, remainingPercent: this.getRemainingCapacity() });
  }
  
  /**
   * Obtient la capacité restante
   */
  getRemainingCapacity(): number {
    return Math.max(0, this.userCapacity - this.consumedCapacity);
  }
  
  /**
   * Réinitialise la capacité (à utiliser en début de journée par exemple)
   */
  resetCapacity(): void {
    this.consumedCapacity = 0;
    logger.info('Capacité réinitialisée');
  }
  
  /**
   * Génère un message UX pour le coût cognitif
   */
  generateCostMessage(cost: CognitiveCost, context?: any): string {
    const remaining = this.getRemainingCapacity();
    const afterCost = Math.max(0, remaining - cost.estimatedCost);
    
    switch (cost.action) {
      case "OVERRIDE":
        return `Forcer cette décision consommera ~${cost.estimatedCost}% de ta capacité restante (${remaining}% → ${afterCost}%).\nContinuer ? [Oui] [Annuler]`;
        
      case "FORCE_MODE":
        return `Forcer ce mode consommera ~${cost.estimatedCost}% de ta capacité restante (${remaining}% → ${afterCost}%).\nContinuer ? [Oui] [Annuler]`;
        
      case "EXTRA_TASK":
        const taskName = context?.taskName || "cette tâche";
        return `Ajouter ${taskName} consommera ~${cost.estimatedCost}% de ta capacité restante (${remaining}% → ${afterCost}%).\nContinuer ? [Oui] [Annuler]`;
        
      default:
        return `Cette action consommera ~${cost.estimatedCost}% de ta capacité restante (${remaining}% → ${afterCost}%).\nContinuer ? [Oui] [Annuler]`;
    }
  }
}

// Instance singleton pour la gestion des coûts cognitifs
export const cognitiveCostManager = new CognitiveCostManager();

/**
 * Vérifie si une action est autorisée en fonction du coût cognitif
 */
export function isActionAllowed(action: CostlyAction, context?: any): { allowed: boolean; cost?: CognitiveCost; message?: string } {
  const cost = cognitiveCostManager.estimateCost(action, context);
  const remainingCapacity = cognitiveCostManager.getRemainingCapacity();
  
  // Si le coût dépasse la capacité restante, l'action n'est pas autorisée
  if (cost.estimatedCost > remainingCapacity) {
    return {
      allowed: false,
      cost,
      message: `Action refusée : coût trop élevé (${cost.estimatedCost}%) par rapport à la capacité restante (${remainingCapacity}%)`
    };
  }
  
  // L'action est autorisée, générer le message
  const message = cognitiveCostManager.generateCostMessage(cost, context);
  
  return {
    allowed: true,
    cost,
    message
  };
}