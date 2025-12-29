// Système de limitation douce - Phase 3.9
import { OverrideEvent } from './brainContracts';
import { CognitiveCost, cognitiveCostManager } from './cognitiveCost';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SoftLimitation');

/**
 * Paramètres de limitation douce
 */
export interface SoftLimitationParams {
  windowMinutes: number;
  maxActions: number;
  effect: "CONFIRMATION_REQUIRED" | "DELAY" | "WARNING" | "REDUCE_SUGGESTIONS";
}

/**
 * Gestionnaire de limitation douce
 */
export class SoftLimitationManager {
  private limitationParams: SoftLimitationParams;
  private actionHistory: Date[] = [];
  
  constructor(params?: SoftLimitationParams) {
    this.limitationParams = params || {
      windowMinutes: 60,
      maxActions: 3,
      effect: "CONFIRMATION_REQUIRED"
    };
  }
  
  /**
   * Vérifie si une action est autorisée selon les limites douces
   */
  isActionAllowed(): { allowed: boolean; reason?: string } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.limitationParams.windowMinutes * 60 * 1000);
    
    // Nettoyer l'historique ancien
    this.actionHistory = this.actionHistory.filter(timestamp => timestamp >= windowStart);
    
    // Vérifier si la limite est atteinte
    if (this.actionHistory.length >= this.limitationParams.maxActions) {
      return {
        allowed: false,
        reason: `Limite d'actions atteinte (${this.limitationParams.maxActions} dans les ${this.limitationParams.windowMinutes} dernières minutes)`
      };
    }
    
    // Enregistrer cette action
    this.actionHistory.push(now);
    
    return { allowed: true };
  }
  
  /**
   * Applique l'effet de limitation douce
   */
  applyLimitationEffect(): string {
    switch (this.limitationParams.effect) {
      case "CONFIRMATION_REQUIRED":
        return "Tu as déjà forcé plusieurs décisions récemment.\nConfirme consciemment.";
        
      case "DELAY":
        return "Attends quelques minutes avant de forcer une autre décision.";
        
      case "WARNING":
        return "Attention : forcer trop de décisions peut nuire à ta productivité.";
        
      case "REDUCE_SUGGESTIONS":
        return "Pour préserver ta concentration, je réduis le nombre de suggestions.";
        
      default:
        return "Confirmation requise pour continuer.";
    }
  }
  
  /**
   * Réinitialise l'historique des actions
   */
  resetActionHistory(): void {
    this.actionHistory = [];
    logger.info('Historique des actions réinitialisé');
  }
  
  /**
   * Met à jour les paramètres de limitation
   */
  updateParams(newParams: Partial<SoftLimitationParams>): void {
    this.limitationParams = { ...this.limitationParams, ...newParams };
    logger.debug('Paramètres mis à jour', { params: this.limitationParams });
  }
}

// Instance singleton pour la limitation douce
export const softLimitationManager = new SoftLimitationManager();

/**
 * Middleware pour gérer la limitation douce des overrides
 */
export class OverrideSoftLimiter {
  private limitationManager: SoftLimitationManager;
  
  constructor() {
    // Configurer la limitation douce pour les overrides
    this.limitationManager = softLimitationManager;
    this.limitationManager.updateParams({
      windowMinutes: 60,
      maxActions: 3,
      effect: "CONFIRMATION_REQUIRED"
    });
  }
  
  /**
   * Vérifie et gère un override avec limitation douce
   */
  handleOverride(overrideEvent: OverrideEvent): { 
    allowed: boolean; 
    message?: string; 
    cost?: CognitiveCost 
  } {
    // Vérifier d'abord les limites douces
    const limitationCheck = this.limitationManager.isActionAllowed();
    
    if (!limitationCheck.allowed) {
      // Si la limite est atteinte, retourner le message approprié
      return {
        allowed: false,
        message: this.limitationManager.applyLimitationEffect()
      };
    }
    
    // Si la limite n'est pas atteinte, vérifier le coût cognitif
    const costCheck = cognitiveCostManager.estimateCost("OVERRIDE", {
      recentOverrideCount: this.getRecentOverrideCount()
    });
    
    // Si le coût est trop élevé, refuser l'override
    const remainingCapacity = cognitiveCostManager.getRemainingCapacity();
    if (costCheck.estimatedCost > remainingCapacity) {
      return {
        allowed: false,
        message: `Action refusée : coût trop élevé (${costCheck.estimatedCost}%) par rapport à la capacité restante (${remainingCapacity}%)`,
        cost: costCheck
      };
    }
    
    // L'override est autorisé, générer le message de confirmation
    const message = cognitiveCostManager.generateCostMessage(costCheck);
    
    return {
      allowed: true,
      message,
      cost: costCheck
    };
  }
  
  /**
   * Compte les overrides récents
   */
  private getRecentOverrideCount(): number {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Cela dépendrait de l'implémentation réelle du système d'overrides
    // Pour l'instant, nous retournons un nombre simulé
    return 0;
  }
}

// Instance singleton pour le limiteur d'overrides
export const overrideSoftLimiter = new OverrideSoftLimiter();

/**
 * Gestionnaire de limitation douce pour différents types d'actions
 */
export class MultiActionSoftLimiter {
  private limiters: Map<string, SoftLimitationManager> = new Map();
  
  constructor() {
    // Créer des limiteurs pour différents types d'actions
    this.limiters.set("OVERRIDE", new SoftLimitationManager({
      windowMinutes: 60,
      maxActions: 3,
      effect: "CONFIRMATION_REQUIRED"
    }));
    
    this.limiters.set("FORCE_MODE", new SoftLimitationManager({
      windowMinutes: 30,
      maxActions: 2,
      effect: "WARNING"
    }));
    
    this.limiters.set("EXTRA_TASK", new SoftLimitationManager({
      windowMinutes: 120,
      maxActions: 5,
      effect: "REDUCE_SUGGESTIONS"
    }));
  }
  
  /**
   * Vérifie et gère une action avec limitation douce
   */
  handleAction(actionType: string, context?: any): { 
    allowed: boolean; 
    message?: string;
    delayMs?: number 
  } {
    const limiter = this.limiters.get(actionType);
    
    if (!limiter) {
      // Si aucun limiteur n'est configuré pour ce type d'action, l'autoriser
      return { allowed: true };
    }
    
    // Vérifier si l'action est autorisée
    const check = limiter.isActionAllowed();
    
    if (!check.allowed) {
      // Appliquer l'effet approprié
      const message = limiter.applyLimitationEffect();
      
      // Si l'effet est un délai, calculer la durée
      let delayMs: number | undefined;
      if (limiter["limitationParams"].effect === "DELAY") {
        delayMs = 5000; // 5 secondes de délai
      }
      
      return { allowed: false, message, delayMs };
    }
    
    // L'action est autorisée
    return { allowed: true };
  }
  
  /**
   * Réinitialise tous les limiteurs
   */
  resetAllLimiters(): void {
    for (const limiter of this.limiters.values()) {
      limiter.resetActionHistory();
    }
    logger.info('Tous les limiteurs réinitialisés');
  }
}

// Instance singleton pour le limiteur multi-actions
export const multiActionSoftLimiter = new MultiActionSoftLimiter();